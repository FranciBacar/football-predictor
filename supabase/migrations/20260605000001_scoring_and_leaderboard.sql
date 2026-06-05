-- ============================================================
-- MIGRATION: Scoring System + Leaderboard Functions
-- ============================================================

-- 1. TOČKOVANJE: Funkcija za izračun točk za posamezno napoved
-- ---------------------------------------------------------------
-- Sistem točkovanja (po 90 minutah):
--   3 točke  = točen rezultat (npr. 2:1 → 2:1)
--   2 točki  = pravilna razlika/remi (npr. 3:1 → 2:0, ali 1:1 → 2:2)
--   1 točka  = pravilen zmagovalec
--   0 točk   = napačen zmagovalec
--   +1 bonus = izločilna tekma, remi po 90 min, pravilna napoved napredujočega
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_points(
    p_pred_home       INTEGER,
    p_pred_away       INTEGER,
    p_actual_home     INTEGER,
    p_actual_away     INTEGER,
    p_is_knockout     BOOLEAN,
    p_pred_advancing  TEXT,
    p_actual_advancing TEXT
)
RETURNS INTEGER AS $$
DECLARE
    points        INTEGER := 0;
    pred_diff     INTEGER;
    actual_diff   INTEGER;
    pred_winner   TEXT;
    actual_winner TEXT;
BEGIN
    pred_diff   := p_pred_home - p_pred_away;
    actual_diff := p_actual_home - p_actual_away;

    -- Določi zmagovalca
    IF    pred_diff > 0 THEN pred_winner := 'home';
    ELSIF pred_diff < 0 THEN pred_winner := 'away';
    ELSE                     pred_winner := 'draw';
    END IF;

    IF    actual_diff > 0 THEN actual_winner := 'home';
    ELSIF actual_diff < 0 THEN actual_winner := 'away';
    ELSE                       actual_winner := 'draw';
    END IF;

    -- Osnovno točkovanje
    IF p_pred_home = p_actual_home AND p_pred_away = p_actual_away THEN
        points := 3;  -- Točen rezultat
    ELSIF pred_diff = actual_diff AND pred_winner = actual_winner THEN
        points := 2;  -- Pravilna razlika / remi
    ELSIF pred_winner = actual_winner THEN
        points := 1;  -- Pravilen zmagovalec
    ELSE
        points := 0;  -- Napačno
    END IF;

    -- Bonus +1 za izločilne boje
    IF p_is_knockout
       AND actual_winner = 'draw'
       AND p_pred_advancing IS NOT NULL
       AND p_actual_advancing IS NOT NULL
       AND p_pred_advancing = p_actual_advancing
    THEN
        points := points + 1;
    END IF;

    RETURN points;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- 2. TRIGGER: Samodejni izračun točk ob zaključku tekme
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_prediction_points()
RETURNS trigger AS $$
BEGIN
    -- Sproži se samo ob prehodu v 'Finished' z veljavnimi rezultati
    IF NEW.status = 'Finished'
       AND NEW.actual_score_home IS NOT NULL
       AND NEW.actual_score_away IS NOT NULL
    THEN
        UPDATE public.predictions
        SET
            earned_points = public.calculate_points(
                pred_score_home,
                pred_score_away,
                NEW.actual_score_home,
                NEW.actual_score_away,
                NEW.is_knockout,
                pred_advancing_team,
                NEW.actual_advancing_team
            ),
            updated_at = NOW()
        WHERE match_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_match_finished ON public.matches;
CREATE TRIGGER on_match_finished
    AFTER UPDATE ON public.matches
    FOR EACH ROW
    WHEN (NEW.status = 'Finished' AND OLD.status IS DISTINCT FROM 'Finished')
    EXECUTE PROCEDURE public.update_prediction_points();


-- 3. RPC: Globalna lestvica (samo opt-in uporabniki)
-- ---------------------------------------------------------------
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
        COALESCE(SUM(p.earned_points), 0)::BIGINT                   AS total_points,
        COALESCE(COUNT(
            CASE WHEN p.pred_score_home = m.actual_score_home
                  AND p.pred_score_away = m.actual_score_away
                  AND m.status = 'Finished'
             THEN 1 END
        ), 0)::BIGINT                                                AS exact_predictions,
        RANK() OVER (
            ORDER BY COALESCE(SUM(p.earned_points), 0) DESC,
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


-- 4. RPC: Skupinska lestvica (za posamezno skupino)
-- ---------------------------------------------------------------
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
    -- Varnostna preveritev: poklicatelj mora biti član te skupine
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
        COALESCE(SUM(p.earned_points), 0)::BIGINT                   AS total_points,
        COALESCE(COUNT(
            CASE WHEN p.pred_score_home = m.actual_score_home
                  AND p.pred_score_away = m.actual_score_away
                  AND m.status = 'Finished'
             THEN 1 END
        ), 0)::BIGINT                                                AS exact_predictions,
        RANK() OVER (
            ORDER BY COALESCE(SUM(p.earned_points), 0) DESC,
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
