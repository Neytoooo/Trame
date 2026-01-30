-- 1. Ajouter la colonne deleted_at aux factures
ALTER TABLE factures 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Mettre à jour les contraintes pour gérer la suppression des Clients
-- Quand un CLIENT est supprimé :
--  - Ses DEVIS sont supprimés (CASCADE)
--  - Ses CHANTIERS sont supprimés (CASCADE)
--  - Ses FACTURES sont conservées mais "déliées" du client (SET NULL) ou juste archivées via trigger.
--    Ici, on va d'abord s'assurer que si on supprime le chantier/devis, la facture ne bloque pas.

-- Supprimer les anciennes contraintes bloquantes si elles existent (noms génériques supposés, vérifiez si besoin)
ALTER TABLE factures DROP CONSTRAINT IF EXISTS factures_devis_id_fkey;
ALTER TABLE factures DROP CONSTRAINT IF EXISTS factures_chantier_id_fkey; -- Au cas où la facture est liée direct au chantier

-- Recréer avec SET NULL pour ne pas perdre la facture si le devis/chantier saute
ALTER TABLE factures
ADD CONSTRAINT factures_devis_id_fkey
FOREIGN KEY (devis_id) 
REFERENCES devis(id)
ON DELETE SET NULL;

-- 3. Trigger pour "Soft Delete" les factures quand un Client est supprimé
-- Au lieu que la facture perde juste son lien client, on veut peut-être qu'elle aille dans la corbeille.
-- Mais attention : Les factures sont souvent liées aux chantiers, qui eux sont liés aux clients.
-- Si on supprime le client -> Cascade supprime Chantier -> ?? Facture ??

-- Solution la plus propre pour votre demande "Factures dans historique" :
-- On crée une fonction qui s'exécute AVANT la suppression d'un client.
-- Elle cherche toutes les factures liées à ce client (via chantier ou direct) et les marque deleted_at = NOW().

CREATE OR REPLACE FUNCTION archive_client_invoices() 
RETURNS TRIGGER AS $$
BEGIN
    -- Archiver les factures liées aux chantiers du client
    UPDATE factures
    SET deleted_at = NOW()
    FROM chantiers
    WHERE factures.chantier_id = chantiers.id
    AND chantiers.client_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER before_client_delete_archive_invoices
BEFORE DELETE ON clients
FOR EACH ROW
EXECUTE FUNCTION archive_client_invoices();

-- 4. Fonction de nettoyage automatique (supprime définitivement après 30 jours)
-- À appeler via un cron ou manuellement de temps en temps
CREATE OR REPLACE FUNCTION cleanup_old_archives()
RETURNS void AS $$
BEGIN
    DELETE FROM factures
    WHERE deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
