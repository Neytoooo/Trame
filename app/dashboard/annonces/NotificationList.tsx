'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Bell,
    ShoppingCart,
    Info,
    CheckCircle,
    AlertTriangle,
    Package,
    Truck,
    Sparkles,
    FileText,
    ArrowRight,
    Smartphone
} from 'lucide-react'
import { markAsRead, confirmOrder } from '@/app/actions/notifications'
import { confirmMaterialOrder } from '@/app/actions/workflowEngine'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    status: string
    data: any
    created_at: string
}

export default function NotificationList({ initialNotifications }: { initialNotifications: Notification[] }) {
    const router = useRouter()
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

    // REALTIME SUBSCRIPTION
    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel('realtime-notifications')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    console.log('🔔 [NOTIF REALTIME] Payload Received:', payload)
                    if (payload.eventType === 'INSERT') {
                        console.log('🔔 [NOTIF REALTIME] INSERT EVENT -> Adding to list')
                        setNotifications((prev) => [payload.new as Notification, ...prev])
                    } else if (payload.eventType === 'UPDATE') {
                        console.log('🔔 [NOTIF REALTIME] UPDATE EVENT')
                        setNotifications((prev) => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n))
                    } else if (payload.eventType === 'DELETE') {
                        console.log('🔔 [NOTIF REALTIME] DELETE EVENT')
                        setNotifications((prev) => prev.filter(n => n.id !== payload.old.id))
                    }
                    console.log('🔔 [NOTIF REALTIME] Refreshing Router...')
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router])

    const handleRead = async (id: string) => {
        setNotifications((prev) => prev.map(n => n.id === id ? { ...n, status: 'read' } : n))
        await markAsRead(id)
        router.refresh()
    }

    const handleConfirmOrder = async (n: Notification) => {
        if (!n.data?.articleId) return
        setLoadingId(n.id)
        await confirmOrder(n.id, n.data.articleId, n.data.quantity || 1)
        setLoadingId(null)
        router.refresh()
        alert("Commande confirmée avec succès !")
    }

    const handleMaterialConfirm = async (n: Notification) => {
        if (!n.data?.node_id) return
        setLoadingId(n.id)

        const res = await confirmMaterialOrder(n.data.node_id, n.id)

        setLoadingId(null)
        router.refresh()

        if (res?.success) {
            alert("✅ Commande validée ! L'étape va passer au vert.")
        } else {
            alert("❌ Erreur lors de la validation.")
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'new_mobile_devis': return <Sparkles className="text-violet-400" size={20} />
            case 'order_confirmation': return <ShoppingCart className="text-purple-400" size={20} />
            case 'low_stock': return <AlertTriangle className="text-orange-400" size={20} />
            case 'material_request': return <Truck className="text-blue-400" size={20} />
            case 'automation_start': return <CheckCircle className="text-emerald-400" size={20} />
            default: return <Info className="text-blue-400" size={20} />
        }
    }

    const getBgColor = (type: string) => {
        switch (type) {
            case 'new_mobile_devis': return 'bg-violet-950/20 border-violet-500/30 hover:border-violet-500/50'
            case 'order_confirmation': return 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40'
            case 'low_stock': return 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40'
            case 'material_request': return 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40'
            case 'automation_start': return 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40'
            default: return 'bg-white/5 border-white/10 hover:border-white/20'
        }
    }

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                <Package className="text-gray-600 mb-4" size={48} />
                <p className="text-gray-400 text-lg">Aucune notification pour le moment</p>
                <p className="text-xs text-gray-500 mt-1">Les devis générés depuis KOTA Mobile s'afficheront ici en temps réel.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {notifications.map((n) => {
                const isMobileDevis = n.type === 'new_mobile_devis'
                const devisUrl = n.data?.url || (n.data?.devis_id ? `/dashboard/devis/${n.data.devis_id}/edit` : '/dashboard/devis')

                return (
                    <div
                        key={n.id}
                        className={`relative overflow-hidden rounded-2xl border p-5 md:p-6 transition-all hover:scale-[1.008] ${getBgColor(n.type)} ${n.status === 'read' ? 'opacity-70' : 'opacity-100 shadow-lg shadow-black/20'}`}
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-white/5 shrink-0 flex items-center justify-center">
                                {getIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap justify-between items-start gap-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base md:text-lg font-bold text-white tracking-tight">{n.title}</h3>
                                        {isMobileDevis && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                                <Smartphone size={10} />
                                                KOTA Mobile IA
                                            </span>
                                        )}
                                        {n.status === 'unread' && (
                                            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">
                                        {new Date(n.created_at).toLocaleDateString('fr-FR', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">{n.message}</p>

                                {/* Action Buttons for Mobile Devis */}
                                {isMobileDevis && (
                                    <div className="mt-4 flex flex-wrap items-center gap-3">
                                        <Link
                                            href={devisUrl}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <FileText size={14} />
                                            <span>Ouvrir et chiffrer le devis ({n.data?.reference || 'Voir'})</span>
                                            <ArrowRight size={13} />
                                        </Link>

                                        {n.status === 'unread' && (
                                            <button
                                                onClick={() => handleRead(n.id)}
                                                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/5 font-medium"
                                            >
                                                Marquer comme lu
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Action Button for Orders */}
                                {n.type === 'order_confirmation' && n.status !== 'archived' && (
                                    <div className="mt-4 flex gap-3">
                                        <button
                                            onClick={() => handleConfirmOrder(n)}
                                            disabled={loadingId === n.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
                                        >
                                            {loadingId === n.id ? "Traitement..." : "Confirmer la commande"}
                                        </button>
                                    </div>
                                )}

                                {/* Action Button for Material Requests */}
                                {n.type === 'material_request' && n.status !== 'archived' && (
                                    <div className="mt-4 flex gap-3">
                                        <button
                                            onClick={() => handleMaterialConfirm(n)}
                                            disabled={loadingId === n.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                                        >
                                            <Truck size={16} />
                                            {loadingId === n.id ? "Validation..." : "Confirmer la commande"}
                                        </button>
                                    </div>
                                )}

                                {/* Mark as read button standard */}
                                {n.status === 'unread' && !isMobileDevis && n.type !== 'order_confirmation' && n.type !== 'material_request' && (
                                    <button
                                        onClick={() => handleRead(n.id)}
                                        className="mt-4 text-xs text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                                    >
                                        Marquer comme lu
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
