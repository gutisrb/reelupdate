-- =====================================================
-- PAYMENT SYSTEM & FACEBOOK POSTING MIGRATION
-- Date: 2026-01-22
-- Purpose: Add payment infrastructure and fix Meta app integration
-- =====================================================

-- =====================================================
-- 1. SUBSCRIPTION PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'starter', 'professional', 'agency'
  display_name TEXT NOT NULL, -- 'Starter', 'Professional', 'Agency'
  stripe_price_id TEXT UNIQUE NOT NULL, -- Stripe recurring price ID
  monthly_price_cents INTEGER NOT NULL, -- in cents (9900 = €99)
  video_credits_per_month INTEGER NOT NULL,
  image_credits_per_month INTEGER NOT NULL DEFAULT 100,
  
  -- Feature flags
  features JSONB DEFAULT '{}'::jsonb,
  
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. UPDATE PROFILES TABLE (Payment fields)
-- =====================================================
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free', -- 'free', 'starter', 'professional', 'agency', 'enterprise'
  ADD COLUMN IF NOT EXISTS subscription_status TEXT, -- 'active', 'canceled', 'past_due', 'trialing'
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_videos_created INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_images_created INTEGER DEFAULT 0;

-- =====================================================
-- 3. PAYMENT TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Stripe identifiers
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  stripe_charge_id TEXT,
  
  -- Transaction details
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL, -- 'succeeded', 'pending', 'failed', 'refunded'
  
  -- What was purchased
  transaction_type TEXT NOT NULL, -- 'subscription', 'refund'
  credits_added_videos INTEGER DEFAULT 0,
  credits_added_images INTEGER DEFAULT 0,
  subscription_plan_id UUID REFERENCES subscription_plans(id),
  
  -- Metadata
  stripe_metadata JSONB,
  receipt_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. CREDIT USAGE LOG (for analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  credit_type TEXT NOT NULL, -- 'video', 'image'
  credits_used INTEGER NOT NULL DEFAULT 1,
  credits_remaining INTEGER NOT NULL,
  
  -- What consumed the credits
  video_id UUID, -- REFERENCES videos(id) if exists
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. UPDATE SOCIAL_CONNECTIONS TABLE (Facebook support)
-- =====================================================
ALTER TABLE social_connections 
  ADD COLUMN IF NOT EXISTS facebook_page_id TEXT,
  ADD COLUMN IF NOT EXISTS instagram_business_id TEXT,
  ADD COLUMN IF NOT EXISTS page_access_token TEXT;

-- =====================================================
-- 6. SOCIAL POSTS TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID, -- REFERENCES videos(id) if exists
  connection_id UUID REFERENCES social_connections(id) ON DELETE SET NULL,
  
  platform TEXT NOT NULL, -- 'instagram', 'facebook', 'tiktok'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'posted', 'failed'
  
  -- Platform response
  platform_post_id TEXT, -- ID returned by platform API
  platform_url TEXT, -- URL to view post
  error_message TEXT,
  
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_payment_intent ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_user_id ON credit_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_video_id ON social_posts(video_id);

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are publicly readable"
  ON subscription_plans FOR SELECT
  USING (active = true);

CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage log"
  ON credit_usage_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own social posts"
  ON social_posts FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 9. SEED DATA - SUBSCRIPTION PLANS
-- =====================================================
-- Note: You must replace the placeholder Stripe price IDs with actual ones

INSERT INTO subscription_plans (name, display_name, stripe_price_id, monthly_price_cents, video_credits_per_month, image_credits_per_month, features, sort_order) VALUES
  ('starter', 'Starter', 'REPLACE_WITH_STRIPE_PRICE_ID_1', 9900, 10, 100, '{
    "custom_logo": true,
    "custom_captions": true
  }', 1),
  
  ('professional', 'Professional', 'REPLACE_WITH_STRIPE_PRICE_ID_2', 16900, 20, 200, '{
    "custom_logo": true,
    "custom_captions": true,
    "autoposting": true,
    "visual_hooks": true
  }', 2),
  
  ('agency', 'Agency', 'REPLACE_WITH_STRIPE_PRICE_ID_3', 22900, 30, 300, '{
    "custom_logo": true,
    "custom_captions": true,
    "autoposting": true,
    "visual_hooks": true,
    "visual_hook_presets": true
  }', 3)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON subscription_plans TO authenticated;
GRANT SELECT ON payment_transactions TO authenticated;
GRANT SELECT ON credit_usage_log TO authenticated;
GRANT SELECT ON social_posts TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- ================================================== ===
