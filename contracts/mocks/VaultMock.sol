pragma solidity 0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";

contract VaultMock {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    IERC20 public underlying;
    uint256 public totalDeposited;

    constructor(IERC20 _underlying) {
        underlying = _underlying;
    }

    function totalValue() external view returns (uint256) {
        return underlying.balanceOf(address(this));
    }

    function harvest(address rewards) external {
        underlying.safeTransfer(rewards, this.totalValue().sub(totalDeposited, "harvest fail"));
    }

    function deposit(uint256 _amount) external {
        totalDeposited += _amount;
    }
}