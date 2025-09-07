-- prisma/migrations/add_gamification_tables.sql
-- Migration: Add Gamification Tables
-- Date: December 2024
-- Description: Add gamification system tables for points, badges, missions, and API keys

-- Create user_points table
CREATE TABLE IF NOT EXISTS user_points (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_points_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_points
        UNIQUE (user_id)
);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255) NOT NULL,
    color VARCHAR(50) NOT NULL,
    points_required INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    badge_id VARCHAR(255) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_featured BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT fk_user_badges_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_badges_badge
        FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_badge
        UNIQUE (user_id, badge_id)
);

-- Create missions table
CREATE TABLE IF NOT EXISTS missions (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- daily, weekly, monthly, special
    target INTEGER NOT NULL,
    points_reward INTEGER NOT NULL,
    badge_reward VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_missions_badge_reward
        FOREIGN KEY (badge_reward) REFERENCES badges(id) ON DELETE SET NULL
);

-- Create user_missions table
CREATE TABLE IF NOT EXISTS user_missions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    mission_id VARCHAR(255) NOT NULL,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_missions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_missions_mission
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_mission
        UNIQUE (user_id, mission_id)
);

-- Create point_transactions table
CREATE TABLE IF NOT EXISTS point_transactions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    points INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- earned, spent, bonus, penalty
    activity VARCHAR(100) NOT NULL, -- create_memory, comment, share, etc.
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_point_transactions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    permissions JSONB NOT NULL,
    rate_limit INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_api_keys_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    events JSONB NOT NULL,
    secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_webhooks_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_level ON user_points(level);
CREATE INDEX IF NOT EXISTS idx_user_points_points ON user_points(points);

CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_points_required ON badges(points_required);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at);

CREATE INDEX IF NOT EXISTS idx_missions_type ON missions(type);
CREATE INDEX IF NOT EXISTS idx_missions_is_active ON missions(is_active);

CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_mission_id ON user_missions(mission_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_completed ON user_missions(completed);
CREATE INDEX IF NOT EXISTS idx_user_missions_started_at ON user_missions(started_at);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_activity ON point_transactions(activity);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);

-- Insert default badges
INSERT INTO badges (id, name, description, icon, color, points_required, category) VALUES
('badge_first_memory', 'Primera Memoria', 'Crea tu primera memoria', '🎯', '#3B82F6', 0, 'memory'),
('badge_sharer', 'Compartidor Activo', 'Comparte 10 memorias', '📤', '#10B981', 30, 'social'),
('badge_commenter', 'Comentarista', 'Haz 50 comentarios', '💬', '#F59E0B', 250, 'social'),
('badge_photographer', 'Fotógrafo', 'Sube 20 fotos', '📸', '#8B5CF6', 300, 'memory'),
('badge_influencer', 'Influencer', 'Recibe 100 likes', '⭐', '#EF4444', 200, 'social'),
('badge_collaborator', 'Colaborador', 'Invita 5 amigos', '🤝', '#06B6D4', 125, 'social'),
('badge_memorious', 'Memorioso', 'Crea 100 memorias', '🏆', '#F97316', 1000, 'memory'),
('badge_novice', 'Novato', 'Alcanza 100 puntos', '🥉', '#6B7280', 100, 'achievement'),
('badge_apprentice', 'Aprendiz', 'Alcanza 500 puntos', '🥈', '#059669', 500, 'achievement'),
('badge_expert', 'Experto', 'Alcanza 1000 puntos', '🥇', '#DC2626', 1000, 'achievement'),
('badge_master', 'Maestro', 'Alcanza 2500 puntos', '👑', '#7C3AED', 2500, 'achievement'),
('badge_legend', 'Leyenda', 'Alcanza 5000 puntos', '🌟', '#F59E0B', 5000, 'achievement');

-- Insert default missions
INSERT INTO missions (id, name, description, type, target, points_reward, badge_reward) VALUES
('mission_daily_login', 'Login Diario', 'Inicia sesión 7 días seguidos', 'daily', 7, 50, NULL),
('mission_weekly_memories', 'Memorias Semanales', 'Crea 5 memorias esta semana', 'weekly', 5, 100, NULL),
('mission_monthly_shares', 'Compartidor Mensual', 'Comparte 20 memorias este mes', 'monthly', 20, 200, 'badge_sharer'),
('mission_first_memory', 'Primera Memoria', 'Crea tu primera memoria', 'special', 1, 50, 'badge_first_memory'),
('mission_comment_streak', 'Racha de Comentarios', 'Comenta en 10 memorias diferentes', 'weekly', 10, 75, NULL),
('mission_photo_upload', 'Fotógrafo en Desarrollo', 'Sube 5 fotos esta semana', 'weekly', 5, 75, NULL),
('mission_social_butterfly', 'Mariposa Social', 'Recibe likes en 10 memorias diferentes', 'monthly', 10, 150, NULL),
('mission_memory_milestone', 'Hito de Memorias', 'Crea 25 memorias', 'special', 25, 250, NULL);

-- Add comments for documentation
COMMENT ON TABLE user_points IS 'Table for storing user points and level information';
COMMENT ON COLUMN user_points.points IS 'Current points balance';
COMMENT ON COLUMN user_points.level IS 'Current user level';
COMMENT ON COLUMN user_points.experience IS 'Total experience points earned';
COMMENT ON COLUMN user_points.total_points_earned IS 'Total points earned throughout user history';

COMMENT ON TABLE badges IS 'Table for storing available badges';
COMMENT ON COLUMN badges.category IS 'Badge category: memory, social, achievement, special';
COMMENT ON COLUMN badges.points_required IS 'Minimum points required to earn this badge';
COMMENT ON COLUMN badges.is_hidden IS 'Whether this badge is hidden from users';

COMMENT ON TABLE user_badges IS 'Table for storing user badge achievements';
COMMENT ON COLUMN user_badges.is_featured IS 'Whether this badge is featured on user profile';

COMMENT ON TABLE missions IS 'Table for storing available missions';
COMMENT ON COLUMN missions.type IS 'Mission type: daily, weekly, monthly, special';
COMMENT ON COLUMN missions.target IS 'Target number to complete the mission';
COMMENT ON COLUMN missions.badge_reward IS 'Badge ID that is awarded upon completion';

COMMENT ON TABLE user_missions IS 'Table for storing user mission progress';
COMMENT ON COLUMN user_missions.progress IS 'Current progress percentage (0-100)';
COMMENT ON COLUMN user_missions.completed IS 'Whether the mission has been completed';

COMMENT ON TABLE point_transactions IS 'Table for tracking all point transactions';
COMMENT ON COLUMN point_transactions.type IS 'Transaction type: earned, spent, bonus, penalty';
COMMENT ON COLUMN point_transactions.activity IS 'Activity that triggered the transaction';

COMMENT ON TABLE api_keys IS 'Table for storing API keys for public API access';
COMMENT ON COLUMN api_keys.permissions IS 'JSON array of allowed endpoints';
COMMENT ON COLUMN api_keys.rate_limit IS 'Requests per hour limit';
COMMENT ON COLUMN api_keys.key_hash IS 'Hashed API key for security';

COMMENT ON TABLE webhooks IS 'Table for storing webhook configurations';
COMMENT ON COLUMN webhooks.events IS 'JSON array of event types to listen for';
COMMENT ON COLUMN webhooks.secret IS 'Secret for webhook signature verification';
