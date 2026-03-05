# Chat System Setup - Environment Configuration

## ✅ Contract Deployed Successfully!

**ChatRoom Contract Address:** `0xef11D1c2aA48826D4c41e54ab82D1Ff5Ad8A64Ca`

## Step 1: Update Backend .env File

Add these lines to `backend/.env`:

```env
# Chat Room Contract (NEW - Add this)
CHAT_ROOM_ADDRESS=0xef11D1c2aA48826D4c41e54ab82D1Ff5Ad8A64Ca

# Blockchain Configuration (if not already present)
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356
```

**Note:** Use one of the private keys from your Hardhat node output. The one above is the default first account.

## Step 2: Run Database Migration

Run this command to create the chat tables:

```bash
mysql -u root -p < sql/migration_add_chat.sql
```

Or manually run the SQL in `sql/migration_add_chat.sql` in your MySQL client.

## Step 3: Restart Backend Server

After updating `.env`, restart your backend:

```bash
cd backend
npm start
```

You should see:
- ChatRoom contract initialized (if configured correctly)
- Socket.io server running
- Chat routes available at `/api/chat/*`

## Step 4: Test the Chat System

1. Start your frontend: `cd frontend && npm run dev`
2. Login to your account
3. Navigate to `/chat` in your browser
4. Create a new chat room
5. Send messages!

## Troubleshooting

### If chat contract shows "not initialized":
- Check that `CHAT_ROOM_ADDRESS` is set in `.env`
- Make sure Hardhat node is still running
- Verify the contract address is correct

### If you get blockchain errors:
- The system will fall back to database-only mode
- Rooms will still work, just without blockchain verification
- Check that Hardhat node is running on port 8545

### If database errors occur:
- Make sure you ran the migration: `sql/migration_add_chat.sql`
- Check your MySQL connection settings in `.env`
