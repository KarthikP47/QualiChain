-- Migration: Add missing vote tables and downvotes column
-- Run this if you already have a database with existing data
-- If you get errors about tables/columns already existing, that's okay - just ignore them

USE bosm_project;

-- Add downvotes column to posts table
-- Note: If column already exists, you'll get an error - that's fine
ALTER TABLE posts 
ADD COLUMN downvotes INT DEFAULT 0;

-- Create post_upvotes table
CREATE TABLE post_upvotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_upvote (post_id, user_id)
);

-- Create post_downvotes table
CREATE TABLE post_downvotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_downvote (post_id, user_id)
);
