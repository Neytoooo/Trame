-- 4. Updates for 'factures' table (Acomptes & Situations)
ALTER TABLE factures
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'acompte', 'situation', 'solde')),
ADD COLUMN IF NOT EXISTS situation_index INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS devis_id UUID REFERENCES devis(id);

-- 5. Updates for 'factures_items' table (Progress)
ALTER TABLE factures_items
ADD COLUMN IF NOT EXISTS progress_percentage NUMERIC DEFAULT 100;
