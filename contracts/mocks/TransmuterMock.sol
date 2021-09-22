pragma solidity 0.8.4;

import {IKeeperCompatibleInterface} from "../IKeeperCompatibleInterface.sol";
import {IAlchemist} from "../IAlchemist.sol";
import {ITransmuter} from "../ITransmuter.sol";
import {IVaultAdaptor} from "../IVaultAdaptor.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {MockVaultHolder} from "./MockVaultHolder.sol";
import "hardhat/console.sol";

contract TransmuterMock is ITransmuter, MockVaultHolder {
    using SafeERC20 for IERC20;
    bool public override pause;
    constructor(address _rewards) MockVaultHolder(_rewards) {
    }

    function setPause(bool state) external {
        pause = state;
    }

    function deposit(uint256 _amount) external {
        IVaultAdaptor v = vaults[vaults.length - 1];
        v.underlying().safeTransferFrom(msg.sender, address(this), _amount);
        v.underlying().safeTransfer(address(v), _amount);
        v.deposit(_amount);
    }

    function setKeepers(address[] calldata _keepers, bool[] calldata _states) external override {

    }
}