import hre from "hardhat";

async function main() {
    console.log("Starting deployment on Sepolia...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // Deploy RewardToken
    console.log("\n1. Deploying RewardToken...");
    const RewardToken = await hre.ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy();
    await rewardToken.waitForDeployment();
    const tokenAddress = await rewardToken.getAddress();
    console.log("RewardToken deployed to:", tokenAddress);

    // Deploy RewardDistributor
    console.log("\n2. Deploying RewardDistributor...");
    const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
    const rewardDistributor = await RewardDistributor.deploy(tokenAddress);
    await rewardDistributor.waitForDeployment();
    const distributorAddress = await rewardDistributor.getAddress();
    console.log("RewardDistributor deployed to:", distributorAddress);

    // Deploy ChatRoom
    console.log("\n3. Deploying ChatRoom...");
    const ChatRoom = await hre.ethers.getContractFactory("ChatRoom");
    const chatRoom = await ChatRoom.deploy();
    await chatRoom.waitForDeployment();
    const chatRoomAddress = await chatRoom.getAddress();
    console.log("ChatRoom deployed to:", chatRoomAddress);

    console.log("\n=== Deployment Completed Successfully ===");
    console.log("Save these addresses for your presentation/frontend:");
    console.log(`RewardToken: ${tokenAddress}`);
    console.log(`RewardDistributor: ${distributorAddress}`);
    console.log(`ChatRoom: ${chatRoomAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment Failed:", error);
        process.exit(1);
    });
