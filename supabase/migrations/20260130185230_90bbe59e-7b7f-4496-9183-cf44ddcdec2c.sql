-- Create a function to get top contributors that bypasses RLS
-- This ensures all users see the same leaderboard
CREATE OR REPLACE FUNCTION public.get_top_contributors(limit_count integer DEFAULT 6)
RETURNS TABLE (
  user_id uuid,
  response_count bigint,
  full_name text,
  avatar_url text,
  level text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.user_id,
    COUNT(*) as response_count,
    p.full_name,
    p.avatar_url,
    p.level
  FROM respuestas r
  LEFT JOIN profiles p ON p.id = r.user_id
  GROUP BY r.user_id, p.full_name, p.avatar_url, p.level
  ORDER BY response_count DESC
  LIMIT limit_count;
$$;