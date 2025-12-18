const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/:id/upvotes", async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await pool.query(
      "SELECT post_id FROM post_upvotes WHERE user_id = ?",
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch upvotes failed" });
  }
});

module.exports = router;
