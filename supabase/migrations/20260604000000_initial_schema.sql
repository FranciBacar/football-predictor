-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE match_status AS ENUM ('Upcoming', 'Locked', 'In Progress', 'Finished');
CREATE TYPE match_stage AS ENUM (
    'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F', 'Group G', 'Group H',
    'Round of 16', 'Quarter-finals', 'Semi-finals', 'Third place play-off', 'Final'
);

-- 3. TABLES

-- Users (Profiles) table linked to Supabase Auth
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    is_global_opt_in BOOLEAN DEFAULT false, -- Strinjanje z vidnostjo na globalni lestvici
    is_admin BOOLEAN DEFAULT false, -- Za dostop do admin panela
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table (Svetovno prvenstvo tekme)
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    match_time_utc TIMESTAMPTZ NOT NULL,
    stage match_stage NOT NULL,
    is_knockout BOOLEAN DEFAULT false,
    status match_status DEFAULT 'Upcoming',
    actual_score_home INTEGER,
    actual_score_away INTEGER,
    actual_advancing_team TEXT, -- Uporabi se samo v is_knockout=true primeru
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table (Zasebne lige)
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
    creator_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Members table (Povezava uporabnikov in skupin)
CREATE TABLE public.group_members (
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- Predictions table (Napovedi uporabnikov)
CREATE TABLE public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    pred_score_home INTEGER NOT NULL,
    pred_score_away INTEGER NOT NULL,
    pred_advancing_team TEXT, -- 'home' or 'away' (pomembno pri remijih v izločilnih bojih)
    earned_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, match_id) -- Uporabnik lahko ima samo 1 napoved za 1 tekmo
);

-- 4. TRIGGERS

-- Trigger za kreiranje uporabnika v public.users ob SSO prijavi
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Uporabnik'), 
    new.email, 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 5. ROW LEVEL SECURITY (RLS)
-- Varnostna pravila, da uporabniki ne morejo brisati/urejati tujih podatkov

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Users RLS
CREATE POLICY "Users can view opted-in users" ON public.users FOR SELECT USING (is_global_opt_in = true OR id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (id = auth.uid());

-- Matches RLS (vsi lahko berejo tekme, samo admin/sistem lahko ureja)
CREATE POLICY "Matches are readable by everyone" ON public.matches FOR SELECT USING (true);

-- Groups RLS
CREATE POLICY "Users can view groups they belong to" ON public.groups FOR SELECT USING (
    id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()) OR creator_user_id = auth.uid()
);
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = creator_user_id);
CREATE POLICY "Creator can update/delete group" ON public.groups FOR ALL USING (creator_user_id = auth.uid());

-- Group Members RLS
CREATE POLICY "Users can view members of their groups" ON public.group_members FOR SELECT USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Group creator can remove members" ON public.group_members FOR DELETE USING (
    group_id IN (SELECT id FROM public.groups WHERE creator_user_id = auth.uid()) OR auth.uid() = user_id
);

-- Predictions RLS
-- Pazi: Napovedi so vidne ostalim šele, ko se tekma zaklene (status != 'Upcoming')! Pred tem lahko vsak vidi samo svoje.
CREATE POLICY "Users can view own predictions" ON public.predictions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view other predictions if match is locked" ON public.predictions FOR SELECT USING (
    match_id IN (SELECT id FROM public.matches WHERE status != 'Upcoming')
);
CREATE POLICY "Users can insert own predictions" ON public.predictions FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    match_id IN (SELECT id FROM public.matches WHERE status = 'Upcoming')
);
CREATE POLICY "Users can update own predictions" ON public.predictions FOR UPDATE USING (
    user_id = auth.uid() AND 
    match_id IN (SELECT id FROM public.matches WHERE status = 'Upcoming')
);
