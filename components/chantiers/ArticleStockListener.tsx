'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { checkWorkflowIntegrity } from '@/app/actions/workflowEngine'

export default function ArticleStockListener({ chantierId }: { chantierId: string }) {
    const router = useRouter()

    useEffect(() => {
        const supabase = createClient()
        console.log("📡 [STOCK LISTENER] Initialized for Chantier:", chantierId)

        const channel = supabase
            .channel('realtime-stock-listener')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'articles' },
                async (payload) => {
                    console.log('📦 [STOCK UPDATE DETECTED]', payload)
                    console.log('🔄 Triggering Workflow Integrity Check...')

                    // Trigger Server Action
                    await checkWorkflowIntegrity(chantierId)

                    // Refresh UI
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [chantierId, router])

    return null // Invisible component
}
