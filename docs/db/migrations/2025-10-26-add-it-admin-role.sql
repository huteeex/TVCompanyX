-- Migration: Add IT admin functionality
-- Date: 2025-10-26
-- Description: Add tables for error logs, active sessions tracking, and IT admin role

BEGIN;

-- 1. Add IT admin role to user_role enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('customer', 'agent', 'commercial', 'director', 'accountant', 'company', 'it_admin');
    ELSE
        -- Add it_admin to existing enum
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'it_admin';
    END IF;
END $$;

-- 2. Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  error_type VARCHAR(100) NOT NULL, -- 'client_error', 'server_error', 'api_error', 'database_error'
  error_message TEXT NOT NULL,
  error_stack TEXT,
  url VARCHAR(500),
  method VARCHAR(10), -- GET, POST, PUT, DELETE
  status_code INTEGER,
  user_agent TEXT,
  ip_address VARCHAR(50),
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create active_sessions table
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- 4. Create admin_activity_log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL, -- 'user_created', 'user_updated', 'user_deleted', 'error_resolved'
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);

CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_last_activity ON active_sessions(last_activity DESC);
CREATE INDEX idx_active_sessions_expires_at ON active_sessions(expires_at);

CREATE INDEX idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX idx_admin_activity_log_target_user_id ON admin_activity_log(target_user_id);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM active_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update last activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_activity
CREATE TRIGGER trigger_update_session_activity
  BEFORE UPDATE ON active_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

COMMIT;

-- Verification queries
SELECT 'error_logs' as table_name, COUNT(*) as count FROM error_logs
UNION ALL
SELECT 'active_sessions', COUNT(*) FROM active_sessions
UNION ALL
SELECT 'admin_activity_log', COUNT(*) FROM admin_activity_log;
