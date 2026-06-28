-- Posodobi get_global_leaderboard: vrne match_points in special_points ločeno
CREATE OR REPLACE FUNCTION public.get_global_leaderboard()
RETURNS TABLE(
    user_id            UUID,
    name               TEXT,
    avatar_url         TEXT,
    match_points       BIGINT,
    special_points     BIGINT,
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
        COALESCE(SUM(p.earned_points), 0)::BIGINT                   AS match_points,
        COALESCE((SELECT SUM(sp.earned_points) FROM public.special_predictions sp WHERE sp.user_id = u.id), 0)::BIGINT AS special_points,
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
