-- Migration: Add badge system tables
-- Run this if you already have a database with existing data

USE bosm_project;

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  badge_key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  requirement_value INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  badge_id INT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_badge (user_id, badge_id)
);

-- Insert badge definitions (only if they don't exist)
INSERT IGNORE INTO badges (badge_key, name, description, icon, category, tier, requirement_value) VALUES
('upvote_10', 'Bronze Upvoter', 'Received 10 upvotes', '🥉', 'upvotes', 'bronze', 10),
('upvote_50', 'Silver Upvoter', 'Received 50 upvotes', '🥈', 'upvotes', 'silver', 50),
('upvote_100', 'Gold Upvoter', 'Received 100 upvotes', '🥇', 'upvotes', 'gold', 100),
('upvote_250', 'Platinum Upvoter', 'Received 250 upvotes', '💎', 'upvotes', 'platinum', 250),
('upvote_500', 'Diamond Upvoter', 'Received 500 upvotes', '💠', 'upvotes', 'diamond', 500),
('upvote_1000', 'Legendary Upvoter', 'Received 1000 upvotes', '👑', 'upvotes', 'legendary', 1000),
('posts_5', 'Bronze Contributor', 'Created 5 posts', '📝', 'posts', 'bronze', 5),
('posts_25', 'Silver Contributor', 'Created 25 posts', '📚', 'posts', 'silver', 25),
('posts_50', 'Gold Contributor', 'Created 50 posts', '📖', 'posts', 'gold', 50),
('posts_100', 'Platinum Contributor', 'Created 100 posts', '📜', 'posts', 'platinum', 100),
('posts_250', 'Diamond Contributor', 'Created 250 posts', '📗', 'posts', 'diamond', 250),
('rewards_1', 'First Reward', 'Claimed your first reward', '🎁', 'rewards', 'bronze', 1),
('rewards_10', 'Silver Earner', 'Claimed 10 rewards', '💰', 'rewards', 'silver', 10),
('rewards_25', 'Gold Earner', 'Claimed 25 rewards', '💵', 'rewards', 'gold', 25),
('rewards_50', 'Platinum Earner', 'Claimed 50 rewards', '💸', 'rewards', 'platinum', 50),
('rewards_100', 'Diamond Earner', 'Claimed 100 rewards', '💴', 'rewards', 'diamond', 100),
('tokens_10', 'Bronze Collector', 'Earned 10 tokens', '🪙', 'tokens', 'bronze', 10),
('tokens_50', 'Silver Collector', 'Earned 50 tokens', '🪙', 'tokens', 'silver', 50),
('tokens_100', 'Gold Collector', 'Earned 100 tokens', '🪙', 'tokens', 'gold', 100),
('tokens_250', 'Platinum Collector', 'Earned 250 tokens', '🪙', 'tokens', 'platinum', 250),
('tokens_500', 'Diamond Collector', 'Earned 500 tokens', '🪙', 'tokens', 'diamond', 500),
('quality_80', 'Quality Writer', 'Achieved 80+ quality score', '⭐', 'quality', 'silver', 80),
('quality_90', 'Master Writer', 'Achieved 90+ quality score', '🌟', 'quality', 'gold', 90),
('quality_95', 'Elite Writer', 'Achieved 95+ quality score', '✨', 'quality', 'platinum', 95),
('veteran', 'Veteran', 'Member for 30+ days', '🎖️', 'special', 'gold', 30),
('early_adopter', 'Early Adopter', 'One of the first 100 users', '🚀', 'special', 'platinum', 100);
