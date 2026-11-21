// Server only: the casino's croupier. It posts hashed seeds ahead of time and reveals the
// right one to settle each bet. Every seed comes from CROUPIER_SEED, so nothing is stored:
// seed i = keccak256(CROUPIER_SEED, i). Keep CROUPIER_SEED and CROUPIER_KEY as safe as a
// treasury key: whoever has the seed knows upcoming results.

import { createPublicClient, createWalletClient, encodePacked, http, keccak256, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CASINO_CONTRACT, casinoAbi, robinhood } from "@/casino/chain";

const KEY = process.env.CROUPIER_KEY as Hex | undefined;
const SEED = process.env.CROUPIER_SEED as Hex | undefined;
const rpc = process.env.ROBINHOOD_RPC_URL || robinhood.rpcUrls.default.http[0];

export const croupierReady = !!(CASINO_CONTRACT && KEY && SEED && /^0x[0-9a-fA-F]{64}$/.test(SEED));

const pub = createPublicClient({ chain: robinhood, transport: http(rpc) });
const wallet = () => createWalletClient({ account: privateKeyToAccount(KEY!), chain: robinhood, transport: http(rpc) });

export const secretAt = (i: bigint) => keccak256(encodePacked(["bytes32", "uint256"], [SEED!, i]));
const commitAt = (i: bigint) => keccak256(encodePacked(["bytes32"], [secretAt(i)]));

const STATUS_OPEN = 1;
const BATCH = 40;
const LOW = 15;

// Keeps a stock of commits on chain, so bets never fail for lack of one
export async function topUpCommits() {
  const left = await pub.readContract({ address: CASINO_CONTRACT!, abi: casinoAbi, functionName: "commitsLeft" });
  if (left >= BigInt(LOW)) return null;
  const next = await pub.readContract({ address: CASINO_CONTRACT!, abi: casinoAbi, functionName: "nextCommit" });
  // Commits already posted but not yet used start at next; new ones go after them
  const from = next + left;
  const hashes = Array.from({ length: BATCH }, (_, k) => commitAt(from + BigInt(k)));
  return wallet().writeContract({ address: CASINO_CONTRACT!, abi: casinoAbi, functionName: "addCommits", args: [from, hashes] });
}

// Reveals the seed behind an open bet. Safe to call for any bet, any number of times.
export async function settleBet(betId: bigint) {
  const bet = await pub.readContract({ address: CASINO_CONTRACT!, abi: casinoAbi, functionName: "bets", args: [betId] });
  const [, , , , status, , commitIndex] = bet;
  if (status !== STATUS_OPEN) return { done: true as const };
  const secret = secretAt(BigInt(commitIndex));
  // A stale or foreign commit would revert; check first so the error is clear
  const onChain = await pub.readContract({ address: CASINO_CONTRACT!, abi: casinoAbi, functionName: "commits", args: [BigInt(commitIndex)] });
  if (onChain !== keccak256(encodePacked(["bytes32"], [secret]))) throw new Error(`commit ${commitIndex} wasn't made from CROUPIER_SEED`);
  const hash = await wallet().writeContract({ address: CASINO_CONTRACT!, abi: casinoAbi, functionName: "settle", args: [betId, secret] });
  await pub.waitForTransactionReceipt({ hash });
  return { done: false as const, hash };
}
