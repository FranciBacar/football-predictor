-- Supabase Schema for Football Predictor App

-- 1. Users Table (Extends Supabase Auth if needed, but here as standalone data table)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    avatar_url TEXT,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Matches Table
CREATE TYPE match_status AS ENUM ('upcoming', 'locked', 'in_progress', 'finished');

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_team_id UUID NOT NULL, -- Would link to a teams table if we had one
    away_team_id UUID NOT NULL, -- Would link to a teams table if we had one
    match_time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    is_knockout BOOLEAN DEFAULT FALSE NOT NULL,
    status match_status DEFAULT 'upcoming' NOT NULL,
    actual_score_home INT,
    actual_score_away INT,
    actual_advancing_team UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Predictions Table
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
    pred_score_home INT NOT NULL,
    pred_score_away INT NOT NULL,
    pred_advancing_team UUID, -- Only used if is_knockout=true AND pred_score_home=pred_score_away
    earned_points INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, match_id) -- A user can only have one prediction per match
);

-- 4. Groups Table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    creator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Group Members Table
CREATE TABLE group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (group_id, user_id)
);
