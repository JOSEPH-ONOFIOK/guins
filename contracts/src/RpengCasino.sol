// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title The Colony Casino: $RPENG coin flip, Over/Under 7 and Guin Slots
/// @notice Provably fair commit-reveal. The croupier posts hashes of secret seeds ahead
///         of time; each bet is tied to the next unused one when it is placed, and the
///         player adds a seed of their own. The result is
///         keccak256(secret, clientSeed, betId), so neither side can steer it. If the
///         croupier doesn't reveal within `revealTimeout`, the player claims the most the
///         bet could have paid, so withholding a reveal never helps the house.
/// @dev Trust assumption: whoever holds the croupier's secrets knows upcoming results, so
///      they could pick a winning clientSeed from another wallet. Keep the croupier's
///      master secret as safe as a treasury key; maxBet caps the damage per bet.
///      Wins are paid from the bankroll (this contract's free balance). A lost stake
///      leaves the contract at settlement: `lossToTreasuryBps` of it to `treasury`, the
///      rest to the burn address.
contract RpengCasino is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ---------- games ----------
    uint8 public constant FLIP = 0; // choice 0 or 1 (the two sides)
    uint8 public constant DICE = 1; // choice 0 under 7, 1 exactly 7, 2 over 7
    uint8 public constant SLOTS = 2; // choice ignored

    // Payouts in hundredths of the stake (195 = 1.95x, stake included)
    uint256 public constant FLIP_PAYS = 195;
    uint256 public constant DICE_UNDER_OVER_PAYS = 230;
    uint256 public constant DICE_SEVEN_PAYS = 500;
    uint256 public constant SLOTS_PAIR_PAYS = 140;
    uint256 public constant SLOTS_MAX_PAYS = 5000; // three diamonds

    address public constant BURN = 0x000000000000000000000000000000000000dEaD;
    uint256 public constant BPS = 10_000;

    // ---------- settings ----------
    IERC20 public immutable token;
    address public treasury;
    address public croupier;
    uint256 public lossToTreasuryBps;
    uint256 public minBet;
    uint256 public maxBet;
    uint64 public revealTimeout;

    // ---------- state ----------
    bytes32[] public commits;
    uint256 public nextCommit;
    /// @notice Most the open bets could still pay out; never spent on anything else
    uint256 public locked;

    enum Status {
        None,
        Open,
        Settled,
        TimedOut
    }

    struct Bet {
        address player;
        uint96 amount;
        uint8 game;
        uint8 choice;
        Status status;
        uint64 deadline; // when the player may claim if the croupier hasn't revealed
        uint32 commitIndex;
        uint128 reserve; // the most this bet can pay
        bytes32 clientSeed;
    }

    mapping(uint256 => Bet) public bets;
    uint256 public betCount;

    // ---------- events ----------
    event BetPlaced(uint256 indexed betId, address indexed player, uint8 game, uint8 choice, uint256 amount, uint256 commitIndex, bytes32 clientSeed);
    event BetSettled(uint256 indexed betId, address indexed player, uint256 roll, uint256 payout, bytes32 secret);
    event BetTimedOut(uint256 indexed betId, address indexed player, uint256 payout);
    event CommitsAdded(uint256 from, uint256 count);
    event BankrollFunded(address indexed from, uint256 amount);
    event BankrollWithdrawn(address indexed to, uint256 amount);
    event SettingsChanged();

    error BadGame();
    error BadChoice();
    error BetOutOfRange();
    error NoCommitLeft();
    error BankrollTooLow();
    error NotCroupier();
    error NotOpen();
    error BadSecret();
    error TooEarly();
    error BadSetting();
    error NothingReceived();

    modifier onlyCroupier() {
        if (msg.sender != croupier) revert NotCroupier();
        _;
    }

    constructor(
        IERC20 token_,
        address owner_,
        address treasury_,
        address croupier_,
        uint256 lossToTreasuryBps_,
        uint256 minBet_,
        uint256 maxBet_,
        uint64 revealTimeout_
    ) Ownable(owner_) {
        if (address(token_) == address(0)) revert BadSetting();
        token = token_;
        _setTreasury(treasury_);
        _setCroupier(croupier_);
        _setLossSplit(lossToTreasuryBps_);
        _setLimits(minBet_, maxBet_);
        _setRevealTimeout(revealTimeout_);
    }

    // ---------- playing ----------

    /// @notice Bet `amount` on a game. Approve the token first.
    function placeBet(uint8 game, uint8 choice, uint256 amount, bytes32 clientSeed) external whenNotPaused nonReentrant returns (uint256 betId) {
        if (game > SLOTS) revert BadGame();
        if (game == FLIP && choice > 1) revert BadChoice();
        if (game == DICE && choice > 2) revert BadChoice();
        if (game == SLOTS) choice = 0;
        if (nextCommit >= commits.length) revert NoCommitLeft();

        // Count what actually arrived (in case the token takes a fee on transfer)
        uint256 before = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = token.balanceOf(address(this)) - before;
        if (received == 0) revert NothingReceived();
        if (received < minBet || received > maxBet) revert BetOutOfRange();

        uint256 reserve = (received * maxPays(game, choice)) / 100;
        // The stake is already in the balance, so this checks the bankroll covers the win
        if (token.balanceOf(address(this)) < locked + reserve) revert BankrollTooLow();
        locked += reserve;

        betId = ++betCount;
        uint256 commitIndex = nextCommit++;
        bets[betId] = Bet({
            player: msg.sender,
            amount: uint96(received),
            game: game,
            choice: choice,
            status: Status.Open,
            deadline: uint64(block.timestamp) + revealTimeout,
            commitIndex: uint32(commitIndex),
            reserve: uint128(reserve),
            clientSeed: clientSeed
        });
        emit BetPlaced(betId, msg.sender, game, choice, received, commitIndex, clientSeed);
    }

    /// @notice The croupier reveals the secret behind a bet's commit and settles it
    function settle(uint256 betId, bytes32 secret) external onlyCroupier nonReentrant {
        Bet storage b = bets[betId];
        if (b.status != Status.Open) revert NotOpen();
        if (keccak256(abi.encodePacked(secret)) != commits[b.commitIndex]) revert BadSecret();

        b.status = Status.Settled;
        locked -= b.reserve;
        uint256 roll = uint256(keccak256(abi.encodePacked(secret, b.clientSeed, betId)));
        uint256 payout = (uint256(b.amount) * pays(b.game, b.choice, roll)) / 100;

        if (payout > 0) {
            token.safeTransfer(b.player, payout);
        } else {
            uint256 toTreasury = (uint256(b.amount) * lossToTreasuryBps) / BPS;
            if (toTreasury > 0) token.safeTransfer(treasury, toTreasury);
            if (b.amount - toTreasury > 0) token.safeTransfer(BURN, b.amount - toTreasury);
        }
        emit BetSettled(betId, b.player, roll, payout, secret);
    }

    /// @notice No reveal in time: the player takes the most the bet could have paid
    function claimTimeout(uint256 betId) external nonReentrant {
        Bet storage b = bets[betId];
        if (b.status != Status.Open) revert NotOpen();
        if (block.timestamp < b.deadline) revert TooEarly();
        b.status = Status.TimedOut;
        locked -= b.reserve;
        token.safeTransfer(b.player, b.reserve);
        emit BetTimedOut(betId, b.player, b.reserve);
    }

    // ---------- results (pure, so the site and tests use the same rules) ----------

    /// @notice Hundredths of the stake paid back for this roll (0 = lost)
    function pays(uint8 game, uint8 choice, uint256 roll) public pure returns (uint256) {
        if (game == FLIP) return roll % 2 == choice ? FLIP_PAYS : 0;
        if (game == DICE) {
            uint256 sum = (roll % 6) + 1 + ((roll / 6) % 6) + 1;
            if (choice == 0) return sum < 7 ? DICE_UNDER_OVER_PAYS : 0;
            if (choice == 1) return sum == 7 ? DICE_SEVEN_PAYS : 0;
            return sum > 7 ? DICE_UNDER_OVER_PAYS : 0;
        }
        (uint8 a, uint8 b, uint8 c) = reels(roll);
        if (a == b && b == c) return threeOfAKind(a);
        if (a == b || b == c || a == c) return SLOTS_PAIR_PAYS;
        return 0;
    }

    /// @notice The three slot symbols for a roll: 0 diamond, 1 Guin, 2 coin, 3 fish, 4 snowflake, 5 ice
    function reels(uint256 roll) public pure returns (uint8, uint8, uint8) {
        return (symbol(roll % 20), symbol((roll / 20) % 20), symbol((roll / 400) % 20));
    }

    // Weights out of 20, as on the site: diamond 1, Guin 3, coin 2, fish 4, snowflake 5, ice 5
    function symbol(uint256 r) internal pure returns (uint8) {
        if (r < 1) return 0;
        if (r < 4) return 1;
        if (r < 6) return 2;
        if (r < 10) return 3;
        if (r < 15) return 4;
        return 5;
    }

    function threeOfAKind(uint8 s) internal pure returns (uint256) {
        if (s == 0) return 5000;
        if (s == 1) return 2000;
        if (s == 2) return 1500;
        if (s == 3) return 800;
        return 500; // snowflake, ice
    }

    /// @notice The most a bet on this game and choice can pay, in hundredths of the stake
    function maxPays(uint8 game, uint8 choice) public pure returns (uint256) {
        if (game == FLIP) return FLIP_PAYS;
        if (game == DICE) return choice == 1 ? DICE_SEVEN_PAYS : DICE_UNDER_OVER_PAYS;
        return SLOTS_MAX_PAYS;
    }

    // ---------- views ----------

    /// @notice Free bankroll: what can still back new bets or be withdrawn
    function bankroll() public view returns (uint256) {
        uint256 bal = token.balanceOf(address(this));
        return bal > locked ? bal - locked : 0;
    }

    function commitsLeft() external view returns (uint256) {
        return commits.length - nextCommit;
    }

    // ---------- croupier ----------

    /// @param from Where the batch starts: must be the current end, so two batches sent at
    ///             once can never land in the wrong slots (the second one reverts instead)
    function addCommits(uint256 from, bytes32[] calldata hashes) external onlyCroupier {
        if (from != commits.length) revert BadSetting();
        for (uint256 i; i < hashes.length; ++i) commits.push(hashes[i]);
        emit CommitsAdded(from, hashes.length);
    }

    // ---------- owner ----------

    function fundBankroll(uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit BankrollFunded(msg.sender, amount);
    }

    /// @notice Only the free bankroll can leave; stakes and reserved wins stay put
    function withdrawBankroll(address to, uint256 amount) external onlyOwner nonReentrant {
        if (amount > bankroll()) revert BankrollTooLow();
        token.safeTransfer(to, amount);
        emit BankrollWithdrawn(to, amount);
    }

    /// @notice Return any other token sent here by mistake (never the casino token)
    function rescue(IERC20 other, address to, uint256 amount) external onlyOwner {
        if (address(other) == address(token)) revert BadSetting();
        other.safeTransfer(to, amount);
    }

    function setTreasury(address t) external onlyOwner {
        _setTreasury(t);
    }

    function setCroupier(address c) external onlyOwner {
        _setCroupier(c);
    }

    function setLossSplit(uint256 bps) external onlyOwner {
        _setLossSplit(bps);
    }

    function setLimits(uint256 min_, uint256 max_) external onlyOwner {
        _setLimits(min_, max_);
    }

    function setRevealTimeout(uint64 t) external onlyOwner {
        _setRevealTimeout(t);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _setTreasury(address t) internal {
        if (t == address(0)) revert BadSetting();
        treasury = t;
        emit SettingsChanged();
    }

    function _setCroupier(address c) internal {
        if (c == address(0)) revert BadSetting();
        croupier = c;
        emit SettingsChanged();
    }

    function _setLossSplit(uint256 bps) internal {
        if (bps > BPS) revert BadSetting();
        lossToTreasuryBps = bps;
        emit SettingsChanged();
    }

    function _setLimits(uint256 min_, uint256 max_) internal {
        // uint96 keeps a stake in one storage slot; real limits are far below it
        if (min_ == 0 || min_ > max_ || max_ > type(uint96).max) revert BadSetting();
        minBet = min_;
        maxBet = max_;
        emit SettingsChanged();
    }

    function _setRevealTimeout(uint64 t) internal {
        // Long enough for the croupier to answer, short enough that a player isn't stuck.
        // A bet keeps the deadline it was placed with, so a change never affects open bets.
        if (t < 5 minutes || t > 1 days) revert BadSetting();
        revealTimeout = t;
        emit SettingsChanged();
    }
}
