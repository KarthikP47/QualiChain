const express = require('express');
const router = express.Router();
const pool = require('../db');
const { distributor } = require('../contracts');
const { ethers } = require('ethers');


// Simple content-quality scoring.
// You can later mention this formula in your report.
// --- RandomForest-style ML quality model ---
// Features: lengthNorm, upvoteNorm, uniqueNorm
// Output: probability that content is "high quality" (0 to 1)

function randomForestQuality(lengthNorm, upvoteNorm, uniqueNorm) {
  // Tree 1: prefers long + some upvotes
  const t1 = (lengthNorm > 0.5 && upvoteNorm > 0.25) ? 1 : 0;

  // Tree 2: prefers strong community support or very unique text
  const t2 = (upvoteNorm > 0.5 || uniqueNorm > 0.6) ? 1 : 0;

  // Tree 3: prefers very long OR medium length with decent upvotes & uniqueness
  const t3 = (lengthNorm > 0.8 || (lengthNorm > 0.4 && upvoteNorm > 0.3 && uniqueNorm > 0.4)) ? 1 : 0;

  const votes = t1 + t2 + t3;
  const prob = votes / 3; // 0, 1/3, 2/3, or 1

  return prob;
}

// Main quality scoring function
function computeQualityScore(body, upvotes) {
  const text = (body || "").trim();
  if (!text) return 0;

  const words = text.split(/\s+/).filter(Boolean);
  const total = words.length || 1;
  const unique = new Set(words.map((w) => w.toLowerCase())).size;

  // Normalized features (0–1)
  const lengthNorm = Math.min(1, total / 200);   // >=200 words => 1
  const upvotesNorm = Math.min(1, upvotes / 8);  // >=8 upvotes => 1
  const uniqueNorm = unique / total;             // 0–1

  // Base weighted score (as before)
  const W_LENGTH = 0.4;
  const W_UPVOTES = 0.4;
  const W_UNIQUE = 0.2;

  const baseScore =
    100 *
    (W_LENGTH * lengthNorm +
     W_UPVOTES * upvotesNorm +
     W_UNIQUE * uniqueNorm);

  // ML-like RandomForest probability [0–1]
  const rfProb = randomForestQuality(lengthNorm, upvotesNorm, uniqueNorm);

  // Combine: if RF thinks content is bad, reduce score; if good, keep it
  // rfProb = 0   -> multiplier = 0.5 (cut score)
  // rfProb = 0.5 -> multiplier = 0.75
  // rfProb = 1   -> multiplier = 1   (keep score)
  const multiplier = 0.5 + 0.5 * rfProb;
  const finalScore = baseScore * multiplier;

  return Number(finalScore.toFixed(2));
}

// GET /api/posts – list all posts
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.username 
       FROM posts p 
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts – create post
// body: { user_id, title, body }
router.post('/', async (req, res) => {
  try {
    const { user_id, title, body } = req.body;

    if (!user_id || !body) {
      return res.status(400).json({ error: 'Missing user_id or body' });
    }

    const [result] = await pool.query(
      'INSERT INTO posts (user_id, title, body) VALUES (?,?,?)',
      [user_id, title || null, body]
    );

    const postId = result.insertId;

    // initial upvotes = 0
    const score = computeQualityScore(body, 0);
    await pool.query(
      'UPDATE posts SET quality_score = ? WHERE id = ?',
      [score, postId]
    );

    res.json({ ok: true, postId, quality_score: score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts/:id/upvote – increment upvotes and recompute score
router.post('/:id/upvote', async (req, res) => {
  try {
    const postId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' });
    }

    // check if exists (already upvoted)
    const [existing] = await pool.query(
      'SELECT id FROM post_upvotes WHERE post_id = ? AND user_id = ?',
      [postId, user_id]
    );

    if (existing.length > 0) {
      // => remove upvote
      await pool.query(
        'DELETE FROM post_upvotes WHERE post_id = ? AND user_id = ?',
        [postId, user_id]
      );

      await pool.query(
        'UPDATE posts SET upvotes = upvotes - 1 WHERE id = ? AND upvotes > 0',
        [postId]
      );

    } else {
      // => add upvote
      await pool.query(
        'INSERT INTO post_upvotes (post_id, user_id) VALUES (?, ?)',
        [postId, user_id]
      );

      await pool.query(
        'UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?',
        [postId]
      );
    }

    // update score
    const [rows] = await pool.query(
      'SELECT body, upvotes FROM posts WHERE id = ?',
      [postId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const { body, upvotes } = rows[0];
    const newScore = computeQualityScore(body, upvotes);

    await pool.query(
      'UPDATE posts SET quality_score = ? WHERE id = ?',
      [newScore, postId]
    );

    res.json({
      ok: true,
      upvotes,
      quality_score: newScore,
      message: existing.length > 0 ? "removed" : "added"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Toggle upvote error' });
  }
});



// POST /api/posts/:id/claim
// body: { user_id }
router.post('/:id/claim', async (req, res) => {
  try {
    const postId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' });
    }

    // get post
    const [[post]] = await pool.query(
      'SELECT * FROM posts WHERE id = ?',
      [postId]
    );
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // get user wallet
    const [[user]] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [user_id]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.wallet_address) {
      return res.status(400).json({ error: 'User has no wallet_address set' });
    }

    const quality = post.quality_score || 0;

    // Simple token formula: 0.1 token per quality point
    const tokens = Number((quality * 0.1).toFixed(4));

    if (tokens <= 0) {
      return res.status(400).json({ error: 'Quality too low, no rewards' });
    }

    console.log(`Awarding ${tokens} tokens to ${user.wallet_address} for post ${postId}`);

    const tx = await distributor.award(
      user.wallet_address,
      ethers.parseUnits(tokens.toString(), 18),
      Number(postId)
    );
    const receipt = await tx.wait();

    // record in rewards table
    await pool.query(
      'INSERT INTO rewards (user_id, post_id, tokens_awarded, tx_hash) VALUES (?,?,?,?)',
      [user_id, postId, tokens, receipt.hash]
    );

    res.json({
      ok: true,
      txHash: receipt.hash,
      tokens_awarded: tokens
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Claim failed', details: err.message });
  }
});


module.exports = router;
