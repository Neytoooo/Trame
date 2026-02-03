-- Add data column for flexible JSON storage (emails, custom config, etc.)
ALTER TABLE chantier_nodes 
ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb;
