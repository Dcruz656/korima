-- Create a public view that excludes sensitive email field
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  specialty,
  institution,
  country,
  website,
  level,
  points,
  created_at,
  updated_at
FROM public.profiles;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create a new policy that only allows users to see their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());