-- Migration: Add Notifications and Social Features
-- Date: December 2024
-- Description: Add notifications, push subscriptions, and social sharing features

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_push_subscriptions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_endpoint
        UNIQUE (user_id, endpoint)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Add social sharing tracking to memories table
ALTER TABLE memories ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS last_shared_at TIMESTAMP;

-- Add social sharing tracking to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_shared_at TIMESTAMP;

-- Create social_shares table for tracking sharing activity
CREATE TABLE IF NOT EXISTS social_shares (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    content_type VARCHAR(50) NOT NULL, -- 'memory', 'event', 'page'
    content_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL, -- 'facebook', 'twitter', 'whatsapp', etc.
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_social_shares_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for social shares
CREATE INDEX IF NOT EXISTS idx_social_shares_user_id ON social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_content ON social_shares(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_platform ON social_shares(platform);
CREATE INDEX IF NOT EXISTS idx_social_shares_shared_at ON social_shares(shared_at);

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Table for storing user notifications';
COMMENT ON COLUMN notifications.type IS 'Notification type: info, success, warning, error';
COMMENT ON COLUMN notifications.category IS 'Notification category: memory, subscription, system, social';
COMMENT ON COLUMN notifications.data IS 'Additional data for the notification';

COMMENT ON TABLE push_subscriptions IS 'Table for storing push notification subscriptions';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'P-256 DH public key';
COMMENT ON COLUMN push_subscriptions.auth IS 'Authentication secret';

COMMENT ON TABLE social_shares IS 'Table for tracking social media sharing activity';
COMMENT ON COLUMN social_shares.content_type IS 'Type of content being shared';
COMMENT ON COLUMN social_shares.content_id IS 'ID of the content being shared';
COMMENT ON COLUMN social_shares.platform IS 'Social platform where content was shared';

COMMENT ON COLUMN memories.share_count IS 'Number of times this memory has been shared';
COMMENT ON COLUMN memories.last_shared_at IS 'Last time this memory was shared';

COMMENT ON COLUMN events.share_count IS 'Number of times this event has been shared';
COMMENT ON COLUMN events.last_shared_at IS 'Last time this event was shared';
