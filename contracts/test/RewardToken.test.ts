import { expect } from "chai";
import hre from "hardhat";

describe("RewardToken Contract", function () {
    let rewardToken: any;
    let owner: any;
    let addr1: any;

    beforeEach(async function () {
        [owner, addr1] = await hre.ethers.getSigners();
        const RewardToken = await hre.ethers.getContractFactory("RewardToken");
        rewardToken = await RewardToken.deploy();
    });

    it("Should have correct name and symbol", async function () {
        const name = await rewardToken.name();
        const symbol = await rewardToken.symbol();
        expect(name).to.equal("BOSMToken");
        expect(symbol).to.equal("BOSM");
    });

    it("Should mint initial supply to admin", async function () {
        const adminBalance = await rewardToken.balanceOf(owner.address);
        const decimals = await rewardToken.decimals();
        const expectedSupply = hre.ethers.parseUnits("1000000", decimals);
        expect(adminBalance).to.equal(expectedSupply);
    });

    it("Should allow anyone to mint tokens", async function () {
        const decimals = await rewardToken.decimals();
        const amountToMint = hre.ethers.parseUnits("1000", decimals);

        await rewardToken.connect(addr1).mint(addr1.address, amountToMint);
        const addr1Balance = await rewardToken.balanceOf(addr1.address);

        expect(addr1Balance).to.equal(amountToMint);
    });
});
