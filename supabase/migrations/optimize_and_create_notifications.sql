-- 1. Create Notifications Table (if not exists)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    type TEXT NOT NULL, -- 'automation_start', 'low_stock', 'order_confirmation'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread', -- 'unread', 'read', 'archived'
    data JSONB DEFAULT '{}'::jsonb, -- Stores context like chantier_id, article_id, quantity
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add Indexes for Performance (Optimization)
-- Index for Notifications by User (Dashboard query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);

-- Index for Articles Search (Used in Article List & Modal)
CREATE INDEX IF NOT EXISTS idx_articles_name_lower ON public.articles (lower(name));
CREATE INDEX IF NOT EXISTS idx_articles_reference ON public.articles (lower(reference));

-- Index for Clients Search (Used in NewChantier & Devis)
CREATE INDEX IF NOT EXISTS idx_clients_name_lower ON public.clients (lower(name));

-- Index for Chantiers (Used frequently)
CREATE INDEX IF NOT EXISTS idx_chantiers_client_id ON public.chantiers(client_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_status ON public.chantiers(status);

-- 3. Security Policies (RLS) for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
        CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications') THEN
        CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can insert notifications') THEN
        CREATE POLICY "Users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
