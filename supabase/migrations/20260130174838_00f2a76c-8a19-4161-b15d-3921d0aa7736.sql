-- Drop the overly permissive policy that exposes emails
DROP POLICY IF EXISTS "Authenticated users can view public profile fields" ON public.profiles;

-- Now only these policies exist:
-- 1. "Users can view own profile" - users see their own full profile
-- 2. "Admins can view all profiles" - admins see everything
-- The get_public_profiles function handles viewing other users' data without email