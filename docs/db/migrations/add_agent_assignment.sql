-- Migration: Add agent assignment functionality
-- This migration ensures agent_id exists and adds indexes for performance

-- Ensure agent_id column exists in applications table (should already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' AND column_name = 'agent_id'
    ) THEN
        ALTER TABLE applications ADD COLUMN agent_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_agent_id ON applications(agent_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_agent_status ON applications(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_customer_id ON applications(customer_id);

-- Comment
COMMENT ON COLUMN applications.agent_id IS 'Agent who took this application into work';
