-- Migration to support Viral Director Framework

-- 1. Add strategy_used to video_generation_details to track repetition
ALTER TABLE video_generation_details 
ADD COLUMN IF NOT EXISTS strategy_used text;

-- 2. Create viral_trends table for dynamic trend injection
CREATE TABLE IF NOT EXISTS viral_trends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  concept_name text NOT NULL, -- e.g. "The Agent Trip"
  hook_type text CHECK (hook_type IN ('motion', 'overlay', 'none')),
  template text, -- e.g. "Ask {{price}} question..."
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. Add RLS policies (Open access for service role, read-only for auth users if needed)
-- For now, we assume service role usage.
ALTER TABLE viral_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON viral_trends FOR SELECT USING (true);
