-- Add status field to users table for presence tracking
ALTER TABLE users
ADD COLUMN status TEXT CHECK (status IN ('online', 'away', 'busy', 'offline')) DEFAULT 'offline'; 