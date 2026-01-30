-- Rétablissement de la contrainte Foreign Key pour chantier_id
-- Cette contrainte est nécessaire pour que Supabase (PostgREST) détecte la relation et permette le "Join".

ALTER TABLE factures
ADD CONSTRAINT factures_chantier_id_fkey
FOREIGN KEY (chantier_id) 
REFERENCES chantiers(id)
ON DELETE SET NULL;
