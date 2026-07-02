-- =====================================================
-- 1. Popravi calculate_points: primerjava napredovalca
--
-- Problem: pred_advancing_team je shranjen kot 3-mestna koda
-- (npr. 'MAR'), actual_advancing_team pa je polno ime ('Maroko').
-- 'MAR' = 'Maroko' → FALSE → bonus se nikoli ne dodeli!
--
-- Fix: primerja UPPER(LEFT(actual, 3)) z pred kodo.
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_points(
    p_pred_home        INTEGER,
    p_pred_away        INTEGER,
    p_actual_home      INTEGER,
    p_actual_away      INTEGER,
    p_is_knockout      BOOLEAN,
    p_pred_advancing   TEXT,
    p_actual_advancing TEXT
)
RETURNS INTEGER AS $$
DECLARE
    points         INTEGER := 0;
    pred_winner    TEXT;
    actual_winner  TEXT;
    one_team_match BOOLEAN;
BEGIN
    -- Določi zmagovalca
    IF    p_pred_home > p_pred_away    THEN pred_winner := 'home';
    ELSIF p_pred_home < p_pred_away    THEN pred_winner := 'away';
    ELSE                                    pred_winner := 'draw';
    END IF;

    IF    p_actual_home > p_actual_away THEN actual_winner := 'home';
    ELSIF p_actual_home < p_actual_away THEN actual_winner := 'away';
    ELSE                                     actual_winner := 'draw';
    END IF;

    -- Ali se zadetki ene ekipe ujemajo (pogoj za 2 točki)?
    one_team_match := (p_pred_home = p_actual_home) OR (p_pred_away = p_actual_away);

    -- Osnovno točkovanje
    IF p_pred_home = p_actual_home AND p_pred_away = p_actual_away THEN
        points := 3;  -- Točen rezultat
    ELSIF pred_winner = actual_winner AND one_team_match THEN
        points := 2;  -- Pravilen tip + zadetki ene ekipe
    ELSIF pred_winner = actual_winner THEN
        points := 1;  -- Pravilen tip
    ELSE
        points := 0;  -- Napačno
    END IF;

    -- Izločilne tekme: dvojne točke (6, 4 ali 2)
    IF p_is_knockout THEN
        points := points * 2;
    END IF;

    -- Bonus za pravilno napovedanega napredovalca v izločilnih bojih pri remiju
    -- pred_advancing_team = 3-mestna koda (npr. 'MAR')
    -- actual_advancing_team = polno ime (npr. 'Maroko')
    -- → primerjamo UPPER(LEFT(actual, 3)) z pred kodo
    IF p_is_knockout
       AND actual_winner = 'draw'
       AND p_pred_advancing IS NOT NULL
       AND p_actual_advancing IS NOT NULL
       AND p_pred_advancing = UPPER(LEFT(p_actual_advancing, 3))
    THEN
        points := points + 2;
    END IF;

    RETURN points;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- =====================================================
-- 2. Popravi trigger: sproži se tudi ko se
--    actual_advancing_team / actual_score popravi
--    na tekmi ki je že Finished.
-- =====================================================

DROP TRIGGER IF EXISTS on_match_finished ON public.matches;

CREATE TRIGGER on_match_finished
    AFTER UPDATE ON public.matches
    FOR EACH ROW
    WHEN (
        NEW.status = 'Finished'
        AND NEW.actual_score_home IS NOT NULL
        AND NEW.actual_score_away IS NOT NULL
        AND (
            OLD.status IS DISTINCT FROM 'Finished'
            OR OLD.actual_advancing_team IS DISTINCT FROM NEW.actual_advancing_team
            OR OLD.actual_score_home IS DISTINCT FROM NEW.actual_score_home
            OR OLD.actual_score_away IS DISTINCT FROM NEW.actual_score_away
        )
    )
    EXECUTE PROCEDURE public.update_prediction_points();


-- =====================================================
-- 3. Preračunaj VSE točke za zaključene tekme
--    (vključno z bonusom za napredujočo ekipo).
-- =====================================================

UPDATE public.predictions p
SET
    earned_points = public.calculate_points(
        p.pred_score_home,
        p.pred_score_away,
        m.actual_score_home,
        m.actual_score_away,
        m.is_knockout,
        p.pred_advancing_team,
        m.actual_advancing_team
    ),
    updated_at = NOW()
FROM public.matches m
WHERE p.match_id = m.id
  AND m.status = 'Finished'
  AND m.actual_score_home IS NOT NULL;


-- =====================================================
-- 4. Preveri rezultat: tekme s penalti
--    (correct_advancing zdaj primerja pravilno)
-- =====================================================

SELECT
    m.home_team, m.away_team,
    m.actual_score_home, m.actual_score_away,
    m.actual_penalty_home, m.actual_penalty_away,
    m.actual_advancing_team,
    COUNT(p.id)                                                   AS predictions_total,
    SUM(p.earned_points)                                          AS points_total,
    SUM(CASE WHEN p.pred_advancing_team IS NOT NULL THEN 1 ELSE 0 END) AS with_advancing_pred,
    SUM(CASE WHEN p.pred_advancing_team = UPPER(LEFT(m.actual_advancing_team, 3))
             THEN 1 ELSE 0 END)                                   AS correct_advancing
FROM public.matches m
JOIN public.predictions p ON p.match_id = m.id
WHERE m.actual_advancing_team IS NOT NULL
GROUP BY m.id, m.home_team, m.away_team,
         m.actual_score_home, m.actual_score_away,
         m.actual_penalty_home, m.actual_penalty_away,
         m.actual_advancing_team
ORDER BY m.match_time_utc;
