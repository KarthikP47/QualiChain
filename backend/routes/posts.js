const express = require("express");
const router = express.Router();
const pool = require("../db");
const { distributor } = require("../contracts");
const { ethers } = require("ethers");
const { PythonShell } = require("python-shell");
const path = require("path");
const { checkAndAwardBadges } = require("../badges");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// Configure Multer Storage for post image attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-post-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

/* ---------------------------------------------------------
   REAL ML QUALITY SCORE (Random Forest via Python)
--------------------------------------------------------- */

let persistentPyShell = null;
let reqIdCounter = 0;
const pendingRequests = new Map();

function initPyShell() {
  persistentPyShell = new PythonShell("score.py", {
    mode: "text",
    pythonOptions: ["-u"],
    scriptPath: path.join(__dirname, "../ml"),
  });

  persistentPyShell.on("message", (message) => {
    try {
      const result = JSON.parse(message.trim());
      const resId = result.req_id;
      if (pendingRequests.has(resId)) {
        pendingRequests.get(resId).resolve(result.ML_PROB);
        pendingRequests.delete(resId);
      }
    } catch (e) {
      // Ignored: not JSON format or initial messages
    }
  });

  persistentPyShell.on("error", (err) => {
    console.error("PyShell error:", err);
  });
}

initPyShell();

function getMLQuality(body, upvotes, downvotes) {
  return new Promise((resolve, reject) => {
    if (!persistentPyShell) {
      initPyShell();
    }
    const currentReqId = String(reqIdCounter++);
    
    const timeout = setTimeout(() => {
      if (pendingRequests.has(currentReqId)) {
        pendingRequests.delete(currentReqId);
        resolve(0);
      }
    }, 15000);

    pendingRequests.set(currentReqId, {
      resolve: (val) => {
        clearTimeout(timeout);
        resolve(val);
      },
      reject
    });

    persistentPyShell.send(
      JSON.stringify({
        req_id: currentReqId,
        body,
        upvotes,
        downvotes,
      })
    );
  });
}

async function computeQualityScore(body, upvotes, downvotes) {
  const mlProb = await getMLQuality(body, upvotes, downvotes);
  return Math.round(mlProb * 100); // 0–100
}

