-- Migration: Add chat tables
USE bosm_project;

CREATE TABLE IF NOT EXISTS chat_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id_uint256 BIGINT NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  creator_wallet VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_id (room_id_uint256)
);

CREATE TABLE IF NOT EXISTS chat_room_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id_uint256 BIGINT NOT NULL,
  user_id INT NOT NULL,
  wallet_address VARCHAR(100) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_room_member (room_id_uint256, user_id),
  INDEX idx_room_id (room_id_uint256),
  INDEX idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id_uint256 BIGINT NOT NULL,
  user_id INT NOT NULL,
  wallet_address VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_room_id (room_id_uint256),
  INDEX idx_created_at (created_at)
);
