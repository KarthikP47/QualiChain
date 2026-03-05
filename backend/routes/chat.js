const express = require('express');
const router = express.Router();
const pool = require('../db');
const { ethers } = require('ethers');

// Load ChatRoom contract ABI and address
let chatRoomContract = null;
const CHAT_ROOM_ABI = [
  "function createRoom(uint256 roomId, string memory name, string memory password) external",
  "function joinRoom(uint256 roomId, string memory password) external",
  "function leaveRoom(uint256 roomId) external",
  "function deleteRoom(uint256 roomId) external",
  "function isMember(uint256 roomId, address user) external view returns (bool)",
  "function getRoomInfo(uint256 roomId) external view returns (string memory name, address creator, uint256 createdAt, bool exists)",
  "function getMemberCount(uint256 roomId) external view returns (uint256)",
  "function roomCount() external view returns (uint256)",
  "event RoomCreated(uint256 indexed roomId, string name, address creator)",
  "event MemberJoined(uint256 indexed roomId, address member)",
  "event MemberLeft(uint256 indexed roomId, address member)",
  "event RoomDeleted(uint256 indexed roomId)"
];

// Initialize contract (will be set after deployment)
function initChatContract(provider, contractAddress, signer) {
  if (contractAddress && provider) {
    try {
      chatRoomContract = new ethers.Contract(contractAddress, CHAT_ROOM_ABI, signer || provider);
      console.log('ChatRoom contract initialized at:', contractAddress);
    } catch (err) {
      console.error('Error initializing ChatRoom contract:', err);
    }
  }
}

// Try to load contract from environment or use default
if (process.env.CHAT_ROOM_ADDRESS && process.env.PRIVATE_KEY) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    initChatContract(provider, process.env.CHAT_ROOM_ADDRESS, signer);
  } catch (err) {
    console.warn('Could not initialize ChatRoom contract:', err.message);
  }
}