/* ---------------------------------------------------------
   GET ALL POSTS
--------------------------------------------------------- */

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.username, u.avatar_url,
             (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------------------------------------------------
   CREATE POST
--------------------------------------------------------- */

// We'll use upload.single('image') to parse potentially multipart form-data
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { user_id, title, body } = req.body;

    if (!user_id || !body) {
      return res.status(400).json({ error: "Missing user_id or body" });
    }

    let image_url = null;
    if (req.file) {
      if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) {
        // Upload to IPFS via Pinata
        const formData = new FormData();
        formData.append("file", fs.createReadStream(req.file.path));

        const pinataMetadata = JSON.stringify({ name: req.file.filename });
        formData.append("pinataMetadata", pinataMetadata);

        const pinataOptions = JSON.stringify({ cidVersion: 1 });
        formData.append("pinataOptions", pinataOptions);

        try {
          const pinataRes = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
            headers: {
              ...formData.getHeaders(),
              pinata_api_key: process.env.PINATA_API_KEY,
              pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
            },
            maxBodyLength: "Infinity", // Necessary for large files
          });
          const ipfsHash = pinataRes.data.IpfsHash;
          // Use standard IPFS gateway format
          image_url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

          // Optionally delete the local file after uploading to IPFS
          fs.unlinkSync(req.file.path);
        } catch (ipfsErr) {
          console.error("Error uploading to Pinata IPFS:", ipfsErr.response ? ipfsErr.response.data : ipfsErr.message);
          // Fallback to local storage if IPFS fails
          const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
          image_url = `${backendUrl}/uploads/${req.file.filename}`;
        }
      } else {
        // Local upload fallback if Pinata keys aren't set
        const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
        image_url = `${backendUrl}/uploads/${req.file.filename}`;
      }
    }

    const [result] = await pool.query(
      "INSERT INTO posts (user_id, title, body, upvotes, downvotes, image_url) VALUES (?,?,?,?,?,?)",
      [user_id, title || null, body, 0, 0, image_url]
    );

    const postId = result.insertId;

    const score = await computeQualityScore(body, 0, 0);

    await pool.query(
      "UPDATE posts SET quality_score = ? WHERE id = ?",
      [score, postId]
    );

    // Check for badges after creating post
    const newlyAwardedBadges = await checkAndAwardBadges(user_id);

    res.json({
      ok: true,
      postId,
      quality_score: score,
      newlyAwardedBadges: newlyAwardedBadges.length > 0 ? newlyAwardedBadges : undefined,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------------------------------------------------
   UPVOTE (TOGGLE)
--------------------------------------------------------- */

router.post("/:id/upvote", async (req, res) => {
  try {
    const postId = req.params.id;
    const { user_id } = req.body;

    if (!user_id)
      return res.status(400).json({ error: "Missing user_id" });

    // If downvoted, remove the downvote first
    const [downvoted] = await pool.query(
      "SELECT id FROM post_downvotes WHERE post_id = ? AND user_id = ?",
      [postId, user_id]
    );
    if (downvoted.length > 0) {
      await pool.query(
        "DELETE FROM post_downvotes WHERE post_id = ? AND user_id = ?",
        [postId, user_id]
      );
      await pool.query(
        "UPDATE posts SET downvotes = downvotes - 1 WHERE id = ? AND downvotes > 0",
        [postId]
      );
    }

    const [existing] = await pool.query(
      "SELECT id FROM post_upvotes WHERE post_id = ? AND user_id = ?",
      [postId, user_id]
    );

    if (existing.length > 0) {
      await pool.query(
        "DELETE FROM post_upvotes WHERE post_id = ? AND user_id = ?",
        [postId, user_id]
      );
      await pool.query(
        "UPDATE posts SET upvotes = upvotes - 1 WHERE id = ? AND upvotes > 0",
        [postId]
      );
    } else {
      await pool.query(
        "INSERT INTO post_upvotes (post_id, user_id) VALUES (?,?)",
        [postId, user_id]
      );
      await pool.query(
        "UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?",
        [postId]
      );
    }

    const [[row]] = await pool.query(
      "SELECT body, upvotes, downvotes FROM posts WHERE id = ?",
      [postId]
    );

    const baseScore = await computeQualityScore(
      row.body,
      row.upvotes,
      row.downvotes
    );

    // Subtract already claimed score (1 token = 10 score points)
    let claimedScore = 0;
    try {
      const [[rewardStats]] = await pool.query(
        "SELECT COALESCE(SUM(tokens_awarded), 0) as total_tokens FROM rewards WHERE post_id = ?",
        [postId]
      );
      claimedScore = (rewardStats.total_tokens || 0) * 10;
    } catch (e) {}

    const newScore = Math.max(0, Math.round(baseScore - claimedScore));

    await pool.query(
      "UPDATE posts SET quality_score = ? WHERE id = ?",
      [newScore, postId]
    );

    // Check for badges if upvoted (not removed)
    let newlyAwardedBadges = [];
    if (existing.length === 0) {
      // Get post owner to check their badges
      const [[postOwner]] = await pool.query(
        "SELECT user_id FROM posts WHERE id = ?",
        [postId]
      );
      if (postOwner) {
        newlyAwardedBadges = await checkAndAwardBadges(postOwner.user_id);
      }
    }

    res.json({
      ok: true,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      quality_score: newScore,
      message: existing.length > 0 ? "removed" : "upvoted",
      newlyAwardedBadges: newlyAwardedBadges.length > 0 ? newlyAwardedBadges : undefined,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upvote toggle failed" });
  }
});

/* ---------------------------------------------------------
   DOWNVOTE (TOGGLE)
--------------------------------------------------------- */

router.post("/:id/downvote", async (req, res) => {
  try {
    const postId = req.params.id;
    const { user_id } = req.body;

    if (!user_id)
      return res.status(400).json({ error: "Missing user_id" });

    // If upvoted, remove the upvote first
    const [upvoted] = await pool.query(
      "SELECT id FROM post_upvotes WHERE post_id = ? AND user_id = ?",
      [postId, user_id]
    );
    if (upvoted.length > 0) {
      await pool.query(
        "DELETE FROM post_upvotes WHERE post_id = ? AND user_id = ?",
        [postId, user_id]
      );
      await pool.query(
        "UPDATE posts SET upvotes = upvotes - 1 WHERE id = ? AND upvotes > 0",
        [postId]
      );
    }

    const [existing] = await pool.query(
      "SELECT id FROM post_downvotes WHERE post_id = ? AND user_id = ?",
      [postId, user_id]
    );

    if (existing.length > 0) {
      await pool.query(
        "DELETE FROM post_downvotes WHERE post_id = ? AND user_id = ?",
        [postId, user_id]
      );
      await pool.query(
        "UPDATE posts SET downvotes = downvotes - 1 WHERE id = ? AND downvotes > 0",
        [postId]
      );
    } else {
      await pool.query(
        "INSERT INTO post_downvotes (post_id, user_id) VALUES (?,?)",
        [postId, user_id]
      );
      await pool.query(
        "UPDATE posts SET downvotes = downvotes + 1 WHERE id = ?",
        [postId]
      );
    }

    const [[row]] = await pool.query(
      "SELECT body, upvotes, downvotes FROM posts WHERE id = ?",
      [postId]
    );

    const baseScore = await computeQualityScore(
      row.body,
      row.upvotes,
      row.downvotes
    );

    // Subtract already claimed score (1 token = 10 score points)
    let claimedScore = 0;
    try {
      const [[rewardStats]] = await pool.query(
        "SELECT COALESCE(SUM(tokens_awarded), 0) as total_tokens FROM rewards WHERE post_id = ?",
        [postId]
      );
      claimedScore = (rewardStats.total_tokens || 0) * 10;
    } catch (e) {}

    const newScore = Math.max(0, Math.round(baseScore - claimedScore));

    await pool.query(
      "UPDATE posts SET quality_score = ? WHERE id = ?",
      [newScore, postId]
    );

    res.json({
      ok: true,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      quality_score: newScore,
      message: existing.length > 0 ? "downvote removed" : "downvoted",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Downvote toggle failed" });
  }
});

/* ---------------------------------------------------------
   CLAIM REWARD
--------------------------------------------------------- */

router.post("/:id/claim", async (req, res) => {
  try {
    const postId = req.params.id;
    const { user_id } = req.body;

    if (!user_id)
      return res.status(400).json({ error: "Missing user_id" });

    const [[post]] = await pool.query(
      "SELECT * FROM posts WHERE id = ?",
      [postId]
    );
    if (!post)
      return res.status(404).json({ error: "Post not found" });

    const [[user]] = await pool.query(
      "SELECT * FROM users WHERE id = ?",
      [user_id]
    );
    if (!user)
      return res.status(404).json({ error: "User not found" });

    if (!user.wallet_address) {
      return res
        .status(400)
        .json({ error: "User has no wallet_address set" });
    }

    const quality = post.quality_score || 0;
    const tokens = Number((quality * 0.1).toFixed(4));

    if (tokens <= 0 || quality <= 0) {
      return res
        .status(400)
        .json({ error: "Quality too low, no rewards to claim" });
    }

    let txHash = null;
    let blockchainError = null;

    // Try blockchain transaction (optional - can work without it)
    try {
      if (distributor && user.wallet_address) {
        const tx = await distributor.award(
          user.wallet_address,
          ethers.parseUnits(tokens.toString(), 18),
          Number(postId)
        );
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }
    } catch (blockchainErr) {
      console.error("Blockchain transaction failed:", blockchainErr);
      blockchainError = blockchainErr.message;
      // Continue with database operations even if blockchain fails
    }

    // Record the reward (with or without blockchain tx)
    await pool.query(
      "INSERT INTO rewards (user_id, post_id, tokens_awarded, tx_hash) VALUES (?,?,?,?)",
      [user_id, postId, tokens, txHash]
    );

    // Add tokens to user's vault
    // Check if total_rewards column exists, if not, skip this update
    try {
      await pool.query(
        "UPDATE users SET total_rewards = COALESCE(total_rewards, 0) + ? WHERE id = ?",
        [tokens, user_id]
      );
    } catch (dbErr) {
      // If column doesn't exist, log but continue
      console.warn("total_rewards column might not exist:", dbErr.message);
      // Try to add the column if it doesn't exist
      try {
        await pool.query("ALTER TABLE users ADD COLUMN total_rewards FLOAT DEFAULT 0");
        await pool.query(
          "UPDATE users SET total_rewards = ? WHERE id = ?",
          [tokens, user_id]
        );
      } catch (alterErr) {
        console.warn("Could not add total_rewards column:", alterErr.message);
      }
    }

    // Reset quality_score to 0 after claiming
    await pool.query(
      "UPDATE posts SET quality_score = 0 WHERE id = ?",
      [postId]
    );

    // Check for badges after claiming reward
    const newlyAwardedBadges = await checkAndAwardBadges(user_id);

    res.json({
      ok: true,
      txHash: txHash,
      tokens_awarded: tokens,
      quality_score: 0, // Return reset score
      blockchainError: blockchainError || undefined, // Include if blockchain failed
      newlyAwardedBadges: newlyAwardedBadges.length > 0 ? newlyAwardedBadges : undefined,
    });
  } catch (err) {
    console.error("Claim error:", err);
    res.status(500).json({
      error: "Claim failed",
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/* ---------------------------------------------------------
   DELETE POST
--------------------------------------------------------- */

router.delete("/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    // Verify post exists and belongs to user
    const [[post]] = await pool.query("SELECT * FROM posts WHERE id = ?", [postId]);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.user_id !== parseInt(user_id)) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    // Delete related records first to avoid foreign key constraints (if any)
    await pool.query("DELETE FROM post_upvotes WHERE post_id = ?", [postId]);
    await pool.query("DELETE FROM post_downvotes WHERE post_id = ?", [postId]);
    // The rewards table might also have a foreign key to the post
    await pool.query("DELETE FROM rewards WHERE post_id = ?", [postId]);

    // Delete the post
    await pool.query("DELETE FROM posts WHERE id = ?", [postId]);

    res.json({ ok: true, message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Server error during post deletion" });
  }
});

/* ---------------------------------------------------------
   COMMENTS
--------------------------------------------------------- */

// GET /api/posts/:id/comments
router.get("/:id/comments", async (req, res) => {
  try {
    const postId = req.params.id;
    const [comments] = await pool.query(
      `SELECT c.*, u.username, u.avatar_url 
       FROM post_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /api/posts/:id/comments
router.post("/:id/comments", async (req, res) => {
  try {
    const postId = req.params.id;
    const { user_id, content } = req.body;

    if (!user_id || !content) {
      return res.status(400).json({ error: "Missing user_id or content" });
    }

    await pool.query(
      "INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)",
      [postId, user_id, content]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

module.exports = router;
