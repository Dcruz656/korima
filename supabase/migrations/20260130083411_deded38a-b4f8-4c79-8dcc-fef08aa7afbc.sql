-- Remove the old check constraint and add new one with all 5 levels
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_level_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_level_check 
CHECK (level IN ('novato', 'colaborador', 'experto', 'maestro', 'leyenda'));