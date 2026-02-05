-- 1. Make user_id nullable to allow "Global" notifications
ALTER TABLE public.notifications ALTER COLUMN user_id DROP NOT NULL;

-- 2. Allow everyone to READ everything (Global Shared Inbox)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;
CREATE POLICY "Enable read access for all users" ON public.notifications
    FOR SELECT
    TO authenticated
    USING (true);

-- 3. Allow everyone to INSERT (already done partially, but reinforcing)
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON public.notifications;
CREATE POLICY "Enable insert for all authenticated users" ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 4. Allow everyone to UPDATE (to mark as read/archived)
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON public.notifications;
CREATE POLICY "Enable update for all authenticated users" ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (true);