// GET /api/chat/rooms - Get all chat rooms
router.get('/rooms', async (req, res) => {
  try {
    const [rooms] = await pool.query(
      'SELECT * FROM chat_rooms ORDER BY created_at DESC'
    );
    res.json(rooms);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// POST /api/chat/rooms - Create a new chat room (blockchain)
router.post('/rooms', async (req, res) => {
  try {
    const { name, wallet_address, password } = req.body;
    const roomPassword = password || "";

    if (!name || !wallet_address) {
      return res.status(400).json({ error: 'Name and wallet_address required' });
    }

    if (!chatRoomContract) {
      return res.status(503).json({ error: 'ChatRoom contract not initialized. Please deploy the contract first.' });
    }

    // Generate random 6-digit roomId
    let roomId = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if ID already exists
    let [existingRoom] = await pool.query('SELECT room_id_uint256 FROM chat_rooms WHERE room_id_uint256 = ?', [roomId]);
    while (existingRoom.length > 0) {
      roomId = Math.floor(100000 + Math.random() * 900000).toString();
      [existingRoom] = await pool.query('SELECT room_id_uint256 FROM chat_rooms WHERE room_id_uint256 = ?', [roomId]);
    }

    // Create room on blockchain
    let tx;
    try {
      tx = await chatRoomContract.createRoom(roomId, name, roomPassword);
      const receipt = await tx.wait();

      // Save to database
      await pool.query(
        'INSERT INTO chat_rooms (room_id_uint256, name, creator_wallet, password) VALUES (?, ?, ?, ?)',
        [roomId, name, wallet_address, roomPassword]
      );

      res.json({
        ok: true,
        roomId: roomId,
        name: name,
        txHash: receipt.hash
      });
    } catch (blockchainErr) {
      console.error('Blockchain error:', blockchainErr);
      // Still create room in DB for testing using the generated roomId
      await pool.query(
        'INSERT INTO chat_rooms (room_id_uint256, name, creator_wallet, password) VALUES (?, ?, ?, ?)',
        [roomId, name, wallet_address, roomPassword]
      );
      res.json({
        ok: true,
        roomId: roomId,
        name: name,
        warning: 'Blockchain transaction failed, but room created in database'
      });
    }
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ error: 'Failed to create room', details: err.message });
  }
});

// POST /api/chat/rooms/:roomId/join - Join a chat room (blockchain)
router.post('/rooms/:roomId/join', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { user_id, wallet_address, password } = req.body;
    const roomPassword = password || "";

    if (!user_id || !wallet_address) {
      return res.status(400).json({ error: 'user_id and wallet_address required' });
    }

    // Check if user is already a member
    const [existing] = await pool.query(
      'SELECT * FROM chat_room_members WHERE room_id_uint256 = ? AND user_id = ? AND is_active = TRUE',
      [roomId, user_id]
    );

    if (existing.length > 0) {
      return res.json({ ok: true, message: 'Already a member' });
    }

    // Check password from database
    const [roomDb] = await pool.query(
      'SELECT password FROM chat_rooms WHERE room_id_uint256 = ?',
      [roomId]
    );

    if (roomDb.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const dbPassword = roomDb[0].password || "";
    if (dbPassword !== "" && dbPassword !== roomPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Join on blockchain
    if (chatRoomContract) {
      try {
        const tx = await chatRoomContract.joinRoom(roomId, roomPassword);
        await tx.wait();
      } catch (blockchainErr) {
        console.warn('Blockchain join failed, continuing with DB:', blockchainErr.message);
      }
    }

    // Get username
    const [[user]] = await pool.query('SELECT username FROM users WHERE id = ?', [user_id]);

    // Save to database
    await pool.query(
      'INSERT INTO chat_room_members (room_id_uint256, user_id, wallet_address) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE is_active = TRUE',
      [roomId, user_id, wallet_address]
    );

    res.json({ ok: true, message: 'Joined room successfully' });
  } catch (err) {
    console.error('Error joining room:', err);
    res.status(500).json({ error: 'Failed to join room', details: err.message });
  }
});

// DELETE /api/chat/rooms/:roomId - Delete a chat room (creator only)
router.delete('/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const wallet_address = req.headers['x-wallet-address']; // Pass wallet in headers

    if (!wallet_address) {
      return res.status(401).json({ error: 'Wallet address required to delete room' });
    }

    // Verify creator in database
    const [roomDb] = await pool.query(
      'SELECT creator_wallet FROM chat_rooms WHERE room_id_uint256 = ?',
      [roomId]
    );

    if (roomDb.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (roomDb[0].creator_wallet !== wallet_address) {
      return res.status(403).json({ error: 'Only the room creator can delete this room' });
    }

    // Delete on blockchain first if explicitly available
    if (chatRoomContract) {
      try {
        const tx = await chatRoomContract.deleteRoom(roomId);
        await tx.wait();
      } catch (blockchainErr) {
        console.warn('Blockchain delete failed, continuing with DB:', blockchainErr.message);
      }
    }

    // Delete from database (cascade handles members and messages if FK allows, otherwise delete explicitly)
    await pool.query('DELETE FROM chat_messages WHERE room_id_uint256 = ?', [roomId]);
    await pool.query('DELETE FROM chat_room_members WHERE room_id_uint256 = ?', [roomId]);
    await pool.query('DELETE FROM chat_rooms WHERE room_id_uint256 = ?', [roomId]);

    res.json({ ok: true, message: 'Room deleted successfully' });
  } catch (err) {
    console.error('Error deleting room:', err);
    res.status(500).json({ error: 'Failed to delete room', details: err.message });
  }
});

// GET /api/chat/rooms/:roomId/messages - Get messages for a room
router.get('/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const [messages] = await pool.query(
      `SELECT cm.*, u.avatar_url FROM chat_messages cm
       LEFT JOIN users u ON cm.user_id = u.id
       WHERE cm.room_id_uint256 = ? 
       ORDER BY cm.created_at DESC 
       LIMIT ?`,
      [roomId, limit]
    );

    res.json(messages.reverse()); // Reverse to show oldest first
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/chat/rooms/:roomId/members - Get members of a room
router.get('/rooms/:roomId/members', async (req, res) => {
  try {
    const { roomId } = req.params;

    const [members] = await pool.query(
      `SELECT crm.*, u.username, u.avatar_url 
       FROM chat_room_members crm
       JOIN users u ON crm.user_id = u.id
       WHERE crm.room_id_uint256 = ? AND crm.is_active = TRUE
       ORDER BY crm.joined_at ASC`,
      [roomId]
    );

    res.json(members);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Export init function for use in index.js
module.exports = router;
module.exports.initChatContract = initChatContract;
