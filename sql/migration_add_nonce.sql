-- Add nonce column to users table
ALTER TABLE users ADD COLUMN nonce VARCHAR(255) DEFAULT NULL;
