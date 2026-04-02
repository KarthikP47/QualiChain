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

        const searchTerm = `%${q.trim().toLowerCase()}%`;
        const lowerSearchTerm = searchTerm;

        // Search for Posts
        const [posts] = await pool.query(`
      SELECT p.*, u.username, u.avatar_url,
             (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE LOWER(p.title) LIKE ? OR LOWER(p.body) LIKE ? OR LOWER(u.username) LIKE ?
      ORDER BY p.created_at DESC
      LIMIT 20
    `, [lowerSearchTerm, lowerSearchTerm, lowerSearchTerm]);

        // Search for Users
        const [users] = await pool.query(`
      SELECT id, username, email, avatar_url, wallet_address, created_at, total_rewards
      FROM users
      WHERE LOWER(username) LIKE ?
      LIMIT 20
    `, [lowerSearchTerm]);

        res.json({ posts, users });
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Server error during search" });
    }
});

module.exports = router;
