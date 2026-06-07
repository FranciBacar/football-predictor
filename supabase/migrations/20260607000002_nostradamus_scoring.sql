-- ============================================================
-- MIGRATION: Nostradamus-style scoring system
-- ============================================================
-- Nova pravila (enako kot RTV SLO Nostradamus):
--   3 točke  = točen rezultat (npr. 2:1 → 2:1)
--   2 točki  = pravilen tip tekme + zadetki ene ekipe ujemajo
--              (npr. 3:1 → 2:1: zmaga je pravilna, away = 1 pri obeh)
--   1 točka  = pravilen tip (zmagovalec ali remi)
--   0 točk   = napačen tip
-- Od 1/8 finala naprej (is_knockout = true): vse točke × 2 (6, 4 ali 2)
-- Bonus: izločilne tekme, remi po 90 min, pravilna napoved napredujočega → +2 (× dvojnik)
-- ============================================================

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
    IF    p_pred_home > p_pred_away   THEN pred_winner := 'home';
    ELSIF p_pred_home < p_pred_away   THEN pred_winner := 'away';
    ELSE                                   pred_winner := 'draw';
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
    -- (vrednost: +2, ker smo že podvojili)
    IF p_is_knockout
       AND actual_winner = 'draw'
       AND p_pred_advancing IS NOT NULL
       AND p_actual_advancing IS NOT NULL
       AND p_pred_advancing = p_actual_advancing
    THEN
        points := points + 2;
    END IF;

    RETURN points;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Trigger ostane enak — samo funkcija calculate_points se je spremenila
-- Sproži se ob vsaki posodobitvi tekme v status 'Finished'
-- (trigger on_match_finished je že definiran iz prejšnje migracije)

-- Ponovno izračunaj točke za vse že zaključene tekme
-- (za primer, da so bile tekme že vnešene pred to migracijo)
DO $$
BEGIN
    UPDATE public.predictions p
    SET earned_points = public.calculate_points(
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
      AND m.actual_score_home IS NOT NULL
      AND m.actual_score_away IS NOT NULL;
END;
$$;
