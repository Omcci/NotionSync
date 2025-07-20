-- NotionSync Database Schema for Existing Supabase Setup
-- Execute these statements in order to avoid foreign key constraint issues
-- Note: users table already exists in Supabase

-- 1. Add missing columns to existing users table (if they don't exist)
-- The existing table has: id, email, created_at, isPremium, onboarding_completed, 
-- github_username, full_name, avatar_url, updated_at, github_token, github_refresh_token, github_token_updated_at

-- Add is_premium column if it doesn't exist (your table has isPremium instead)
-- We'll use the existing isPremium column

-- 2. Create repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  description TEXT,
  private BOOLEAN DEFAULT false,
  language TEXT,
  url TEXT,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, owner)
);

-- 3. Create commits table
CREATE TABLE IF NOT EXISTS commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  author TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  sha TEXT,
  html_url TEXT,
  status TEXT DEFAULT 'Unverified',
  avatar_url TEXT,
  author_details JSONB,
  diff JSONB,
  actions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create commit summaries table
CREATE TABLE IF NOT EXISTS commit_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE, -- NULL for all repos summary
  summary TEXT NOT NULL,
  commit_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraints
ALTER TABLE commits DROP CONSTRAINT IF EXISTS unique_repo_sha;
ALTER TABLE commits ADD CONSTRAINT unique_repo_sha UNIQUE (repo_id, sha);

ALTER TABLE commit_summaries DROP CONSTRAINT IF EXISTS unique_user_date_repo;
ALTER TABLE commit_summaries ADD CONSTRAINT unique_user_date_repo UNIQUE (user_id, date, repo_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_commits_repo_date ON commits(repo_id, date);
CREATE INDEX IF NOT EXISTS idx_commits_date ON commits(date);
CREATE INDEX IF NOT EXISTS idx_commits_author ON commits(author);
CREATE INDEX IF NOT EXISTS idx_repositories_user ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_user_date ON commit_summaries(user_id, date);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_repositories_updated_at ON repositories;
CREATE TRIGGER update_repositories_updated_at 
    BEFORE UPDATE ON repositories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commits_updated_at ON commits;
CREATE TRIGGER update_commits_updated_at 
    BEFORE UPDATE ON commits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_summaries_updated_at ON commit_summaries;
CREATE TRIGGER update_summaries_updated_at 
    BEFORE UPDATE ON commit_summaries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: Your existing users table uses 'isPremium' instead of 'is_premium'
-- Make sure to update any code references to use the correct column name 