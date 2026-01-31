-- Create table for saved/bookmarked solicitudes
CREATE TABLE public.saved_solicitudes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, solicitud_id)
);

-- Enable RLS
ALTER TABLE public.saved_solicitudes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own saved solicitudes"
ON public.saved_solicitudes
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can save solicitudes"
ON public.saved_solicitudes
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unsave solicitudes"
ON public.saved_solicitudes
FOR DELETE
USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_saved_solicitudes_user_id ON public.saved_solicitudes(user_id);
CREATE INDEX idx_saved_solicitudes_solicitud_id ON public.saved_solicitudes(solicitud_id);