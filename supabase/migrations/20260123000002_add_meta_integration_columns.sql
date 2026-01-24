-- Add columns for Meta (Instagram/Facebook) Business Integration
ALTER TABLE public.social_connections 
ADD COLUMN IF NOT EXISTS facebook_page_id TEXT,
ADD COLUMN IF NOT EXISTS instagram_business_id TEXT,
ADD COLUMN IF NOT EXISTS page_access_token TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.social_connections.facebook_page_id IS 'Stored for Meta Graph API calls directed at a specific page';
COMMENT ON COLUMN public.social_connections.instagram_business_id IS 'Required for the Instagram Content Publishing API';
COMMENT ON COLUMN public.social_connections.page_access_token IS 'Long-lived page access token for offline posting';
