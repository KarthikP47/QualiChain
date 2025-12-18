const { ethers } = require('ethers');
require('dotenv').config();

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Minimal ABI for RewardDistributor
const distributorAbi = [
  "function award(address user, uint256 amount, uint256 postId) external"
];

if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.warn("⚠️ PRIVATE_KEY or CONTRACT_ADDRESS not set in .env");
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const distributor = new ethers.Contract(CONTRACT_ADDRESS, distributorAbi, wallet);

module.exports = {
  provider,
  wallet,
  distributor
};
