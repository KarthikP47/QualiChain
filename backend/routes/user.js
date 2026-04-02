const express = require('express');
const router = express.Router();
const pool = require('../db');
const path = require('path');
const multer = require('multer');
const { getUserBadges } = require('../badges');
const { getBadgeImageUrl } = require('../badgeImages');

// Configure Multer Storage for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

// GET /api/users/:id/summary
router.get('/:id/summary', async (req, res) => {
  try {
    const userId = req.params.id;

    // basic user info
    const [[user]] = await pool.query(
      'SELECT id, username, email, wallet_address, created_at, avatar_url FROM users WHERE id = ?',
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

    // Get user badges and add image URLs
    const badges = await getUserBadges(userId);
    const badgesWithImages = badges.map(badge => ({
      ...badge,
      imageUrl: getBadgeImageUrl(badge)
    }));

    // get follower and following lists
    const [followersList] = await pool.query(
      'SELECT u.id, u.username, u.avatar_url FROM follows f JOIN users u ON f.follower_id = u.id WHERE f.following_id = ?',
      [userId]
    );
    const [followingList] = await pool.query(
      'SELECT u.id, u.username, u.avatar_url FROM follows f JOIN users u ON f.following_id = u.id WHERE f.follower_id = ?',
      [userId]
    );

    res.json({
      user,
      totals: {
        totalTokens: rewardAgg.totalTokens || 0,
        rewardsCount: rewardAgg.rewardsCount || 0,
        postsCount: postAgg.postsCount || 0
      },
      recentRewards,
      badges: badgesWithImages,
      followersList,
      followingList
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user summary' });
  }
});

// GET /api/users/:id/badges
router.get('/:id/badges', async (req, res) => {
  try {
    const userId = req.params.id;
    const badges = await getUserBadges(userId);
    res.json(badges);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// PUT /api/users/:id/avatar
router.put('/:id/avatar', async (req, res) => {
  try {
    const userId = req.params.id;
    const { avatar_url } = req.body;
    await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar_url, userId]);
    res.json({ ok: true, avatar_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

// PUT /api/users/:id/wallet
router.put('/:id/wallet', async (req, res) => {
  try {
    const userId = req.params.id;
    const { wallet_address } = req.body;

    // Check if wallet is already used by someone else
    const [existing] = await pool.query('SELECT id FROM users WHERE wallet_address = ? AND id != ?', [wallet_address, userId]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Wallet address is already used by another account' });
    }

    await pool.query('UPDATE users SET wallet_address = ? WHERE id = ?', [wallet_address, userId]);
    res.json({ ok: true, wallet_address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update wallet address' });
  }
});

// POST /api/users/:id/avatar/upload
router.post('/:id/avatar/upload', upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Build public URL pointing to backend server
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const avatar_url = `${backendUrl}/uploads/${req.file.filename}`;

    await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar_url, userId]);

    res.json({ ok: true, avatar_url });
  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ error: 'Failed to upload avatar image' });
  }
});

// GET /api/users/:id/public_profile
router.get('/:id/public_profile', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const callerId = req.query.caller_id || null;

    // basic user info
    const [[user]] = await pool.query(
      'SELECT id, username, wallet_address, created_at, avatar_url FROM users WHERE id = ?',
      [targetUserId]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Followers & Following
    const [followersList] = await pool.query('SELECT u.id, u.username, u.avatar_url FROM follows f JOIN users u ON f.follower_id = u.id WHERE f.following_id = ?', [targetUserId]);
    const [followingList] = await pool.query('SELECT u.id, u.username, u.avatar_url FROM follows f JOIN users u ON f.following_id = u.id WHERE f.follower_id = ?', [targetUserId]);
    
    // Is following?
    let isFollowing = false;
    if (callerId && String(callerId) !== String(targetUserId)) {
      const [[followStatus]] = await pool.query('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [callerId, targetUserId]);
      if (followStatus) isFollowing = true;
    }

    // Get user badges
    const badges = await getUserBadges(targetUserId);
    const badgesWithImages = badges.map(badge => ({
      ...badge,
      imageUrl: getBadgeImageUrl(badge)
    }));
    
    // Get user posts
    const [posts] = await pool.query(
      'SELECT id, title, body, excerpt, upvotes, downvotes, quality_score, image_url, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC',
      [targetUserId]
    );

    res.json({
      user,
      followersCount: followersList.length,
      followingCount: followingList.length,
      followersList,
      followingList,
      isFollowing,
      badges: badgesWithImages,
      posts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch public profile' });
  }
});

// POST /api/users/:id/follow
router.post('/:id/follow', async (req, res) => {
  try {
    const followingId = req.params.id;
    const followerId = req.body.follower_id;
    if (!followerId) return res.status(400).json({ error: "Missing follower_id" });
    if (String(followingId) === String(followerId)) return res.status(400).json({ error: "Cannot follow yourself" });

    // Ensure the target user exists
    const [[targetUser]] = await pool.query('SELECT id FROM users WHERE id = ?', [followingId]);
    if(!targetUser) return res.status(404).json({error: "User not found"});

    const [[existing]] = await pool.query('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId]);
    if (existing) {
      await pool.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId]);
      return res.json({ following: false });
    } else {
      await pool.query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [followerId, followingId]);
      return res.json({ following: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Follow error" });
  }
});

module.exports = router;
