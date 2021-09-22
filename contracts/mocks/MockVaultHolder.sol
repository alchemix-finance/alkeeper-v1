pragma solidity 0.8.4;

import {IVaultAdaptor} from "../IVaultAdaptor.sol";
import {IVaultHolder} from "../IVaultHolder.sol";

contract MockVaultHolder is IVaultHolder {
    IVaultAdaptor[] public vaults;
    address public rewards;

    constructor(address _rewards) {
        rewards = _rewards;
    }
    function harvest(uint256 vaultId) external override {
        vaults[vaultId].harvest(rewards);
    }
    function initialize(IVaultAdaptor _vault) external {
        require(_vault.totalDeposited() == 0, "must be new vault");
        vaults.push(_vault);
    }
    
    function vaultCount() external override view returns (uint256) {
        return vaults.length;
    }
    
    function getVaultAdapter(uint256 vaultId) external override view returns (address) {
        return address(vaults[vaultId]);
    }
    
    function getVaultTotalDeposited(uint256 vaultId) external override view returns (uint256) {
        return vaults[vaults.length - 1].totalDeposited();
    }
}