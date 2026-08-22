-- CrickSolve Supabase Database Schema

-- 1. Players Table
CREATE TABLE IF NOT EXISTS public.players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  batting_hand TEXT NOT NULL,
  bowling_type TEXT NOT NULL,
  role TEXT NOT NULL,
  ipl_team TEXT NOT NULL,
  retired BOOLEAN NOT NULL DEFAULT false,
  birth_year INT NOT NULL,
  tests INT NOT NULL DEFAULT 0,
  odis INT NOT NULL DEFAULT 0,
  t20is INT NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'International',
  photo_url TEXT NOT NULL,
  jersey_number INT,
  debut_year INT,
  famous_teammate TEXT,
  signature_performance TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Daily Puzzles Table
CREATE TABLE IF NOT EXISTS public.daily_puzzles (
  date DATE PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'International',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Leaderboard Table
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  user_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  attempts INT NOT NULL,
  time_ms INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast daily leaderboard querying
CREATE INDEX IF NOT EXISTS idx_leaderboard_date_time ON public.leaderboard(date, time_ms ASC);

-- 4. User Stats Table
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id TEXT PRIMARY KEY,
  games_played INT NOT NULL DEFAULT 0,
  games_won INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  max_streak INT NOT NULL DEFAULT 0,
  guess_distribution JSONB NOT NULL DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public read access to players and daily puzzles
CREATE POLICY "Public players access" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public daily puzzles access" ON public.daily_puzzles FOR SELECT USING (true);

-- Leaderboard policies
CREATE POLICY "Public leaderboard read" ON public.leaderboard FOR SELECT USING (true);
CREATE POLICY "Public leaderboard insert" ON public.leaderboard FOR INSERT WITH CHECK (true);

-- User stats policies
CREATE POLICY "Public user stats read" ON public.user_stats FOR SELECT USING (true);
CREATE POLICY "Public user stats upsert" ON public.user_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Public user stats update" ON public.user_stats FOR UPDATE USING (true);
