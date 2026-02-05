import { createClient } from '@/utils/supabase/server'
import { Bell, ShoppingCart, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import NotificationList from './NotificationList'

export const dynamic = 'force-dynamic'

export default async function AnnoncesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // En production, utiliser l'action getNotifications, mais ici on peut fetch direct server-side
    console.log("🔍 [ANNONCES PAGE] Current User ID:", user?.id)
    console.log("🌍 [ANNONCES PAGE] Fetching GLOBAL notifications (no user filter)")

    const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        // .eq('user_id', user?.id)  <-- REMOVED to show ALL notifications
        .neq('status', 'archived')
        .order('created_at', { ascending: false })

    if (error) console.error("❌ [ANNONCES PAGE] Fetch Error:", error)
    console.log("🔍 [ANNONCES PAGE] Fetched Notifications:", notifications?.length)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20">
                    <Bell className="text-blue-500" size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Annonces & Alertes</h1>
                    <p className="text-gray-500 dark:text-gray-400">Consultez vos notifications et confirmez vos commandes automatiques.</p>
                </div>
            </div>

            <NotificationList initialNotifications={notifications || []} />
        </div>
    )
}
