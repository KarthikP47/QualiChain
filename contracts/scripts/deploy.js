import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";
import * as dotenv from "dotenv";

// If you want, you can load the same .env as backend later
// dotenv.config({ path: "../backend/.env" });
// For now we'll paste the private key directly in the next step.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// RPC of Hardhat local node
const provider = new JsonRpcProvider("http://127.0.0.1:8545");

// TODO: REPLACE THIS STRING with one private key from `npx hardhat node` output
const PRIVATE_KEY = "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356";

const wallet = new Wallet(PRIVATE_KEY, provider);

function loadArtifact(name) {
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    `${name}.sol`,
    `${name}.json`
  );
  const json = JSON.parse(readFileSync(artifactPath, "utf8"));
  return json;
}

async function main() {
  console.log("Deploying contracts...");

  const tokenArtifact = loadArtifact("RewardToken");
  const distributorArtifact = loadArtifact("RewardDistributor");

  const TokenFactory = new ContractFactory(
    tokenArtifact.abi,
    tokenArtifact.bytecode,
    wallet
  );

  const token = await TokenFactory.deploy();
  await token.waitForDeployment();
  const tokenAddress = token.target;
  console.log("RewardToken deployed at:", tokenAddress);

  const DistributorFactory = new ContractFactory(
    distributorArtifact.abi,
    distributorArtifact.bytecode,
    wallet
  );

  const distributor = await DistributorFactory.deploy(tokenAddress);
  await distributor.waitForDeployment();
  const distributorAddress = distributor.target;
  console.log("RewardDistributor deployed at:", distributorAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
