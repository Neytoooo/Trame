import { createClient, getCachedUser } from '@/utils/supabase/server'
import { Bell } from 'lucide-react'
import NotificationList from './NotificationList'
import { getMobileNotifications } from '@/lib/mobileDevisStore'

export const dynamic = 'force-dynamic'

export default async function AnnoncesPage() {
    const supabase = await createClient()
    const user = await getCachedUser()

    let dbNotifications: any[] = []
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .neq('status', 'archived')
            .order('created_at', { ascending: false })
            .limit(50)

        if (data) dbNotifications = data
        if (error) console.error("❌ [ANNONCES PAGE] Fetch Error:", error)
    } catch (e) {
        console.warn('Erreur chargement notifications Supabase:', e)
    }

    // Fusion avec les notifications de l'application mobile KOTA
    const localMobileNotifs = getMobileNotifications()
    const seenIds = new Set(dbNotifications.map(n => n.id))
    const mergedNotifications = [...dbNotifications]

    for (const m of localMobileNotifs) {
        if (!seenIds.has(m.id)) {
            mergedNotifications.push(m)
        }
    }

    mergedNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return (
        <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
            <div className="shrink-0 flex items-center gap-4 pb-4">
                <div className="p-3 bg-violet-600/10 rounded-2xl border border-violet-600/20">
                    <Bell className="text-violet-500" size={32} />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Annonces & Notifications</h1>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400 font-medium">Consultez les devis créés via le smartphone et confirmez vos commandes BTP.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-10">
                <NotificationList initialNotifications={mergedNotifications} />
            </div>
        </div>
    )
}
