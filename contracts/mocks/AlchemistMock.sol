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

contract AlchemistMock is IAlchemist, MockVaultHolder {
    using SafeERC20 for IERC20;
    bool public pause;
    constructor(address _rewards) MockVaultHolder(_rewards) {
    }
    
    function flush() external override {
        IVaultAdaptor v = vaults[vaults.length - 1];
        uint256 amt = v.underlying().balanceOf(address(this));
        v.underlying().safeTransfer(address(v), amt);
        v.deposit(amt);
    }

    function setEmergencyExit(bool state) external {
        pause = state;
    }

    function emergencyExit() external override view returns (bool) {
        return pause;
    }

    function deposit(uint256 _amount) external {
        vaults[vaults.length - 1].underlying().safeTransferFrom(msg.sender, address(this), _amount);
    }
}