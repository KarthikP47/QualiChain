# Deploy ChatRoom Contract

## Step 1: Start Hardhat Local Node

Open a **new terminal window** and run:

```bash
cd contracts
npx hardhat node
```

This will start a local blockchain node on `http://127.0.0.1:8545`. Keep this terminal running.

You'll see output like:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts:
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
...
```

## Step 2: Deploy the Contract

In a **separate terminal window**, run:

```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy-chat.js --network localhost
```

This will:
1. Compile the ChatRoom contract
2. Deploy it to the local Hardhat node
3. Print the contract address

Example output:
```
Deploying ChatRoom contract...
Deploying from address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Deploying contract...
ChatRoom deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Deployment info saved to: contracts/deployments/chat-room.json

Add this to your backend .env file:
CHAT_ROOM_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## Step 3: Update Backend Configuration

Add the contract address to `backend/.env`:

```
CHAT_ROOM_ADDRESS=<the_deployed_address_from_step_2>
PRIVATE_KEY=<one_of_the_private_keys_from_hardhat_node>
RPC_URL=http://127.0.0.1:8545
```

You can use any of the private keys shown when you started `npx hardhat node`.

## Step 4: Run Database Migration

```bash
mysql -u root -p < sql/migration_add_chat.sql
```

## Step 5: Start Backend

```bash
cd backend
npm start
```

The chat system should now be ready! Navigate to `/chat` in your frontend app.
