-- Update the user level function with new levels (300 points each)
CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.points >= 1200 THEN
        NEW.level = 'leyenda';
    ELSIF NEW.points >= 900 THEN
        NEW.level = 'maestro';
    ELSIF NEW.points >= 600 THEN
        NEW.level = 'experto';
    ELSIF NEW.points >= 300 THEN
        NEW.level = 'colaborador';
    ELSE
        NEW.level = 'novato';
    END IF;
    RETURN NEW;
END;
$function$;