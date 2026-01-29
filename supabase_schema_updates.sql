-- 1. Updates for 'devis_items' table (Métré & Sections)
ALTER TABLE devis_items 
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'item' CHECK (item_type IN ('item', 'section'));

-- 2. Create 'company_settings' table
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    address TEXT,
    siret TEXT,
    email TEXT,
    phone TEXT,
    logo_url TEXT,
    footer_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. RLS Policies for company_settings
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" 
ON company_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
ON company_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON company_settings FOR UPDATE 
USING (auth.uid() = user_id);
