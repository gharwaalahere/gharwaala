-- ============================================================================
-- Gharwaala AI Kitchen Studio SaaS — Supabase Schema & RLS Policies
-- Run this in your Supabase SQL Editor to enable full cloud workspace sync,
-- public share links, and credit ledger tracking.
-- ============================================================================

-- 1. Studio User Profiles (Credits, Tier, Phone Verification, Referrals)
CREATE TABLE IF NOT EXISTS public.studio_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  site_audit_booked BOOLEAN DEFAULT FALSE,
  tier TEXT DEFAULT 'Homeowner Starter',
  credits INTEGER DEFAULT 5,
  referral_code TEXT UNIQUE,
  referrals_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Saved Kitchen Transformation Projects
CREATE TABLE IF NOT EXISTS public.studio_projects (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  title TEXT NOT NULL,
  style_key TEXT NOT NULL,
  style_title TEXT NOT NULL,
  before_image TEXT NOT NULL,
  after_image TEXT NOT NULL,
  cabinet_core TEXT,
  hardware_tier TEXT,
  countertop_slab TEXT,
  structure_mode TEXT DEFAULT 'seg',
  custom_prompt TEXT,
  estimated_cost TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Credit Usage & Reward Ledger
CREATE TABLE IF NOT EXISTS public.studio_credit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.studio_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_credit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for studio_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.studio_profiles;
CREATE POLICY "Users can view own profile" ON public.studio_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.studio_profiles;
CREATE POLICY "Users can insert own profile" ON public.studio_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.studio_profiles;
CREATE POLICY "Users can update own profile" ON public.studio_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies for studio_projects (Public read for shared links, owner write)
DROP POLICY IF EXISTS "Anyone can view public shared projects" ON public.studio_projects;
CREATE POLICY "Anyone can view public shared projects" ON public.studio_projects
  FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.studio_projects;
CREATE POLICY "Authenticated users can insert projects" ON public.studio_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own projects" ON public.studio_projects;
CREATE POLICY "Users can update own projects" ON public.studio_projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.studio_projects;
CREATE POLICY "Users can delete own projects" ON public.studio_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for studio_credit_logs
DROP POLICY IF EXISTS "Users can view own credit logs" ON public.studio_credit_logs;
CREATE POLICY "Users can view own credit logs" ON public.studio_credit_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credit logs" ON public.studio_credit_logs;
CREATE POLICY "Users can insert own credit logs" ON public.studio_credit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
