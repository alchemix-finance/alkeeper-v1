pragma solidity 0.8.4;

import {IVaultHolder} from "./IVaultHolder.sol";

interface IAlchemist is IVaultHolder {
    function flush() external;
    function emergencyExit() external view returns (bool);
}