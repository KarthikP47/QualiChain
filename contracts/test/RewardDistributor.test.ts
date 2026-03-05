import { expect } from "chai";
import hre from "hardhat";

describe("RewardDistributor Contract", function () {
    let rewardDistributor: any;
    let rewardToken: any;
    let owner: any;
    let addr1: any;

    beforeEach(async function () {
        [owner, addr1] = await hre.ethers.getSigners();

        const RewardToken = await hre.ethers.getContractFactory("RewardToken");
        rewardToken = await RewardToken.deploy();

        const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
        const tokenAddress = await rewardToken.getAddress();
        rewardDistributor = await RewardDistributor.deploy(tokenAddress);
    });

    it("Should correctly assign admin", async function () {
        const admin = await rewardDistributor.admin();
        expect(admin).to.equal(owner.address);
    });

    it("Should award tokens to user if caller is admin", async function () {
        const amount = hre.ethers.parseUnits("50", 18);
        const postId = 101n;

        await rewardDistributor.award(addr1.address, amount, postId);

        const balance = await rewardToken.balanceOf(addr1.address);
        expect(balance).to.equal(amount);
    });

    it("Should reject non-admin awarding tokens", async function () {
        const amount = hre.ethers.parseUnits("50", 18);
        const postId = 101n;

        let failed = false;
        try {
            await rewardDistributor.connect(addr1).award(addr1.address, amount, postId);
        } catch (error: any) {
            failed = true;
            expect(error.message).to.include("only admin");
        }
        expect(failed).to.equal(true);
    });
});
