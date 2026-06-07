-- ============================================================
-- MIGRATION: Posebne napovedi pred tekmovanjem
-- ============================================================
-- Tipi napovedi:
--   'tournament_winner'   → 10 točk
--   'top_scorer'          → 10 točk
--   'best_player'         → 10 točk
--   'group_winner_A' ... 'group_winner_L' → 3 točke vsaka
-- Zaklepanje: pred začetkom SP (2026-06-11 18:00 UTC)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.special_predictions (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    prediction_type   TEXT NOT NULL,
    prediction_value  TEXT NOT NULL DEFAULT '',
    earned_points     INTEGER NOT NULL DEFAULT 0,
    correct_answer    TEXT,   -- admin nastavi po koncu
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, prediction_type)
);

-- RLS
ALTER TABLE public.special_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own special predictions"
    ON public.special_predictions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own special predictions"
    ON public.special_predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own special predictions"
    ON public.special_predictions FOR UPDATE
    USING (auth.uid() = user_id);

-- Admin: pregled vseh napovedi
CREATE POLICY "Admins can read all special predictions"
    ON public.special_predictions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can update all special predictions"
    ON public.special_predictions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ============================================================
-- Funkcija: admin nastavi pravilne odgovore + izračuna točke
-- ============================================================
CREATE OR REPLACE FUNCTION public.score_special_predictions(
    p_type          TEXT,
    p_correct_value TEXT
)
RETURNS INTEGER AS $$
DECLARE
    points_per_correct INTEGER;
    updated_count      INTEGER;
BEGIN
    -- Določi vrednost točk glede na tip
    IF p_type IN ('tournament_winner', 'top_scorer', 'best_player') THEN
        points_per_correct := 10;
    ELSIF p_type LIKE 'group_winner_%' THEN
        points_per_correct := 3;
    ELSE
        points_per_correct := 0;
    END IF;

    -- Posodobi pravilne napovedi
    UPDATE public.special_predictions
    SET
        correct_answer = p_correct_value,
        earned_points  = CASE
            WHEN LOWER(TRIM(prediction_value)) = LOWER(TRIM(p_correct_value))
            THEN points_per_correct
            ELSE 0
        END,
        updated_at = NOW()
    WHERE prediction_type = p_type;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Posodobi lestvico funkciji da vključujeta special_predictions točke
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_global_leaderboard()
RETURNS TABLE(
    user_id            UUID,
    name               TEXT,
    avatar_url         TEXT,
    total_points       BIGINT,
    exact_predictions  BIGINT,
    rank               BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id                                                          AS user_id,
        u.name,
        u.avatar_url,
        (COALESCE(SUM(p.earned_points), 0) +
         COALESCE((SELECT SUM(sp.earned_points) FROM public.special_predictions sp WHERE sp.user_id = u.id), 0)
        )::BIGINT                                                    AS total_points,
        COALESCE(COUNT(
            CASE WHEN p.pred_score_home = m.actual_score_home
                  AND p.pred_score_away = m.actual_score_away
                  AND m.status = 'Finished'
             THEN 1 END
        ), 0)::BIGINT                                                AS exact_predictions,
        RANK() OVER (
            ORDER BY (COALESCE(SUM(p.earned_points), 0) +
                      COALESCE((SELECT SUM(sp.earned_points) FROM public.special_predictions sp WHERE sp.user_id = u.id), 0)) DESC,
                     COUNT(CASE WHEN p.pred_score_home = m.actual_score_home
                                 AND p.pred_score_away = m.actual_score_away
                                 AND m.status = 'Finished'
                           THEN 1 END) DESC
        )::BIGINT                                                    AS rank
    FROM public.users u
    LEFT JOIN public.predictions p ON p.user_id = u.id
    LEFT JOIN public.matches m     ON m.id = p.match_id
    WHERE u.is_global_opt_in = true
    GROUP BY u.id, u.name, u.avatar_url
    ORDER BY total_points DESC, exact_predictions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.get_group_leaderboard(p_group_id UUID)
RETURNS TABLE(
    user_id            UUID,
    name               TEXT,
    avatar_url         TEXT,
    total_points       BIGINT,
    exact_predictions  BIGINT,
    rank               BIGINT
) AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = p_group_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Dostop zavrnjen: nisi član te skupine.';
    END IF;

    RETURN QUERY
    SELECT
        u.id                                                          AS user_id,
        u.name,
        u.avatar_url,
        (COALESCE(SUM(p.earned_points), 0) +
         COALESCE((SELECT SUM(sp.earned_points) FROM public.special_predictions sp WHERE sp.user_id = u.id), 0)
        )::BIGINT                                                    AS total_points,
        COALESCE(COUNT(
            CASE WHEN p.pred_score_home = m.actual_score_home
                  AND p.pred_score_away = m.actual_score_away
                  AND m.status = 'Finished'
             THEN 1 END
        ), 0)::BIGINT                                                AS exact_predictions,
        RANK() OVER (
            ORDER BY (COALESCE(SUM(p.earned_points), 0) +
                      COALESCE((SELECT SUM(sp.earned_points) FROM public.special_predictions sp WHERE sp.user_id = u.id), 0)) DESC,
                     COUNT(CASE WHEN p.pred_score_home = m.actual_score_home
                                 AND p.pred_score_away = m.actual_score_away
                                 AND m.status = 'Finished'
                           THEN 1 END) DESC
        )::BIGINT                                                    AS rank
    FROM public.group_members gm
    JOIN public.users u        ON u.id = gm.user_id
    LEFT JOIN public.predictions p ON p.user_id = u.id
    LEFT JOIN public.matches m     ON m.id = p.match_id
    WHERE gm.group_id = p_group_id
    GROUP BY u.id, u.name, u.avatar_url
    ORDER BY total_points DESC, exact_predictions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
