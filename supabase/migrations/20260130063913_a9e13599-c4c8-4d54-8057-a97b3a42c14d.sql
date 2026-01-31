-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a more restrictive INSERT policy - only allow inserts where user_id matches auth.uid()
-- This prevents unauthorized users from inserting notifications for others
-- The triggers use SECURITY DEFINER so they bypass RLS
CREATE POLICY "Users can create own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (user_id = auth.uid());