-- Drop the old constraint
ALTER TABLE chantiers DROP CONSTRAINT IF EXISTS chantiers_status_check;

-- Add the new constraint with all desired statuses
ALTER TABLE chantiers 
ADD CONSTRAINT chantiers_status_check 
CHECK (status IN ('etude', 'en_cours', 'termine', 'annule'));
