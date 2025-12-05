-- Create social_connections table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS public.social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok')),
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one connection per platform per user
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own connections"
  ON public.social_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON public.social_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Only service role (Edge Functions) should insert/update tokens to ensure security
-- But for simplicity in development, we allow users to insert/update their own if needed,
-- though ideally this is done via the callback function which runs as service role or user.
-- Let's allow authenticated users to manage their own connections for now.
CREATE POLICY "Users can insert own connections"
  ON public.social_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON public.social_connections FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_social_connections_user_id ON public.social_connections(user_id);
