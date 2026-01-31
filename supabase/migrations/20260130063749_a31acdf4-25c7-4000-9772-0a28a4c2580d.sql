-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('response', 'comment', 'points', 'like')),
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

-- System can insert notifications (authenticated users for triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify on new response
CREATE OR REPLACE FUNCTION public.notify_on_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    solicitud_owner UUID;
    solicitud_title TEXT;
    responder_name TEXT;
BEGIN
    -- Get the solicitud owner and title
    SELECT user_id, title INTO solicitud_owner, solicitud_title
    FROM public.solicitudes
    WHERE id = NEW.solicitud_id;
    
    -- Get responder name
    SELECT COALESCE(full_name, email) INTO responder_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Don't notify if responding to own solicitud
    IF solicitud_owner != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, reference_id)
        VALUES (
            solicitud_owner,
            'response',
            'Nueva respuesta',
            responder_name || ' respondió a "' || LEFT(solicitud_title, 50) || '"',
            NEW.solicitud_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for new responses
CREATE TRIGGER on_new_response
AFTER INSERT ON public.respuestas
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_response();

-- Create function to notify on new comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    solicitud_owner UUID;
    solicitud_title TEXT;
    commenter_name TEXT;
BEGIN
    -- Get the solicitud owner and title
    SELECT user_id, title INTO solicitud_owner, solicitud_title
    FROM public.solicitudes
    WHERE id = NEW.solicitud_id;
    
    -- Get commenter name
    SELECT COALESCE(full_name, email) INTO commenter_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Don't notify if commenting on own solicitud
    IF solicitud_owner != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, reference_id)
        VALUES (
            solicitud_owner,
            'comment',
            'Nuevo comentario',
            commenter_name || ' comentó en "' || LEFT(solicitud_title, 50) || '"',
            NEW.solicitud_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for new comments
CREATE TRIGGER on_new_comment
AFTER INSERT ON public.comentarios
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_comment();

-- Create function to notify on points earned
CREATE OR REPLACE FUNCTION public.notify_on_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    points_diff INTEGER;
BEGIN
    points_diff := NEW.points - OLD.points;
    
    IF points_diff > 0 THEN
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (
            NEW.id,
            'points',
            '¡Puntos ganados!',
            'Has ganado ' || points_diff || ' puntos'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for points updates
CREATE TRIGGER on_points_update
AFTER UPDATE OF points ON public.profiles
FOR EACH ROW
WHEN (NEW.points > OLD.points)
EXECUTE FUNCTION public.notify_on_points();

-- Create function to notify on like
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    solicitud_owner UUID;
    solicitud_title TEXT;
    liker_name TEXT;
BEGIN
    -- Get the solicitud owner and title
    SELECT user_id, title INTO solicitud_owner, solicitud_title
    FROM public.solicitudes
    WHERE id = NEW.solicitud_id;
    
    -- Get liker name
    SELECT COALESCE(full_name, email) INTO liker_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Don't notify if liking own solicitud
    IF solicitud_owner != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, reference_id)
        VALUES (
            solicitud_owner,
            'like',
            '¡Le gusta tu solicitud!',
            'A ' || liker_name || ' le gusta "' || LEFT(solicitud_title, 50) || '"',
            NEW.solicitud_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for new likes
CREATE TRIGGER on_new_like
AFTER INSERT ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_like();