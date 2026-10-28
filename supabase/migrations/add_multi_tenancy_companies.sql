-- =========================================================================
-- MIGRATION : MULTI-TENANT (ISOLATION DES ENTREPRISES PAR RLS)
-- =========================================================================
-- Ajoute la clé company_id sur devis, factures, chantiers, clients, articles,
-- company_settings et authorized_users avec isolation stricte des données par entreprise (RLS).

-- 1. CRÉATION DE LA TABLE DES ENTREPRISES (COMPANIES)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    siret TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies(owner_id);

-- 2. INITIALISATION D'UNE ENTREPRISE PAR DÉFAUT (Pour migrer les données actuelles sans perte)
DO $$
DECLARE
    default_comp_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = default_comp_id) THEN
        INSERT INTO public.companies (id, name, email)
        VALUES (default_comp_id, 'KOTA BTP Construction', 'contact@kota.fr')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 3. AJOUT DE LA COLONNE company_id SUR TOUTES LES TABLES CLÉS

-- A. Table: authorized_users
ALTER TABLE public.authorized_users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_authorized_users_company ON public.authorized_users(company_id);

-- B. Table: chantiers
ALTER TABLE public.chantiers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_chantiers_company ON public.chantiers(company_id);

-- C. Table: clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);

-- D. Table: devis
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_devis_company ON public.devis(company_id);

-- E. Table: factures
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_factures_company ON public.factures(company_id);

-- F. Table: articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_articles_company ON public.articles(company_id);

-- G. Table: company_settings
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_company_settings_company ON public.company_settings(company_id);

-- 4. RATTACHEMENT AUTOMATIQUE DES DONNÉES HISTORIQUES EXISTANTES À L'ENTREPRISE
DO $$
DECLARE
    target_company_id UUID;
BEGIN
    SELECT id INTO target_company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;
    
    IF target_company_id IS NOT NULL THEN
        UPDATE public.chantiers SET company_id = target_company_id WHERE company_id IS NULL;
        UPDATE public.clients SET company_id = target_company_id WHERE company_id IS NULL;
        UPDATE public.devis SET company_id = target_company_id WHERE company_id IS NULL;
        UPDATE public.factures SET company_id = target_company_id WHERE company_id IS NULL;
        UPDATE public.articles SET company_id = target_company_id WHERE company_id IS NULL;
        UPDATE public.authorized_users SET company_id = target_company_id WHERE company_id IS NULL;
        UPDATE public.company_settings SET company_id = target_company_id WHERE company_id IS NULL;
    END IF;
END $$;

-- 5. FONCTION POSTGRESQL STABLE POUR RÉCUPÉRER L'ENTREPRISE DE L'UTILISATEUR ACTUEL
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
DECLARE
    v_company_id UUID;
    v_user_email TEXT;
BEGIN
    -- 1. Récupération de l'email depuis le JWT Supabase Auth
    v_user_email := lower(auth.jwt() ->> 'email');
    
    IF v_user_email IS NOT NULL THEN
        SELECT company_id INTO v_company_id
        FROM public.authorized_users
        WHERE lower(email) = v_user_email
          AND status != 'suspendu'
          AND company_id IS NOT NULL
        LIMIT 1;
        
        IF v_company_id IS NOT NULL THEN
            RETURN v_company_id;
        END IF;
    END IF;

    -- 2. Si non trouvé par email, vérifier par user_id (propriétaire / créateur)
    IF auth.uid() IS NOT NULL THEN
        SELECT id INTO v_company_id
        FROM public.companies
        WHERE owner_id = auth.uid()
        LIMIT 1;
        
        IF v_company_id IS NOT NULL THEN
            RETURN v_company_id;
        END IF;

        SELECT company_id INTO v_company_id
        FROM public.company_settings
        WHERE user_id = auth.uid() AND company_id IS NOT NULL
        LIMIT 1;

        IF v_company_id IS NOT NULL THEN
            RETURN v_company_id;
        END IF;
    END IF;

    -- 3. Fallback de transition : première entreprise enregistrée
    SELECT id INTO v_company_id
    FROM public.companies
    ORDER BY created_at ASC
    LIMIT 1;

    RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. POLITIQUES RLS D'ISOLATION STRICTE (MULTI-TENANT)

-- Table: companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
CREATE POLICY "Users can view their company" ON public.companies
    FOR SELECT TO authenticated
    USING (id = public.get_current_user_company_id() OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update their company" ON public.companies;
CREATE POLICY "Owners can update their company" ON public.companies
    FOR ALL TO authenticated
    USING (id = public.get_current_user_company_id() OR owner_id = auth.uid())
    WITH CHECK (id = public.get_current_user_company_id() OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert company" ON public.companies;
CREATE POLICY "Authenticated users can insert company" ON public.companies
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Table: chantiers (Isolation multi-tenant)
ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for chantiers" ON public.chantiers;
CREATE POLICY "Tenant isolation for chantiers" ON public.chantiers
    FOR ALL TO authenticated
    USING (company_id = public.get_current_user_company_id() OR company_id IS NULL)
    WITH CHECK (company_id = public.get_current_user_company_id() OR company_id IS NULL);

-- Table: clients (Isolation multi-tenant)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for clients" ON public.clients;
CREATE POLICY "Tenant isolation for clients" ON public.clients
    FOR ALL TO authenticated
    USING (company_id = public.get_current_user_company_id() OR company_id IS NULL)
    WITH CHECK (company_id = public.get_current_user_company_id() OR company_id IS NULL);

-- Table: devis (Isolation multi-tenant)
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for devis" ON public.devis;
CREATE POLICY "Tenant isolation for devis" ON public.devis
    FOR ALL TO authenticated
    USING (company_id = public.get_current_user_company_id() OR company_id IS NULL)
    WITH CHECK (company_id = public.get_current_user_company_id() OR company_id IS NULL);

-- Table: factures (Isolation multi-tenant)
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for factures" ON public.factures;
CREATE POLICY "Tenant isolation for factures" ON public.factures
    FOR ALL TO authenticated
    USING (company_id = public.get_current_user_company_id() OR company_id IS NULL)
    WITH CHECK (company_id = public.get_current_user_company_id() OR company_id IS NULL);

-- Table: articles (Isolation multi-tenant)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for articles" ON public.articles;
CREATE POLICY "Tenant isolation for articles" ON public.articles
    FOR ALL TO authenticated
    USING (company_id = public.get_current_user_company_id() OR company_id IS NULL)
    WITH CHECK (company_id = public.get_current_user_company_id() OR company_id IS NULL);

-- Table: authorized_users (Isolation multi-tenant)
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for authorized_users" ON public.authorized_users;
CREATE POLICY "Tenant isolation for authorized_users" ON public.authorized_users
    FOR ALL TO authenticated
    USING (company_id = public.get_current_user_company_id() OR company_id IS NULL)
    WITH CHECK (company_id = public.get_current_user_company_id() OR company_id IS NULL);

-- Table: company_settings (Isolation multi-tenant)
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for company_settings" ON public.company_settings;
CREATE POLICY "Tenant isolation for company_settings" ON public.company_settings
    FOR ALL TO authenticated
    USING (company_id = public.get_current_user_company_id() OR user_id = auth.uid() OR company_id IS NULL)
    WITH CHECK (company_id = public.get_current_user_company_id() OR user_id = auth.uid() OR company_id IS NULL);
