-- Update default expiration from 7 days to 5 days for new responses
ALTER TABLE public.respuestas 
ALTER COLUMN expires_at SET DEFAULT (now() + '5 days'::interval);