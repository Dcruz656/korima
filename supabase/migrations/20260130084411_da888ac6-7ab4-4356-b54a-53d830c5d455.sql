-- Update the user level trigger to use 500 points per level
CREATE OR REPLACE FUNCTION public.update_user_level()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.points >= 2000 THEN
        NEW.level = 'leyenda';
    ELSIF NEW.points >= 1500 THEN
        NEW.level = 'maestro';
    ELSIF NEW.points >= 1000 THEN
        NEW.level = 'experto';
    ELSIF NEW.points >= 500 THEN
        NEW.level = 'colaborador';
    ELSE
        NEW.level = 'novato';
    END IF;
    RETURN NEW;
END;
$function$;