const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/users/:id/downvotes
router.get("/:id/downvotes", async (req, res) => {
  try {
    const userId = req.params.id;

    const [rows] = await pool.query(
      "SELECT post_id FROM post_downvotes WHERE user_id = ?",
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch downvotes" });
  }
});

module.exports = router;
