-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    type TEXT NOT NULL, -- 'automation_start', 'low_stock', 'order_confirmation'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread', -- 'unread', 'read', 'archived'
    data JSONB DEFAULT '{}'::jsonb, -- Stores context like chantier_id, article_id, quantity
    created_at TIMESTAMP WITH TIME ZONE DEFAULt timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can insert notifications (via server actions/triggers)
CREATE POLICY "Users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);
