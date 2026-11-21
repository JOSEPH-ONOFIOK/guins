// The on-chain Colony Casino (contracts/src/RpengCasino.sol), shared by the site and the croupier.
// Real-$RPENG play switches on only once the casino contract address is set; until then it's play chips only.

import { defineChain, parseAbi, type Address } from "viem";

export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com"] } },
});

const addr = (v: string | undefined) => (v && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as Address) : undefined);

export const CASINO_CONTRACT = addr(process.env.NEXT_PUBLIC_CASINO_CONTRACT);
// $RPENG on Robinhood Chain (name "RPENG", symbol "HOODGUINS", 18 decimals)
export const RPENG_TOKEN = addr(process.env.NEXT_PUBLIC_RPENG_TOKEN) ?? ("0x2caD50ca2A7BeB6A314D8e2B5b26775aB09E3aD1" as Address);
export const REAL_PLAY = !!(CASINO_CONTRACT && RPENG_TOKEN);

export const GAME = { flip: 0, dice: 1, slots: 2 } as const;
export type RealGame = keyof typeof GAME;

export const casinoAbi = parseAbi([
  "function placeBet(uint8 game, uint8 choice, uint256 amount, bytes32 clientSeed) returns (uint256)",
  "function settle(uint256 betId, bytes32 secret)",
  "function claimTimeout(uint256 betId)",
  "function addCommits(uint256 from, bytes32[] hashes)",
  "function bets(uint256) view returns (address player, uint96 amount, uint8 game, uint8 choice, uint8 status, uint64 deadline, uint32 commitIndex, uint128 reserve, bytes32 clientSeed)",
  "function commits(uint256) view returns (bytes32)",
  "function commitsLeft() view returns (uint256)",
  "function nextCommit() view returns (uint256)",
  "function minBet() view returns (uint256)",
  "function maxBet() view returns (uint256)",
  "function bankroll() view returns (uint256)",
  "function maxPays(uint8 game, uint8 choice) pure returns (uint256)",
  "function pays(uint8 game, uint8 choice, uint256 roll) pure returns (uint256)",
  "function reels(uint256 roll) pure returns (uint8, uint8, uint8)",
  "event BetPlaced(uint256 indexed betId, address indexed player, uint8 game, uint8 choice, uint256 amount, uint256 commitIndex, bytes32 clientSeed)",
  "event BetSettled(uint256 indexed betId, address indexed player, uint256 roll, uint256 payout, bytes32 secret)",
  "event BetTimedOut(uint256 indexed betId, address indexed player, uint256 payout)",
]);

export const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
]);

// Same rules as the contract's pays(), so the site can show what a roll means
export const SLOT_SYMBOLS = ["💎", "🐧", "🪙", "🐟", "❄️", "🧊"];
export function describeRoll(game: number, roll: bigint) {
  if (game === GAME.flip) return roll % BigInt(2) === BigInt(0) ? "$RPENG" : "Beak";
  if (game === GAME.dice) {
    const a = Number(roll % BigInt(6)) + 1, b = Number((roll / BigInt(6)) % BigInt(6)) + 1;
    return `${a} + ${b} = ${a + b}`;
  }
  const sym = (r: bigint) => {
    const n = Number(r % BigInt(20));
    return SLOT_SYMBOLS[n < 1 ? 0 : n < 4 ? 1 : n < 6 ? 2 : n < 10 ? 3 : n < 15 ? 4 : 5];
  };
  return `${sym(roll)} ${sym(roll / BigInt(20))} ${sym(roll / BigInt(400))}`;
}
