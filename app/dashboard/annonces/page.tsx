import { createClient, getCachedUser } from '@/utils/supabase/server'
import { Bell, ShoppingCart, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import NotificationList from './NotificationList'

export const dynamic = 'force-dynamic'

export default async function AnnoncesPage() {
    const supabase = await createClient()
    const user = await getCachedUser()

    // En production, utiliser l'action getNotifications, mais ici on peut fetch direct server-side
    console.log("🔍 [ANNONCES PAGE] Current User ID:", user?.id)
    console.log("🌍 [ANNONCES PAGE] Fetching GLOBAL notifications (no user filter)")

    const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        // .eq('user_id', user?.id)  <-- REMOVED to show ALL notifications
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) console.error("❌ [ANNONCES PAGE] Fetch Error:", error)
    console.log("🔍 [ANNONCES PAGE] Fetched Notifications:", notifications?.length)

    return (
        <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
            <div className="shrink-0 flex items-center gap-4 pb-4">
                <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20">
                    <Bell className="text-blue-500" size={32} />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Annonces & Alertes</h1>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400 font-medium">Consultez vos notifications et confirmez vos commandes automatiques.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-10">
                <NotificationList initialNotifications={notifications || []} />
            </div>
        </div>
    )
}
