-- Add auto_post_enabled column to social_connections
ALTER TABLE public.social_connections 
ADD COLUMN IF NOT EXISTS auto_post_enabled BOOLEAN DEFAULT false;
