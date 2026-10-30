-- =========================================================================
-- MIGRATION: PLANNING DES INTERVENTIONS (SYNCHRONISATION CLOUD VERCEL, LOCAL & SMARTPHONE)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.planning_interventions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Intervention',
    chantier_name TEXT NOT NULL DEFAULT 'Chantier',
    client_name TEXT NOT NULL DEFAULT 'Client',
    address TEXT DEFAULT '',
    technicien TEXT NOT NULL DEFAULT 'Technicien',
    zone TEXT DEFAULT 'Île-de-France',
    date TEXT NOT NULL, -- Format "YYYY-MM-DD"
    start_time TEXT NOT NULL DEFAULT '08:00', -- Format "HH:MM"
    end_time TEXT NOT NULL DEFAULT '12:00',   -- Format "HH:MM"
    color TEXT DEFAULT 'blue',
    status TEXT NOT NULL DEFAULT 'planifie',
    notes TEXT DEFAULT '',
    chantier_id TEXT,
    client_id TEXT,
    user_id TEXT,
    company_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour recherche rapide et tri par date
CREATE INDEX IF NOT EXISTS idx_planning_interventions_date ON public.planning_interventions(date);
CREATE INDEX IF NOT EXISTS idx_planning_interventions_status ON public.planning_interventions(status);
CREATE INDEX IF NOT EXISTS idx_planning_interventions_technicien ON public.planning_interventions(technicien);
CREATE INDEX IF NOT EXISTS idx_planning_interventions_company_id ON public.planning_interventions(company_id);

-- Activation RLS ouverte pour synchro universelle (Web Vercel, Local & Smartphone KOTA Mobile)
ALTER TABLE public.planning_interventions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select planning_interventions" ON public.planning_interventions;
CREATE POLICY "Allow select planning_interventions" ON public.planning_interventions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert planning_interventions" ON public.planning_interventions;
CREATE POLICY "Allow insert planning_interventions" ON public.planning_interventions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update planning_interventions" ON public.planning_interventions;
CREATE POLICY "Allow update planning_interventions" ON public.planning_interventions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete planning_interventions" ON public.planning_interventions;
CREATE POLICY "Allow delete planning_interventions" ON public.planning_interventions FOR DELETE USING (true);
