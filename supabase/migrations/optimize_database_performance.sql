-- =========================================================================
-- OPTIMISATION PERFORMANCE BASE DE DONNÉES TRAME (PostgreSQL / Supabase)
-- =========================================================================

-- 1. EXTENSION RECHERCHE TEXTUELLE ACCÉLÉRÉE (Trigrammes)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. INDEX COMPOSITES & DE TRI : CHANTIERS
CREATE INDEX IF NOT EXISTS idx_chantiers_status_created ON public.chantiers(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chantiers_created_at ON public.chantiers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chantiers_client_id ON public.chantiers(client_id);

-- 3. INDEX COMPOSITES & DE TRI : DEVIS & ITEMS
CREATE INDEX IF NOT EXISTS idx_devis_status_created ON public.devis(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devis_chantier_id ON public.devis(chantier_id);
CREATE INDEX IF NOT EXISTS idx_devis_created_at ON public.devis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devis_items_devis_id ON public.devis_items(devis_id);
CREATE INDEX IF NOT EXISTS idx_devis_items_article_id ON public.devis_items(article_id);

-- 4. INDEX COMPOSITES & DE TRI : FACTURES & ITEMS
CREATE INDEX IF NOT EXISTS idx_factures_status_emission ON public.factures(status, date_emission DESC);
CREATE INDEX IF NOT EXISTS idx_factures_chantier_id ON public.factures(chantier_id);
CREATE INDEX IF NOT EXISTS idx_factures_devis_id ON public.factures(devis_id);
CREATE INDEX IF NOT EXISTS idx_factures_created_at ON public.factures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_factures_items_facture_id ON public.factures_items(facture_id);
CREATE INDEX IF NOT EXISTS idx_factures_items_article_id ON public.factures_items(article_id);

-- 5. INDEX GRAPHES & AUTOMATIONS : CHANTIER_NODES & EDGES
CREATE INDEX IF NOT EXISTS idx_chantier_nodes_chantier_action ON public.chantier_nodes(chantier_id, action_type);
CREATE INDEX IF NOT EXISTS idx_chantier_nodes_status ON public.chantier_nodes(status);
CREATE INDEX IF NOT EXISTS idx_chantier_edges_chantier_id ON public.chantier_edges(chantier_id);
CREATE INDEX IF NOT EXISTS idx_chantier_edges_source_target ON public.chantier_edges(source, target);

-- 6. INDEX BIBLIOTHÈQUE D'ARTICLES & RECHERCHE GIN
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_name_trgm ON public.articles USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_ref_trgm ON public.articles USING gin (reference gin_trgm_ops);

-- 7. INDEX CLIENTS & RECHERCHE GIN
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON public.clients USING gin (name gin_trgm_ops);

-- 8. INDEX NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);

-- 9. VALIDATION DES CONTRAINTES DE CLÉS ÉTRANGÈRES
DO $$
BEGIN
    -- Clé factures -> chantiers
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'factures_chantier_id_fkey'
    ) THEN
        ALTER TABLE public.factures
        ADD CONSTRAINT factures_chantier_id_fkey
        FOREIGN KEY (chantier_id) REFERENCES public.chantiers(id) ON DELETE SET NULL;
    END IF;

    -- Clé devis -> chantiers
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'devis_chantier_id_fkey'
    ) THEN
        ALTER TABLE public.devis
        ADD CONSTRAINT devis_chantier_id_fkey
        FOREIGN KEY (chantier_id) REFERENCES public.chantiers(id) ON DELETE SET NULL;
    END IF;
END $$;
