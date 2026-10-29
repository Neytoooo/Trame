-- =========================================================================
-- MIGRATION: DÉPÔT PHOTOS DE CHANTIER (SYNCHRONISATION CLOUD VERCEL & LOCAL)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.depot_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Photo de chantier',
    devis_id UUID,
    devis_reference TEXT,
    chantier_id UUID,
    chantier_name TEXT NOT NULL DEFAULT 'Chantier',
    client_name TEXT NOT NULL DEFAULT 'Client',
    category TEXT NOT NULL DEFAULT 'constat',
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    notes TEXT,
    file_size INT DEFAULT 0,
    device_info TEXT DEFAULT 'KOTA Mobile (Smartphone)',
    company_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour recherche et tri ultra-rapide
CREATE INDEX IF NOT EXISTS idx_depot_photos_devis_ref ON public.depot_photos(devis_reference);
CREATE INDEX IF NOT EXISTS idx_depot_photos_created_at ON public.depot_photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_depot_photos_company_id ON public.depot_photos(company_id);

-- Sécurité RLS ouverte pour synchronisation fluide Vercel, Local et Smartphone
ALTER TABLE public.depot_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select depot_photos" ON public.depot_photos;
CREATE POLICY "Allow select depot_photos" ON public.depot_photos
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert depot_photos" ON public.depot_photos;
CREATE POLICY "Allow insert depot_photos" ON public.depot_photos
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update depot_photos" ON public.depot_photos;
CREATE POLICY "Allow update depot_photos" ON public.depot_photos
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete depot_photos" ON public.depot_photos;
CREATE POLICY "Allow delete depot_photos" ON public.depot_photos
    FOR DELETE USING (true);
