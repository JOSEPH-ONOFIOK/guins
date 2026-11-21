"use client";

import { useCallback, useState } from "react";
import { createPublicClient, createWalletClient, custom, decodeEventLog, formatUnits, http, parseUnits, toHex, type Address, type EIP1193Provider } from "viem";
import { CASINO_CONTRACT, GAME, RPENG_TOKEN, casinoAbi, describeRoll, erc20Abi, robinhood, type RealGame } from "@/casino/chain";

// Real-$RPENG play on the on-chain casino (contracts/src/RpengCasino.sol). Shown only when the
// contract and token addresses are set. 4 Seconds stays play-chips only: its timing happens in
// the browser, so it can't be made fair for real money.

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

const pub = createPublicClient({ chain: robinhood, transport: http() });
const CHOICES: Record<RealGame, { label: string; value: number }[]> = {
  flip: [{ label: "$RPENG", value: 0 }, { label: "Beak", value: 1 }],
  dice: [{ label: "Under 7", value: 0 }, { label: "Lucky 7", value: 1 }, { label: "Over 7", value: 2 }],
  slots: [{ label: "Spin", value: 0 }],
};
const NAMES: Record<RealGame, string> = { flip: "Coin Flip", dice: "Over / Under 7", slots: "Guin Slots" };

type Result = { betId: bigint; game: number; roll: bigint; payout: bigint; amount: bigint };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errText = (e: unknown) => {
  const m = (e as { shortMessage?: string; message?: string })?.shortMessage ?? (e as Error)?.message ?? "Something went wrong.";
  return /rejected|denied/i.test(m) ? "You cancelled it in your wallet." : m.slice(0, 160);
};

