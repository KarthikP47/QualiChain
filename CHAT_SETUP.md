# Blockchain Chat System Setup Guide

## Overview
The chat system allows users to create and join chat rooms secured by blockchain. Room creation and membership are recorded on-chain using the ChatRoom smart contract.

## Components

### 1. Smart Contract (`contracts/contracts/ChatRoom.sol`)
- Creates chat rooms on the blockchain
- Manages room membership (join/leave)
- Tracks room information and member counts

### 2. Database Tables
Run the migration to create chat tables:
```sql
mysql -u root -p < sql/migration_add_chat.sql
```

Tables created:
- `chat_rooms`: Stores room information synced from blockchain
- `chat_room_members`: Tracks which users are members of which rooms
- `chat_messages`: Stores chat messages (off-chain for performance)

### 3. Backend Routes (`backend/routes/chat.js`)
- `GET /api/chat/rooms` - List all chat rooms
- `POST /api/chat/rooms` - Create a new room (blockchain)
- `POST /api/chat/rooms/:roomId/join` - Join a room (blockchain)
- `GET /api/chat/rooms/:roomId/messages` - Get messages for a room
- `GET /api/chat/rooms/:roomId/members` - Get room members

### 4. WebSocket Events (Socket.io)
- `joinRoom` - Join a chat room socket room
- `leaveRoom` - Leave a chat room socket room
- `sendChatMessage` - Send a message to a room
- `receiveChatMessage` - Receive a new message (broadcast)

### 5. Frontend Component (`frontend/src/pages/Chat.jsx`)
- Room list sidebar
- Chat interface with messages
- Real-time message updates via WebSocket

## Deployment Steps

### 1. Deploy ChatRoom Contract

```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy-chat.js --network localhost
```

Create `contracts/scripts/deploy-chat.js`:
```javascript
const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const ChatRoomFactory = await ethers.getContractFactory("ChatRoom");
  const chatRoom = await ChatRoomFactory.deploy();
  await chatRoom.waitForDeployment();
  
  console.log("ChatRoom deployed to:", await chatRoom.getAddress());
}

main().catch(console.error);
```

### 2. Configure Backend

Add to `backend/.env`:
```
CHAT_ROOM_ADDRESS=<deployed_contract_address>
PRIVATE_KEY=<your_private_key>
RPC_URL=http://127.0.0.1:8545
```

### 3. Run Database Migration

```bash
mysql -u root -p < sql/migration_add_chat.sql
```

### 4. Start Backend

```bash
cd backend
npm start
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

## Usage

1. **Login** - Users must be logged in to use chat
2. **Create Room** - Enter a room name and click "Create Room"
   - This creates a room on the blockchain
   - You automatically join as the first member
3. **Join Room** - Click on any room in the sidebar to join
   - Membership is recorded on the blockchain
4. **Send Messages** - Type in the message input and press Enter
   - Messages are sent in real-time via WebSocket
   - All members of the room receive the message instantly

## Features

- ✅ Blockchain-secured room creation
- ✅ Blockchain-verified membership
- ✅ Real-time messaging via WebSocket
- ✅ Message history stored in database
- ✅ Member list tracking
- ✅ Multiple rooms support

## Notes

- Messages are stored off-chain in the database for performance
- Room creation and membership are on-chain for security
- The system gracefully handles blockchain failures (falls back to DB-only mode)
- Users need a wallet address to create rooms (join works without wallet)
