-- Option 1 : Solution Immédiate (Pour supprimer le devis bloqué spécifique)
-- Remplacez 'ID_DU_DEVIS' par l'ID qui bloque (ex: 54da6dc4-3006-41c3-b1b0-369f48139c18)

-- D'abord, on retire le lien dans les factures concernées (ou on les supprime si elles sont aussi corrompues)
UPDATE factures 
SET devis_id = NULL 
WHERE devis_id = '54da6dc4-3006-41c3-b1b0-369f48139c18';

-- Ensuite, on peut supprimer le devis
DELETE FROM devis 
WHERE id = '54da6dc4-3006-41c3-b1b0-369f48139c18';


-- Option 2 : Solution Durable (Modifier la contrainte pour autoriser la suppression)
-- Cela permet de dire "Si je supprime un devis, mets devis_id à NULL dans la facture au lieu de bloquer".

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE factures 
DROP CONSTRAINT IF EXISTS factures_devis_id_fkey;

-- 2. Ajouter la nouvelle contrainte avec ON DELETE SET NULL
ALTER TABLE factures
ADD CONSTRAINT factures_devis_id_fkey
FOREIGN KEY (devis_id) 
REFERENCES devis(id)
ON DELETE SET NULL;