export function RealPlay() {
  const [account, setAccount] = useState<Address | null>(null);
  const [decimals, setDecimals] = useState(18);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [limits, setLimits] = useState<{ min: bigint; max: bigint } | null>(null);
  const [game, setGame] = useState<RealGame>("flip");
  const [choice, setChoice] = useState(0);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [stuck, setStuck] = useState<bigint | null>(null);

  const refresh = useCallback(async (who: Address) => {
    const [d, bal, min, max] = await Promise.all([
      pub.readContract({ address: RPENG_TOKEN!, abi: erc20Abi, functionName: "decimals" }),
      pub.readContract({ address: RPENG_TOKEN!, abi: erc20Abi, functionName: "balanceOf", args: [who] }),
      pub.readContract({ address: CASINO_CONTRACT!, abi: casinoAbi, functionName: "minBet" }),
      pub.readContract({ address: CASINO_CONTRACT!, abi: casinoAbi, functionName: "maxBet" }),
    ]);
    setDecimals(d);
    setBalance(bal);
    setLimits({ min, max });
  }, []);

  const wallet = () => createWalletClient({ chain: robinhood, transport: custom(window.ethereum!) });

  const connect = async () => {
    setErr(null);
    if (!window.ethereum) return setErr("No wallet found. Install a browser wallet such as MetaMask or Rabby.");
    try {
      const [who] = await wallet().requestAddresses();
      try {
        await wallet().switchChain({ id: robinhood.id });
      } catch {
        await wallet().addChain({ chain: robinhood });
      }
      setAccount(who);
      await refresh(who);
    } catch (e) {
      setErr(errText(e));
    }
  };

  const fmt = (v: bigint) => Number(formatUnits(v, decimals)).toLocaleString("en-US", { maximumFractionDigits: 2 });

  const play = async () => {
    if (!account || !limits) return;
    setErr(null);
    setResult(null);
    setStuck(null);
    let stake: bigint;
    try {
      stake = parseUnits(amount || "0", decimals);
    } catch {
      return setErr("Enter an amount.");
    }
    if (stake < limits.min || stake > limits.max) return setErr(`Bets are ${fmt(limits.min)} to ${fmt(limits.max)} $RPENG.`);
    if (balance !== null && stake > balance) return setErr("You don't have that much $RPENG.");
    const w = wallet();
    try {
      const allowance = await pub.readContract({ address: RPENG_TOKEN!, abi: erc20Abi, functionName: "allowance", args: [account, CASINO_CONTRACT!] });
      if (allowance < stake) {
        setBusy("Approve $RPENG in your wallet…");
        const a = await w.writeContract({ account, address: RPENG_TOKEN!, abi: erc20Abi, functionName: "approve", args: [CASINO_CONTRACT!, stake] });
        await pub.waitForTransactionReceipt({ hash: a });
      }
      // Your own random seed: mixed into the result, so the house can't pick it
      const seed = toHex(crypto.getRandomValues(new Uint8Array(32)));
      setBusy("Confirm the bet in your wallet…");
      const hash = await w.writeContract({ account, address: CASINO_CONTRACT!, abi: casinoAbi, functionName: "placeBet", args: [GAME[game], choice, stake, seed] });
      setBusy("Placing your bet…");
      const receipt = await pub.waitForTransactionReceipt({ hash });
      let betId: bigint | null = null;
      for (const log of receipt.logs) {
        try {
          const ev = decodeEventLog({ abi: casinoAbi, data: log.data, topics: log.topics });
          if (ev.eventName === "BetPlaced") betId = ev.args.betId;
        } catch {}
      }
      if (betId === null) throw new Error("The bet went through but its id wasn't found. Refresh and check your wallet.");
      setBusy("Revealing the result…");
      fetch("/api/casino/settle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ betId: betId.toString() }) }).catch(() => {});
      // Wait for the settlement on chain
      for (let i = 0; i < 60; i++) {
        await sleep(2000);
        const logs = await pub.getContractEvents({ address: CASINO_CONTRACT!, abi: casinoAbi, eventName: "BetSettled", args: { betId }, fromBlock: receipt.blockNumber });
        if (logs.length) {
          const a = logs[0].args;
          setResult({ betId, game: GAME[game], roll: a.roll!, payout: a.payout!, amount: stake });
          await refresh(account);
          return;
        }
      }
      setStuck(betId);
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(null);
    }
  };

  const claim = async () => {
    if (!account || stuck === null) return;
    setErr(null);
    try {
      setBusy("Confirm in your wallet…");
      const hash = await wallet().writeContract({ account, address: CASINO_CONTRACT!, abi: casinoAbi, functionName: "claimTimeout", args: [stuck] });
      await pub.waitForTransactionReceipt({ hash });
      setStuck(null);
      await refresh(account);
    } catch (e) {
      setErr(/TooEarly/.test(String(e)) ? "Not yet: you can claim once the reveal deadline (1 hour after the bet) has passed." : errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="glass p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label label-accent">Real $RPENG</p>
          <h3 className="mt-2 font-display text-3xl font-bold">Play for real</h3>
          <p className="mt-2 max-w-xl text-sm text-dim">
            Bet real $RPENG on Coin Flip, Over / Under 7 and Guin Slots. You can lose what you bet. Lost bets stay with the house, and 30% of each lost bet is burned. Wins pay
            the same as the play tables. Every result is provably fair: your own random seed is mixed with one the house locked in before your bet.
          </p>
        </div>
        {account ? (
          <div className="well px-4 py-2 text-right">
            <p className="label !text-[10px]">Your $RPENG</p>
            <p className="font-mono font-semibold">{balance === null ? "…" : fmt(balance)}</p>
          </div>
        ) : (
          <button className="btn btn-accent" onClick={connect}>Connect wallet</button>
        )}
      </div>

      {account && (
        <div className="mt-6 grid gap-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(NAMES) as RealGame[]).map((g) => (
              <button key={g} className={`btn btn-sm ${g === game ? "btn-accent" : "btn-ghost"}`} disabled={!!busy} onClick={() => (setGame(g), setChoice(0), setResult(null))}>
                {NAMES[g]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {CHOICES[game].map((c) => (
              <button key={c.value} className={`btn btn-sm ${c.value === choice ? "btn-accent" : "btn-ghost"}`} disabled={!!busy || CHOICES[game].length === 1} onClick={() => setChoice(c.value)}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder={limits ? `${fmt(limits.min)} – ${fmt(limits.max)} $RPENG` : "Amount"} className="field font-mono" disabled={!!busy} />
            <button className="btn btn-accent shrink-0" onClick={play} disabled={!!busy || !amount}>
              {busy ? "Working…" : "Place bet"}
            </button>
          </div>
          {busy && <p className="text-sm text-dim">{busy}</p>}
          {err && <p className="font-mono text-sm text-flame">{err}</p>}
          {result && (
            <div className={`well p-4 ${result.payout > BigInt(0) ? "!border-mint/50" : ""}`}>
              <p className="font-display text-xl font-bold">{result.payout > BigInt(0) ? `You won ${fmt(result.payout)} $RPENG` : `You lost ${fmt(result.amount)} $RPENG`}</p>
              <p className="mt-1 font-mono text-sm text-dim">
                Bet #{result.betId.toString()} · {describeRoll(result.game, result.roll)}
              </p>
            </div>
          )}
          {stuck !== null && (
            <div className="well p-4 text-sm">
              <p>Bet #{stuck.toString()} hasn&apos;t been revealed yet. If it isn&apos;t revealed within an hour of your bet, you can claim the most it could have paid.</p>
              <button className="btn btn-ghost btn-sm mt-3" onClick={claim} disabled={!!busy}>Claim bet #{stuck.toString()}</button>
            </div>
          )}
          <p className="text-xs text-dim">4 Seconds stays on play chips: its timing happens in your browser, so it can&apos;t be played fairly for real money.</p>
        </div>
      )}
      {!account && err && <p className="mt-4 font-mono text-sm text-flame">{err}</p>}
    </div>
  );
}
