-- =========================================================================
-- MIGRATION: MODULE RENDEZ-VOUS & RELANCES PRÉVENTIVES DEVIS BTP
-- =========================================================================

-- 1. TABLE DES RENDEZ-VOUS (Visites techniques, métrés, RDV prospects)
CREATE TABLE IF NOT EXISTS public.rendez_vous (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chantier_id UUID REFERENCES public.chantiers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    notes TEXT,
    date_start TIMESTAMP WITH TIME ZONE NOT NULL,
    date_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Cycle de vie du RDV
    status TEXT NOT NULL DEFAULT 'planifie' 
        CHECK (status IN ('planifie', 'effectue', 'annule', 'reporte')),
    
    -- Lien vers le devis (dès qu'un devis est lié, la relance s'éteint)
    devis_id UUID REFERENCES public.devis(id) ON DELETE SET NULL,
    
    -- Gestion de la relance post-RDV
    relance_active BOOLEAN DEFAULT TRUE,
    relance_sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour accélérer le scan des RDVs validés sans devis
CREATE INDEX IF NOT EXISTS idx_rdv_status_devis 
ON public.rendez_vous(status, devis_id, date_end) 
WHERE status = 'effectue' AND devis_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_rdv_chantier_id ON public.rendez_vous(chantier_id);
CREATE INDEX IF NOT EXISTS idx_rdv_client_id ON public.rendez_vous(client_id);
CREATE INDEX IF NOT EXISTS idx_rdv_user_id ON public.rendez_vous(user_id);

-- RLS pour rendez_vous
ALTER TABLE public.rendez_vous ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'rendez_vous' AND policyname = 'Authenticated users can manage rendez_vous'
    ) THEN
        CREATE POLICY "Authenticated users can manage rendez_vous" ON public.rendez_vous
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 2. AJOUT DU DÉLAI PARAMÉTRABLE D'ENTREPRISE
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS delai_relance_devis_heures INT DEFAULT 48;

-- 3. FONCTION RPC DE DÉTECTION ET D'INSERTION DES NOTIFICATIONS DE RELANCE
CREATE OR REPLACE FUNCTION public.check_rdv_pending_devis_relances()
RETURNS TABLE(
    rdv_id UUID, 
    user_id UUID, 
    client_name TEXT, 
    delay_hours INT,
    chantier_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    configured_delay INT := 48;
BEGIN
    -- Récupération du délai paramétré entreprise (fallback: 48h)
    SELECT COALESCE(delai_relance_devis_heures, 48) INTO configured_delay
    FROM public.company_settings LIMIT 1;

    RETURN QUERY
    WITH overdue_rdv AS (
        SELECT 
            r.id AS r_id,
            r.user_id AS r_user_id,
            COALESCE(c.name, 'Client inconnu') AS r_client_name,
            ROUND(EXTRACT(EPOCH FROM (now() - r.date_end)) / 3600)::INT AS r_delay_hours,
            r.chantier_id AS r_chantier_id
        FROM public.rendez_vous r
        LEFT JOIN public.clients c ON c.id = r.client_id
        WHERE r.status = 'effectue'
          AND r.devis_id IS NULL
          AND r.relance_active = TRUE
          AND r.relance_sent_at IS NULL
          AND r.date_end + (configured_delay || ' hours')::INTERVAL <= now()
          -- Condition de blocage : aucun devis créé pour ce chantier après le RDV
          AND NOT EXISTS (
              SELECT 1 FROM public.devis d 
              WHERE d.chantier_id = r.chantier_id 
                AND d.created_at >= r.date_start
          )
    )
    -- Insertion automatique dans notifications (table in-app)
    , inserted_notifications AS (
        INSERT INTO public.notifications (user_id, type, title, message, status, data)
        SELECT 
            o.r_user_id,
            'relance_devis_post_rdv',
            'Devis à rédiger suite au RDV',
            'Le RDV avec ' || o.r_client_name || ' a été validé il y a ' || o.r_delay_hours || 'h. Pensez à créer et transmettre le devis.',
            'unread',
            jsonb_build_object(
                'rdv_id', o.r_id,
                'client_name', o.r_client_name,
                'chantier_id', o.r_chantier_id
            )
        FROM overdue_rdv o
        WHERE o.r_user_id IS NOT NULL
        RETURNING (data->>'rdv_id')::UUID AS updated_rdv_id
    )
    -- Marquer la relance comme transmise pour éviter tout doublon
    UPDATE public.rendez_vous
    SET relance_sent_at = now()
    FROM overdue_rdv
    WHERE rendezvous.id = overdue_rdv.r_id;

    RETURN QUERY
    SELECT o.r_id, o.r_user_id, o.r_client_name, o.r_delay_hours, o.r_chantier_id 
    FROM overdue_rdv o;
END;
$$;
