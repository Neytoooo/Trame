-- =========================================================================
-- MIGRATION: DÉPÔT PHOTOS DE CHANTIER ET RATTACHEMENT AUX DEVIS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.depot_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Photo de chantier',
    devis_id UUID REFERENCES public.devis(id) ON DELETE SET NULL,
    devis_reference TEXT,
    chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
    chantier_name TEXT NOT NULL DEFAULT 'Chantier',
    client_name TEXT NOT NULL DEFAULT 'Client',
    category TEXT NOT NULL DEFAULT 'constat'
        CHECK (category IN ('constat', 'avant_travaux', 'en_cours', 'apres_travaux', 'releve_technique', 'autre')),
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    notes TEXT,
    file_size INT DEFAULT 0,
    device_info TEXT DEFAULT 'KOTA Mobile (Smartphone)',
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour recherche rapide par référence de devis
CREATE INDEX IF NOT EXISTS idx_depot_photos_devis_ref ON public.depot_photos(devis_reference);
CREATE INDEX IF NOT EXISTS idx_depot_photos_devis_id ON public.depot_photos(devis_id);
CREATE INDEX IF NOT EXISTS idx_depot_photos_chantier_id ON public.depot_photos(chantier_id);
CREATE INDEX IF NOT EXISTS idx_depot_photos_company_id ON public.depot_photos(company_id);
CREATE INDEX IF NOT EXISTS idx_depot_photos_created_at ON public.depot_photos(created_at DESC);

-- RLS
ALTER TABLE public.depot_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for depot_photos" ON public.depot_photos;
CREATE POLICY "Tenant isolation for depot_photos" ON public.depot_photos
    FOR ALL TO authenticated
    USING (company_id = public.get_current_user_company_id() OR company_id IS NULL)
    WITH CHECK (company_id = public.get_current_user_company_id() OR company_id IS NULL);
