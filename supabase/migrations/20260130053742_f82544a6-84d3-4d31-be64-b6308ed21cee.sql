-- Fix: User Email Addresses Exposed to Anyone on the Internet
-- Solution: Restrict profile viewing to authenticated users only

-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new policy that only allows authenticated users to view profiles
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Note: This ensures only logged-in users can see profile data including emails
-- Unauthenticated users (anon) will not be able to query the profiles table at all