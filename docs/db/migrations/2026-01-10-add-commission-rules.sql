-- Migration: Add commission rules table
-- Date: 2026-01-10
-- Description: Create table for storing commission calculation rules by role

-- Commission rules table
CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL UNIQUE CHECK (role IN ('agent', 'commercial')),
  base_rate NUMERIC(5,2) NOT NULL CHECK (base_rate >= 0 AND base_rate <= 100),
  revenue_multiplier NUMERIC(6,5) NOT NULL DEFAULT 0.01,
  tier_1_threshold INT NOT NULL DEFAULT 0,
  tier_1_bonus NUMERIC(5,2) NOT NULL DEFAULT 0,
  tier_2_threshold INT NOT NULL DEFAULT 0,
  tier_2_bonus NUMERIC(5,2) NOT NULL DEFAULT 0,
  tier_3_threshold INT NOT NULL DEFAULT 0,
  tier_3_bonus NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default rules for agents and commercial department
INSERT INTO commission_rules (role, base_rate, revenue_multiplier, tier_1_threshold, tier_1_bonus, tier_2_threshold, tier_2_bonus, tier_3_threshold, tier_3_bonus)
VALUES 
  ('agent', 5.0, 0.02, 10, 1.0, 20, 2.0, 30, 3.0),
  ('commercial', 3.0, 0.015, 15, 0.5, 30, 1.5, 50, 2.5)
ON CONFLICT (role) DO NOTHING;

-- Add index
CREATE INDEX IF NOT EXISTS idx_commission_rules_role ON commission_rules(role);

-- Add comment
COMMENT ON TABLE commission_rules IS 'Commission calculation rules with tier-based bonuses by role';
