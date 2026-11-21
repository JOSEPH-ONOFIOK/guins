// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RpengCasino} from "../src/RpengCasino.sol";

/// forge script script/Deploy.s.sol --root . --rpc-url robinhood --broadcast --account <deployer>
/// Settings come from the environment (see contracts/README.md).
contract Deploy is Script {
    function run() external returns (RpengCasino casino) {
        IERC20 token = IERC20(vm.envAddress("RPENG_TOKEN"));
        address owner = vm.envAddress("CASINO_OWNER");
        address treasury = vm.envAddress("CASINO_TREASURY");
        address croupier = vm.envAddress("CASINO_CROUPIER");
        uint256 lossBps = vm.envOr("CASINO_LOSS_TO_TREASURY_BPS", uint256(7000));
        uint256 minBet = vm.envUint("CASINO_MIN_BET");
        uint256 maxBet = vm.envUint("CASINO_MAX_BET");
        uint64 timeout = uint64(vm.envOr("CASINO_REVEAL_TIMEOUT", uint256(1 hours)));

        vm.startBroadcast();
        casino = new RpengCasino(token, owner, treasury, croupier, lossBps, minBet, maxBet, timeout);
        vm.stopBroadcast();
        console.log("RpengCasino:", address(casino));
    }
}
