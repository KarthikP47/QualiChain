-- Migration: Add total_rewards vault column to users table
-- Run this if you already have a database with existing data

USE bosm_project;

-- Add total_rewards column to users table
-- Note: If column already exists, you'll get an error - that's fine
ALTER TABLE users 
ADD COLUMN total_rewards FLOAT DEFAULT 0;

-- Initialize existing users' total_rewards from their rewards history
UPDATE users u
SET total_rewards = (
  SELECT COALESCE(SUM(tokens_awarded), 0)
  FROM rewards r
  WHERE r.user_id = u.id
);
