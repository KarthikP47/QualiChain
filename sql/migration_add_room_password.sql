-- Migration: Add password to chat_rooms
USE bosm_project;

ALTER TABLE chat_rooms ADD COLUMN password VARCHAR(255) DEFAULT '';
