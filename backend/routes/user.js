const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/users/:id/summary
router.get('/:id/summary', async (req, res) => {
  try {
    const userId = req.params.id;

    // basic user info
    const [[user]] = await pool.query(
      'SELECT id, username, email, wallet_address, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // total tokens & number of rewards
    const [[rewardAgg]] = await pool.query(
      'SELECT COALESCE(SUM(tokens_awarded), 0) AS totalTokens, COUNT(*) AS rewardsCount FROM rewards WHERE user_id = ?',
      [userId]
    );

    // number of posts
    const [[postAgg]] = await pool.query(
      'SELECT COUNT(*) AS postsCount FROM posts WHERE user_id = ?',
      [userId]
    );

    // latest 5 rewards
    const [recentRewards] = await pool.query(
      `SELECT r.id, r.post_id, r.tokens_awarded, r.tx_hash, r.created_at, p.title
       FROM rewards r
       LEFT JOIN posts p ON r.post_id = p.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      user,
      totals: {
        totalTokens: rewardAgg.totalTokens || 0,
        rewardsCount: rewardAgg.rewardsCount || 0,
        postsCount: postAgg.postsCount || 0
      },
      recentRewards
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user summary' });
  }
});

module.exports = router;
