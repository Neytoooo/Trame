'use client'

import { useState, useEffect } from 'react'
import { Bell, ShoppingCart, Info, CheckCircle, AlertTriangle, Package, Truck } from 'lucide-react'
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
            case 'order_confirmation': return <ShoppingCart className="text-purple-400" />
            case 'low_stock': return <AlertTriangle className="text-orange-400" />
            case 'material_request': return <Truck className="text-blue-400" />
            case 'automation_start': return <CheckCircle className="text-emerald-400" />
            default: return <Info className="text-blue-400" />
        }
    }

    const getBgColor = (type: string) => {
        switch (type) {
            case 'order_confirmation': return 'bg-purple-500/10 border-purple-500/20'
            case 'low_stock': return 'bg-orange-500/10 border-orange-500/20'
            case 'material_request': return 'bg-blue-500/10 border-blue-500/20'
            case 'automation_start': return 'bg-emerald-500/10 border-emerald-500/20'
            default: return 'bg-white/5 border-white/10'
        }
    }

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                <Package className="text-gray-600 mb-4" size={48} />
                <p className="text-gray-400 text-lg">Aucune notification pour le moment</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {notifications.map((n) => (
                <div
                    key={n.id}
                    className={`relative overflow-hidden rounded-2xl border p-6 transition-all hover:scale-[1.01] ${getBgColor(n.type)} ${n.status === 'read' ? 'opacity-60' : 'opacity-100'}`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-white/5`}>
                            {getIcon(n.type)}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold text-white">{n.title}</h3>
                                <span className="text-xs text-gray-500">{new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-400 mt-1">{n.message}</p>

                            {/* Action Button for Orders */}
                            {n.type === 'order_confirmation' && n.status !== 'archived' && (
                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={() => handleConfirmOrder(n)}
                                        disabled={loadingId === n.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-purple-500/20 transition-all"
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
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/20 transition-all"
                                    >
                                        <Truck size={16} />
                                        {loadingId === n.id ? "Validation..." : "Confirmer la commande"}
                                    </button>
                                </div>
                            )}

                            {/* Mark as read button */}
                            {n.status === 'unread' && n.type !== 'order_confirmation' && n.type !== 'material_request' && (
                                <button
                                    onClick={() => handleRead(n.id)}
                                    className="mt-4 text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                    Marquer comme lu
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
