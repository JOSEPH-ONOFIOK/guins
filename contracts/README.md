# The Colony Casino: real $RPENG

`src/RpengCasino.sol` runs Coin Flip, Over / Under 7 and Guin Slots for real $RPENG on
Robinhood Chain (id 4663). 4 Seconds stays on play chips: its timing happens in the
player's browser, so it can't be made fair for real money.

The site shows the **Real $RPENG** tables only when `NEXT_PUBLIC_CASINO_CONTRACT` is set. Until then everything is play chips, as before.

## How a bet works

1. The croupier (the site's server, `src/lib/croupier.ts`) keeps a stock of **commits** on
   chain: hashes of secret seeds. Seed *i* is `keccak256(CROUPIER_SEED, i)`, so nothing
   needs storing.
2. A player bets: the stake moves into the contract, the bet is tied to the next unused
   commit, and the player adds a random seed of their own.
3. The site calls `/api/casino/settle`; the croupier reveals that one seed and the
   contract works out the result: `keccak256(secret, clientSeed, betId)`.
4. **Win**: paid from the bankroll at the same rates as the play tables (flip 1.95×, under
   or over 2.3×, lucky 7 5×, slots up to 50×, any pair 1.4×).
   **Loss**: the stake leaves the contract, split by `lossToTreasuryBps` (set to 7000) between
   the treasury and the burn address `0x…dEaD`.
5. If the croupier doesn't reveal within `revealTimeout` (1 hour), anyone can call
   `claimTimeout` and the player gets the most the bet could have paid. Withholding a
   reveal never helps the house.

Each open bet reserves its maximum win, so the casino can always pay every open bet. The
owner can only withdraw the free bankroll.

## Deploy

```bash
cd contracts
forge test --root .

export ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com
export RPENG_TOKEN=0x2caD50ca2A7BeB6A314D8e2B5b26775aB09E3aD1   # $RPENG
export CASINO_OWNER=0xb50295336dCf30F5a01541338AD09B4487930065      # owner: the $RPENG launch wallet (default)
export CASINO_TREASURY=0x73b6e7E744576DD2AC8110d9D1291eE843FA6d30   # treasury: the default if unset
export CASINO_CROUPIER=0x…        # address of CROUPIER_KEY below (a fresh hot wallet)
export CASINO_MIN_BET=1000000000000000000000      # 1,000 $RPENG (default)
export CASINO_MAX_BET=100000000000000000000000    # 100,000 $RPENG (default)
forge script script/Deploy.s.sol --root . --rpc-url robinhood --broadcast --account <deployer>
```

Then:

1. **Fund the bankroll**: approve the casino, then call `fundBankroll(amount)`. A bet only
   goes through if the free bankroll covers its maximum win (50× for slots), so size the
   bankroll and `maxBet` together: bankroll ≥ 50 × maxBet lets any single bet through: with a 100,000 max bet, that's
   5,000,000 $RPENG. A smaller bankroll still works; big slots bets are refused until it grows.
2. **Give the croupier gas**: send a little ETH on Robinhood Chain to `CASINO_CROUPIER`.
3. **Site settings** (Vercel → Environment Variables, then redeploy):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_CASINO_CONTRACT` | the deployed casino |
| `NEXT_PUBLIC_RPENG_TOKEN` | optional: defaults to $RPENG, `0x2caD…3aD1` |
| `CROUPIER_KEY` | private key of `CASINO_CROUPIER` |
| `CROUPIER_SEED` | 32 random bytes: `openssl rand -hex 32` with `0x` in front |
| `ROBINHOOD_RPC_URL` | optional, a private RPC |

4. **First commits**: the croupier adds commits after each settlement, but the very first
   bet needs some. Call `/api/casino/settle` with any number (`{"betId":"0"}`) once: it
   tops the stock up to 40.

**Never change `CROUPIER_SEED` while bets are open**: their commits came from the old seed
and could no longer be revealed, so they would time out and pay their maximum win.

## Self-review (not an audit)

This is my own line-by-line review plus the test suite (23 tests, including a 256-run fuzz
check that the casino always holds enough to pay every open bet). It is **not** an
independent audit. Get one before real funds go in.

Checked and covered by tests:

- Results can't be steered by the player (they don't know the secret) or by the croupier
  (the commit is fixed before the bet, and the player's seed comes after).
- Each bet uses its own commit; a secret can't settle a different bet; no double
  settlement; only the croupier settles.
- Commit batches must start exactly at the end of the list, so two batches sent at once
  can't land in the wrong slots.
- Bankroll solvency: open bets reserve their maximum win; withdrawals only touch the free
  bankroll; the fuzz test holds this across random bets.
- Fee-on-transfer tokens: the stake counted is what actually arrived.
- Reentrancy: `nonReentrant` on every function that moves tokens; a token with a transfer
  hook can't settle twice.
- Changing the timeout never affects open bets (each stores its own deadline).
- Settings are bounded (loss split ≤ 100%, timeout 5 minutes to 1 day, min ≤ max).
- Slots payouts match the site exactly (all 8,000 outcomes, 96.525% return).

The real token, `0x2caD50ca2A7BeB6A314D8e2B5b26775aB09E3aD1` on Robinhood Chain:

- A plain ERC-20 with `burn`/`burnFrom`, made by a launchpad (`launchFactory()`, bonding
  `curve()`). No owner, no mint, no pause, no blacklist, no transfer fee setting, and not
  an upgradeable proxy, so nobody can change how it behaves later.
- `test/RpengFork.t.sol` runs the casino against the real token on a copy of the chain:
  transfers arrive in full (no fee), wins pay 1.95x, a loss sends exactly 70% to the
  treasury and 30% to `0x…dEaD`, and a timeout pays the maximum. Run it with
  `forge test --root . --match-contract RpengFork --fork-url https://rpc.mainnet.chain.robinhood.com`.
- Its name is "RPENG" but its symbol is "HOODGUINS", so wallets show the ticker as
  HOODGUINS. Most of the supply (about 834M of 1B) still sits in the bonding curve.

Risks that remain (by design or out of the contract's hands):

1. **The croupier's seed is a master key.** Whoever has `CROUPIER_SEED` knows upcoming
   results and could win every bet from another wallet. There is no reliable on-chain
   randomness on Robinhood Chain to mix in. Keep it as safe as a treasury key, keep
   `maxBet` modest, and rotate the croupier (new key, new seed) only when no bets are open.
2. **Croupier downtime costs money.** If the server can't settle for an hour, open bets
   can be claimed at their maximum win. Watch the croupier's ETH balance and the
   `/api/casino/settle` logs.
3. **The owner is powerful.** It can change the treasury, croupier, split and limits, and
   pause new bets. Use a multisig.
4. **Burn address**: lost tokens go to `0x…dEaD` rather than a `burn()` call, so total
   supply on explorers won't drop; they are out of circulation all the same.
5. **Legal**: betting a token with market value is gambling in most countries. Get advice
   on licensing and blocked regions before launch.
