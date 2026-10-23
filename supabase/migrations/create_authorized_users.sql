-- =========================================================================
-- MIGRATION: GESTION DES UTILISATEURS AUTORISÉS & CONTRÔLE D'ACCÈS (WHITELIST)
-- =========================================================================

-- 1. TABLE DES UTILISATEURS AUTORISÉS
CREATE TABLE IF NOT EXISTS public.authorized_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'charge_affaires'
        CHECK (role IN ('admin', 'charge_affaires', 'metreur', 'conducteur_travaux', 'chef_chantier', 'comptabilite')),
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'invite'
        CHECK (status IN ('actif', 'invite', 'suspendu')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour recherche rapide et insensible à la casse par email
CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON public.authorized_users(lower(email));
CREATE INDEX IF NOT EXISTS idx_authorized_users_role ON public.authorized_users(role);
CREATE INDEX IF NOT EXISTS idx_authorized_users_status ON public.authorized_users(status);

-- RLS (Sécurité au niveau des lignes)
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'authorized_users' AND policyname = 'Authenticated users can read authorized_users'
    ) THEN
        CREATE POLICY "Authenticated users can read authorized_users" ON public.authorized_users
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'authorized_users' AND policyname = 'Authenticated users can manage authorized_users'
    ) THEN
        CREATE POLICY "Authenticated users can manage authorized_users" ON public.authorized_users
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 2. INSERTION DES COMPTES TESTS PROFESSIONNELS BTP
INSERT INTO public.authorized_users (email, role, status, first_name, last_name, phone)
VALUES
    ('mattiskhn@gmail.com', 'admin', 'actif', 'Mattis', 'Khn', '06 12 34 56 78'),
    ('mattiskhn2@gmail.com', 'metreur', 'actif', 'Mattis', 'Khn (Second)', '06 98 76 54 32'),
    ('thomas.laurent@trame-btp.fr', 'charge_affaires', 'actif', 'Thomas', 'Laurent', '06 45 12 89 23'),
    ('sophie.martinez@trame-btp.fr', 'conducteur_travaux', 'actif', 'Sophie', 'Martinez', '06 78 45 12 90'),
    ('nicolas.dupuis@trame-btp.fr', 'chef_chantier', 'actif', 'Nicolas', 'Dupuis', '06 33 21 87 65'),
    ('claire.bernard@trame-btp.fr', 'comptabilite', 'actif', 'Claire', 'Bernard', '06 54 89 63 21')
ON CONFLICT (email) DO UPDATE 
SET role = EXCLUDED.role, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name;
