-- ============================================
-- MIGRATION: Add Special Event Columns
-- Run this in Supabase SQL Editor
-- ============================================

-- Add is_special flag (default false = event biasa)
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT false;

-- Add theme name for special events
ALTER TABLE events ADD COLUMN IF NOT EXISTS theme_name VARCHAR(100);

-- Add theme color (hex format like #FF6B9D)
ALTER TABLE events ADD COLUMN IF NOT EXISTS theme_color VARCHAR(20);

-- Create index for filtering special events
CREATE INDEX IF NOT EXISTS idx_events_is_special ON events(is_special);
