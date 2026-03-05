const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getAllBadges, getUserBadges } = require('../badges');
const { getBadgeImageUrl } = require('../badgeImages');

// GET /api/badges - Get all available badges
router.get('/', async (req, res) => {
  try {
    const badges = await getAllBadges();
    // Add image URLs to badges
    const badgesWithImages = badges.map(badge => ({
      ...badge,
      imageUrl: getBadgeImageUrl(badge)
    }));
    res.json(badgesWithImages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// GET /api/badges/:userId/status - Get all badges with earned status for a user
router.get('/:userId/status', async (req, res) => {
  try {
    const userId = req.params.userId;
    const allBadges = await getAllBadges();
    const userBadges = await getUserBadges(userId);
    const earnedBadgeIds = new Set(userBadges.map(b => b.id));

    // Add earned status and image URL to each badge
    const badgesWithStatus = allBadges.map(badge => ({
      ...badge,
      earned: earnedBadgeIds.has(badge.id),
      earned_at: userBadges.find(ub => ub.id === badge.id)?.earned_at || null,
      imageUrl: getBadgeImageUrl(badge)
    }));

    // Group by category after sorting
    badgesWithStatus.sort((a, b) => {
      if (a.earned && !b.earned) return -1;
      if (!a.earned && b.earned) return 1;
      return a.requirement_value - b.requirement_value;
    });

    const grouped = badgesWithStatus.reduce((acc, badge) => {
      if (!acc[badge.category]) {
        acc[badge.category] = [];
      }
      acc[badge.category].push(badge);
      return acc;
    }, {});

    res.json({
      badges: badgesWithStatus,
      grouped,
      stats: {
        total: allBadges.length,
        earned: userBadges.length,
        remaining: allBadges.length - userBadges.length
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch badge status' });
  }
});

module.exports = router;
