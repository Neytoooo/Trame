-- Script "Smart Client Deletion"
-- Objectif : Quand on supprime un client :
-- 1. Les DEVIS sont supprimés (Cascade).
-- 2. Les CHANTIERS sont supprimés (Cascade).
-- 3. Les FACTURES (liées aux devis/chantiers) sont archivées (Soft Delete) et non supprimées.

-- 1. Nettoyage des FK potentiellement bloquantes ou mal configurées
ALTER TABLE chantiers DROP CONSTRAINT IF EXISTS chantiers_client_id_fkey;
ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_chantier_id_fkey;
ALTER TABLE factures DROP CONSTRAINT IF EXISTS factures_devis_id_fkey;
ALTER TABLE factures DROP CONSTRAINT IF EXISTS factures_chantier_id_fkey;

-- 2. Re-création des FK avec CASCADE pour la chaîne de suppression (Sauf Factures)
ALTER TABLE chantiers
ADD CONSTRAINT chantiers_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE; -- Supprimer client -> Supprime chantier

ALTER TABLE devis
ADD CONSTRAINT devis_chantier_id_fkey
FOREIGN KEY (chantier_id)
REFERENCES chantiers(id)
ON DELETE CASCADE; -- Supprimer chantier -> Supprime devis

-- 3. Pour les factures, on veut SET NULL pour ne pas qu'elles soient supprimées par la cascade
ALTER TABLE factures
ADD CONSTRAINT factures_devis_id_fkey
FOREIGN KEY (devis_id)
REFERENCES devis(id)
ON DELETE SET NULL; -- Si le devis saute, la facture reste (mais devis_id = NULL)

ALTER TABLE factures
ADD CONSTRAINT factures_chantier_id_fkey
FOREIGN KEY (chantier_id)
REFERENCES chantiers(id)
ON DELETE SET NULL; -- Si le chantier saute, la facture reste

-- 4. Le TRIGGER qui fait tout le travail "intelligent" AVANT la suppression
-- Ce trigger doit se déclencher avant que la CASCADE ne supprime les chantiers.

CREATE OR REPLACE FUNCTION archive_client_invoices_before_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- On cherche toutes les factures liées à ce client.
    -- Elles peuvent être liées via le chantier, ou on peut vouloir les identifier autrement.
    -- Ici, on passe via 'chantiers' car c'est le lien principal.
    
    -- Mettre à jour les factures liées aux chantiers de ce client
    -- On les marque comme deleted, et on garde la trace qu'elles existaient.
    -- IMPORTANT: Comme le chantier va être supprimé juste après, le chantier_id dans la facture passera à NULL (via le SET NULL ci-dessus).
    -- C'est normal. La facture sera dans la corbeille.
    
    UPDATE factures
    SET deleted_at = NOW()
    FROM chantiers
    WHERE factures.chantier_id = chantiers.id
    AND chantiers.client_id = OLD.id
    AND factures.deleted_at IS NULL; -- Ne pas toucher si déjà archivée
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existait sous un autre nom ou le même
DROP TRIGGER IF EXISTS before_client_delete_archive_invoices ON clients;

CREATE TRIGGER before_client_delete_archive_invoices
BEFORE DELETE ON clients
FOR EACH ROW
EXECUTE FUNCTION archive_client_invoices_before_delete();
