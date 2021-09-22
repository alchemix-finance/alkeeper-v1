import chai from "chai";
import chaiSubset from "chai-subset";
import { solidity } from "ethereum-waffle";
import { ethers, deployments } from "hardhat";
import { BigNumber, BigNumberish, ContractFactory, Signer, utils } from "ethers";
import { AlKeeper } from '../types/AlKeeper';
import { AlchemistMock } from '../types/AlchemistMock';
import { TransmuterMock } from '../types/TransmuterMock';
import { VaultMock } from '../types/VaultMock';
import { Erc20Mock } from '../types/Erc20Mock';
import { min } from "moment";
const {parseEther, formatEther} = utils;

chai.use(solidity);
chai.use(chaiSubset);

const { expect } = chai;

let AlKeeperFactory: ContractFactory;
let AlchemistMockFactory: ContractFactory;
let TransmuterMockFactory: ContractFactory;
let VaultMockFactory: ContractFactory;
let Erc20MockFactory: ContractFactory

describe("AlchemistMock", () => {
    let signers: Signer[];
    let alKeeper: AlKeeper;
    let alchemist: AlchemistMock;
    let transmuter: TransmuterMock;
    let alchVault: VaultMock;
    let transVault: VaultMock;
    let token: Erc20Mock;

    let deployer: Signer;
    let rewards: Signer;
    let depositor: Signer;

    before(async () => {
        AlKeeperFactory = await ethers.getContractFactory("AlKeeper");
        AlchemistMockFactory = await ethers.getContractFactory("AlchemistMock");
        TransmuterMockFactory = await ethers.getContractFactory("TransmuterMock");
        VaultMockFactory = await ethers.getContractFactory("VaultMock");
        Erc20MockFactory = await ethers.getContractFactory("ERC20Mock");
    });

    beforeEach(async () => {
        signers = await ethers.getSigners();
        [
            deployer,
            rewards,
            depositor,
            ...signers
          ] = signers;
        
        token = (await Erc20MockFactory.deploy('Test Token', 'TEST')) as Erc20Mock;
        alchVault = (await VaultMockFactory.deploy(token.address)) as VaultMock;
        transVault = (await VaultMockFactory.deploy(token.address)) as VaultMock;
        alchemist = (await AlchemistMockFactory.deploy(await rewards.getAddress())) as AlchemistMock;
        await alchemist.initialize(alchVault.address);
        transmuter = (await TransmuterMockFactory.deploy(await rewards.getAddress())) as TransmuterMock;
        await transmuter.initialize(transVault.address);

        alKeeper = (await AlKeeperFactory.deploy(alchemist.address, transmuter.address, token.address, await deployer.getAddress())) as AlKeeper;

        await token.mint(await depositor.getAddress(), parseEther("1000"));
        await token.connect(depositor).approve(alchemist.address, parseEther("1000"));
        await token.connect(depositor).approve(transmuter.address, parseEther("1000"));
    });

    describe("harvest transmuter", () => {
        let depositAmt = parseEther("100");
        let yieldAmt = parseEther("10")

        beforeEach(async () => {
            await transmuter.connect(depositor).deposit(depositAmt);
        })

        it("will not harvest the transmuter if it is paused", async () => {
            await token.mint(transVault.address, yieldAmt);
            await transmuter.setPause(true);
            let upkeep = await alKeeper.checkUpkeep('0x00');
            expect(upkeep.upkeepNeeded).eq(true);
            await alKeeper.performUpkeep(upkeep.performData);
            expect(await alKeeper.nextTask()).eq(1);
            let vaultBal = await token.balanceOf(transVault.address);
            expect(vaultBal).eq(depositAmt.add(yieldAmt))
        })

        it("will not harvest the transmuter if there is no yield", async () => {
            let upkeep = await alKeeper.checkUpkeep('0x00');
            expect(upkeep.upkeepNeeded).eq(true);
            await alKeeper.performUpkeep(upkeep.performData);
            expect(await alKeeper.nextTask()).eq(1);
            let vaultBal = await token.balanceOf(transVault.address);
            expect(vaultBal).eq(depositAmt)
        })

        it("harvests the transmuter and sets the next task", async () => {
            await token.mint(transVault.address, yieldAmt);
            let resp = await alKeeper.checkUpkeep('0x00');
            expect(resp.upkeepNeeded).eq(true);
            await alKeeper.performUpkeep(resp.performData);
            expect(await alKeeper.nextTask()).eq(1)
            let vaultBal = await token.balanceOf(transVault.address);
            expect(vaultBal).eq(depositAmt)
        })
    })
    
    describe("harvest alchemist", () => {
        let depositAmt = parseEther("100");
        let yieldAmt = parseEther("10")

        beforeEach(async () => {
            // run harvest transmuter
            await transmuter.connect(depositor).deposit(depositAmt);
            await token.mint(transVault.address, yieldAmt);
            let resp = await alKeeper.checkUpkeep('0x00');
            await alKeeper.performUpkeep(resp.performData);

            await alchemist.connect(depositor).deposit(depositAmt);
            await alchemist.connect(deployer).flush();
        })

        it("will not harvest the alchemist if it is paused", async () => {
            await token.mint(alchVault.address, yieldAmt);
            await alchemist.setEmergencyExit(true);
            let upkeep = await alKeeper.checkUpkeep('0x00');
            expect(upkeep.upkeepNeeded).eq(true);
            await alKeeper.performUpkeep(upkeep.performData);
            expect(await alKeeper.nextTask()).eq(2);
            let vaultBal = await token.balanceOf(alchVault.address);
            expect(vaultBal).eq(depositAmt.add(yieldAmt))
        })

        it("will not harvest the alchemist if there is no yield", async () => {
            let upkeep = await alKeeper.checkUpkeep('0x00');
            expect(upkeep.upkeepNeeded).eq(true);
            await alKeeper.performUpkeep(upkeep.performData);
            expect(await alKeeper.nextTask()).eq(2);
            let vaultBal = await token.balanceOf(alchVault.address);
            expect(vaultBal).eq(depositAmt);
        })

        it("harvests the alchemist and sets the next task", async () => {
            await token.mint(alchVault.address, yieldAmt);
            let resp = await alKeeper.checkUpkeep('0x00');
            expect(resp.upkeepNeeded).eq(true);
            await alKeeper.performUpkeep(resp.performData);
            expect(await alKeeper.nextTask()).eq(2);
            let vaultBal = await token.balanceOf(alchVault.address);
            expect(vaultBal).eq(depositAmt);
        })
    })

    describe("flush alchemist", () => {
        let depositAmt = parseEther("100");
        let deposit2Amt = parseEther("10")

        beforeEach(async () => {
            // run harvest transmuter
            await transmuter.connect(depositor).deposit(depositAmt);
            await token.mint(transVault.address, deposit2Amt);
            let tr = await alKeeper.checkUpkeep('0x00');
            await alKeeper.performUpkeep(tr.performData);

            // run harvest alchemist
            await alchemist.connect(depositor).deposit(depositAmt);
            await alchemist.connect(deployer).flush();
            await token.mint(alchVault.address, deposit2Amt);
            let ar = await alKeeper.checkUpkeep('0x00');
            await alKeeper.performUpkeep(ar.performData);
        })

        it("will not flush the alchemist if it is paused", async () => {
            await alchemist.connect(depositor).deposit(deposit2Amt);
            await alchemist.setEmergencyExit(true);
            let upkeep = await alKeeper.checkUpkeep('0x00');
            expect(upkeep.upkeepNeeded).eq(true);
            await alKeeper.performUpkeep(upkeep.performData);
            expect(await alKeeper.nextTask()).eq(0);
            let vaultBal = await token.balanceOf(alchVault.address);
            expect(vaultBal).eq(depositAmt)
            let alchBal = await token.balanceOf(alchemist.address);
            expect(alchBal).eq(deposit2Amt)
        })

        it("will not flush the alchemist if there are no deposits", async () => {
            let upkeep = await alKeeper.checkUpkeep('0x00');
            expect(upkeep.upkeepNeeded).eq(true);
            await alKeeper.performUpkeep(upkeep.performData);
            expect(await alKeeper.nextTask()).eq(0);
            let vaultBal = await token.balanceOf(alchVault.address);
            expect(vaultBal).eq(depositAmt)
        })

        it("flushes the alchemist and sets the next task", async () => {
            await alchemist.connect(depositor).deposit(deposit2Amt);
            let upkeep = await alKeeper.checkUpkeep('0x00');
            expect(upkeep.upkeepNeeded).eq(true);
            await alKeeper.performUpkeep(upkeep.performData);
            expect(await alKeeper.nextTask()).eq(0);
            let vaultBal = await token.balanceOf(alchVault.address);
            expect(vaultBal).eq(depositAmt.add(deposit2Amt))
            let alchBal = await token.balanceOf(alchemist.address);
            expect(alchBal).eq(0)
        })
    })
})