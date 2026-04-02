const pool = require('./db');

/**
 * Check and award badges for a user based on their stats
 */
async function checkAndAwardBadges(userId) {
  try {
    // Get user statistics safely
    const [[user]] = await pool.query(
      'SELECT id, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) return [];

    // Get total upvotes (sum of all post upvotes)
    const [[upvoteStats]] = await pool.query(
      'SELECT COALESCE(SUM(upvotes), 0) AS total_upvotes FROM posts WHERE user_id = ?',
      [userId]
    );
    const totalUpvotes = upvoteStats?.total_upvotes || 0;

    // Get post count
    const [[postStats]] = await pool.query(
      'SELECT COUNT(*) AS post_count FROM posts WHERE user_id = ?',
      [userId]
    );
    const postCount = postStats?.post_count || 0;

    // Get reward count safely
    let rewardCount = 0;
    let totalTokens = 0;
    try {
      const [[rewardStats]] = await pool.query(
        'SELECT COUNT(*) AS reward_count, COALESCE(SUM(tokens_awarded), 0) AS total_tokens FROM rewards WHERE user_id = ?',
        [userId]
      );
      rewardCount = rewardStats?.reward_count || 0;
      totalTokens = rewardStats?.total_tokens || 0;
    } catch (e) {
      // rewards table might not exist yet
    }

    // Get max quality score
    const [[qualityStats]] = await pool.query(
      'SELECT COALESCE(MAX(quality_score), 0) AS max_quality FROM posts WHERE user_id = ?',
      [userId]
    );
    const maxQuality = qualityStats?.max_quality || 0;

    // Get days since joined
    const daysSinceJoined = Math.floor(
      (new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)
    );

    // Get user's current badges
    const [userBadges] = await pool.query(
      'SELECT badge_id FROM user_badges WHERE user_id = ?',
      [userId]
    );
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

    // Get all badges
    const [allBadges] = await pool.query('SELECT * FROM badges ORDER BY requirement_value ASC');

    const newlyAwarded = [];

    for (const badge of allBadges) {
      // Skip if already earned
      if (earnedBadgeIds.has(badge.id)) continue;

      let shouldAward = false;

      switch (badge.category) {
        case 'upvotes':
          shouldAward = totalUpvotes >= badge.requirement_value;
          break;
        case 'posts':
          shouldAward = postCount >= badge.requirement_value;
          break;
        case 'rewards':
          shouldAward = rewardCount >= badge.requirement_value;
          break;
        case 'tokens':
          shouldAward = totalTokens >= badge.requirement_value;
          break;
        case 'quality':
          shouldAward = maxQuality >= badge.requirement_value;
          break;
        case 'special':
          if (badge.badge_key === 'veteran') {
            shouldAward = daysSinceJoined >= badge.requirement_value;
          } else if (badge.badge_key === 'early_adopter') {
            // Check if user is in first 100 users
            const [[userRank]] = await pool.query(
              'SELECT COUNT(*) AS user_rank FROM users WHERE id <= ?',
              [userId]
            );
            shouldAward = (userRank?.user_rank || 0) <= badge.requirement_value;
          }
          break;
      }

      if (shouldAward) {
        // Award the badge
        await pool.query(
          'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
          [userId, badge.id]
        );
        newlyAwarded.push(badge);
      }
    }

    return newlyAwarded;
  } catch (err) {
    console.error('Error checking badges:', err);
    return [];
  }
}

/**
 * Get all badges for a user
 */
async function getUserBadges(userId) {
  try {
    const [badges] = await pool.query(
      `SELECT b.*, ub.earned_at 
       FROM badges b
       INNER JOIN user_badges ub ON b.id = ub.badge_id
       WHERE ub.user_id = ?
       ORDER BY b.tier, b.requirement_value DESC`,
      [userId]
    );
    return badges;
  } catch (err) {
    console.error('Error getting user badges:', err);
    return [];
  }
}

/**
 * Get all available badges (for display)
 */
async function getAllBadges() {
  try {
    const [badges] = await pool.query(
      'SELECT * FROM badges ORDER BY category, requirement_value ASC'
    );
    return badges;
  } catch (err) {
    console.error('Error getting all badges:', err);
    return [];
  }
}

module.exports = {
  checkAndAwardBadges,
  getUserBadges,
  getAllBadges
};
