import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

async function main() {
  console.log("Deploying ChatRoom contract...");

  const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
  const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356";

  if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in environment variables");
  }

  const provider = new JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);

  console.log("Deploying from address:", wallet.address);

  // Load contract artifact
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "ChatRoom.sol",
    "ChatRoom.json"
  );

  if (!existsSync(artifactPath)) {
    throw new Error("Contract artifact not found. Run 'npx hardhat compile' first.");
  }

  const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
  const ChatRoomFactory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log("Deploying contract...");
  const chatRoom = await ChatRoomFactory.deploy();
  await chatRoom.waitForDeployment();

  const address = await chatRoom.getAddress();
  console.log("ChatRoom deployed to:", address);

  // Save deployment info
  const deploymentInfo = {
    address: address,
    network: "localhost",
    deployedAt: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, "..", "deployments", "chat-room.json");
  mkdirSync(path.dirname(deploymentPath), { recursive: true });
  writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("Deployment info saved to:", deploymentPath);
  console.log("\nAdd this to your backend .env file:");
  console.log(`CHAT_ROOM_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
