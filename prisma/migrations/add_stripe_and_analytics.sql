-- Migration: Add Stripe and Analytics support
-- Date: December 2024
-- Description: Add subscription fields to users, file_size to memories, and analytics_events table

-- Add subscription fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'FREE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_payment_failed TIMESTAMP;

-- Add file_size to memories table
ALTER TABLE memories ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id VARCHAR(255) PRIMARY KEY,
    event VARCHAR(255) NOT NULL,
    properties JSONB,
    user_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    user_agent TEXT,
    page_url TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Add constraints for subscription_plan
ALTER TABLE users ADD CONSTRAINT check_subscription_plan 
    CHECK (subscription_plan IN ('FREE', 'BASIC', 'PRO', 'ENTERPRISE'));

-- Add constraints for subscription_status
ALTER TABLE users ADD CONSTRAINT check_subscription_status 
    CHECK (subscription_status IN ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'TRIAL'));

-- Update existing users to have FREE plan if not set
UPDATE users SET subscription_plan = 'FREE' WHERE subscription_plan IS NULL;
UPDATE users SET subscription_status = 'ACTIVE' WHERE subscription_status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN users.subscription_plan IS 'User subscription plan (FREE, BASIC, PRO, ENTERPRISE)';
COMMENT ON COLUMN users.subscription_status IS 'Subscription status (ACTIVE, CANCELED, PAST_DUE, UNPAID, TRIAL)';
COMMENT ON COLUMN users.subscription_end_date IS 'Date when subscription ends';
COMMENT ON COLUMN users.last_payment_date IS 'Date of last successful payment';
COMMENT ON COLUMN users.last_payment_failed IS 'Date of last failed payment';
COMMENT ON COLUMN memories.file_size IS 'File size in bytes for storage tracking';
COMMENT ON TABLE analytics_events IS 'Table for tracking user analytics events';
