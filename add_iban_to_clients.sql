ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS iban text;

-- S'assurer que le numéro de SIRET est aussi présent (s'il ne l'était pas déjà)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS siret text;
