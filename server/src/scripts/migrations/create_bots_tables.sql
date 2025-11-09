-- Migration: Create Bot System Tables
-- Description: Tables for bot blueprints, instances, seat management, and audit logs
-- Created: 2025-11-09

-- 1. Bot Blueprints (templates/profiles for bots)
CREATE TABLE IF NOT EXISTS bot_blueprints (
    bot_blueprint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name_template VARCHAR(255) NOT NULL, -- e.g., "{{first}} {{last}}" or "Bot_{{random}}"
    avatar_url VARCHAR(512),
    behavior_profile JSONB NOT NULL DEFAULT '{
        "aggressiveness": 50,
        "risk_tolerance": 50,
        "reaction_delay_ms": 2000,
        "error_rate": 5,
        "skill_level": 50
    }',
    default_level INTEGER DEFAULT 50 CHECK (default_level >= 0 AND default_level <= 100),
    persistent BOOLEAN DEFAULT false, -- if true, keeps same identity across sessions
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_bot_blueprints_created_by ON bot_blueprints(created_by);
CREATE INDEX idx_bot_blueprints_is_active ON bot_blueprints(is_active);

-- 2. Bot Instances (runtime instances of bots)
CREATE TABLE IF NOT EXISTS bot_instances (
    bot_instance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_blueprint_id UUID REFERENCES bot_blueprints(bot_blueprint_id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL, -- resolved final name
    bot_id VARCHAR(100) NOT NULL UNIQUE, -- unique identifier like "RS-8732" or "pt_4f9a"
    avatar_url VARCHAR(512),
    session_id VARCHAR(255), -- game session this bot is in
    assigned_table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
    assigned_seat_index INTEGER CHECK (assigned_seat_index >= 0 AND assigned_seat_index < 6),
    balance_coins DECIMAL(15, 2) DEFAULT 10000, -- bot's coin balance
    balance_cash DECIMAL(15, 2) DEFAULT 0, -- bot's cash balance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- null = persistent, set value = ephemeral
    randomized BOOLEAN DEFAULT false, -- true if identity was randomized
    created_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_action_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_bot_instances_blueprint ON bot_instances(bot_blueprint_id);
CREATE INDEX idx_bot_instances_table ON bot_instances(assigned_table_id);
CREATE INDEX idx_bot_instances_session ON bot_instances(session_id);
CREATE INDEX idx_bot_instances_expires_at ON bot_instances(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_bot_instances_is_active ON bot_instances(is_active);
CREATE UNIQUE INDEX idx_bot_instances_bot_id ON bot_instances(bot_id);

-- 3. Table Seats (manages seat assignments)
CREATE TABLE IF NOT EXISTS table_seats (
    seat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    seat_index INTEGER NOT NULL CHECK (seat_index >= 0 AND seat_index < 6),
    occupant_type VARCHAR(20) NOT NULL DEFAULT 'empty' CHECK (occupant_type IN ('empty', 'human', 'bot')),
    occupant_id VARCHAR(255), -- user_id for human, bot_instance_id for bot
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    version INTEGER DEFAULT 1, -- for optimistic locking
    UNIQUE(table_id, seat_index)
);

CREATE INDEX idx_table_seats_table ON table_seats(table_id);
CREATE INDEX idx_table_seats_occupant ON table_seats(occupant_id);
CREATE INDEX idx_table_seats_type ON table_seats(occupant_type);

-- 4. Admin Audit Logs (track all bot-related admin actions)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- 'assign_bot', 'remove_bot', 'edit_bot', 'rotate_identity', 'force_remove_human'
    table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
    seat_index INTEGER,
    bot_blueprint_id UUID REFERENCES bot_blueprints(bot_blueprint_id) ON DELETE SET NULL,
    bot_instance_id UUID REFERENCES bot_instances(bot_instance_id) ON DELETE SET NULL,
    old_state JSONB, -- previous state before action
    new_state JSONB, -- new state after action
    reason TEXT, -- optional reason provided by admin
    details JSONB, -- additional metadata
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_logs_table ON admin_audit_logs(table_id);
CREATE INDEX idx_audit_logs_timestamp ON admin_audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_bot_instance ON admin_audit_logs(bot_instance_id);

-- 5. Bot Analytics (track bot performance metrics)
CREATE TABLE IF NOT EXISTS bot_analytics (
    analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_instance_id UUID NOT NULL REFERENCES bot_instances(bot_instance_id) ON DELETE CASCADE,
    table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    action_type VARCHAR(50), -- 'bet', 'fold', 'raise', 'check', 'show'
    action_amount DECIMAL(15, 2),
    hand_rank VARCHAR(50),
    won BOOLEAN,
    pot_contribution DECIMAL(15, 2),
    pot_won DECIMAL(15, 2),
    hand_duration_seconds INTEGER,
    decision_time_ms INTEGER, -- how long bot took to decide
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bot_analytics_instance ON bot_analytics(bot_instance_id);
CREATE INDEX idx_bot_analytics_table ON bot_analytics(table_id);
CREATE INDEX idx_bot_analytics_session ON bot_analytics(session_id);
CREATE INDEX idx_bot_analytics_timestamp ON bot_analytics(timestamp DESC);

-- 6. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bot_blueprints_updated_at BEFORE UPDATE ON bot_blueprints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_seats_updated_at BEFORE UPDATE ON table_seats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Insert default bot blueprints
INSERT INTO bot_blueprints (display_name_template, behavior_profile, default_level, persistent) VALUES
    ('{{first}} {{last}}', '{"aggressiveness": 30, "risk_tolerance": 40, "reaction_delay_ms": 2500, "error_rate": 8, "skill_level": 40}', 40, false), -- Conservative
    ('{{first}} {{last}}', '{"aggressiveness": 70, "risk_tolerance": 65, "reaction_delay_ms": 1500, "error_rate": 5, "skill_level": 60}', 60, false), -- Aggressive
    ('{{first}} {{last}}', '{"aggressiveness": 50, "risk_tolerance": 50, "reaction_delay_ms": 2000, "error_rate": 7, "skill_level": 50}', 50, false), -- Balanced
    ('{{first}} {{last}}', '{"aggressiveness": 40, "risk_tolerance": 30, "reaction_delay_ms": 3000, "error_rate": 15, "skill_level": 25}', 25, false); -- Beginner

-- 8. Comments for documentation
COMMENT ON TABLE bot_blueprints IS 'Bot templates/profiles defining behavior and appearance';
COMMENT ON TABLE bot_instances IS 'Runtime instances of bots assigned to tables';
COMMENT ON TABLE table_seats IS 'Seat assignments for tables (human or bot)';
COMMENT ON TABLE admin_audit_logs IS 'Audit trail of all admin actions on bots';
COMMENT ON TABLE bot_analytics IS 'Performance metrics and statistics for bots';

COMMENT ON COLUMN bot_instances.expires_at IS 'NULL for persistent bots, timestamp for ephemeral bots';
COMMENT ON COLUMN table_seats.version IS 'Optimistic locking version for concurrent updates';
COMMENT ON COLUMN bot_blueprints.behavior_profile IS 'JSON with aggressiveness, risk_tolerance, reaction_delay_ms, error_rate, skill_level';
