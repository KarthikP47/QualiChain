const express = require('express');
const router = express.Router();
const pool = require('../db');

// Global Search Route
router.get('/', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.json({ posts: [], users: [] });
        }

        const searchTerm = `%${q.trim()}%`;

        // Search for Posts
        const [posts] = await pool.query(`
      SELECT p.*, u.username, u.avatar_url,
             (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.title LIKE ? OR p.body LIKE ? OR u.username LIKE ?
      ORDER BY p.created_at DESC
      LIMIT 20
    `, [searchTerm, searchTerm, searchTerm]);

        // Search for Users
        const [users] = await pool.query(`
      SELECT id, username, email, avatar_url, bio, reputation, total_rewards, wallet_address, created_at
      FROM users
      WHERE username LIKE ? OR bio LIKE ?
      LIMIT 20
    `, [searchTerm, searchTerm]);

        res.json({ posts, users });
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Server error during search" });
    }
});

module.exports = router;
