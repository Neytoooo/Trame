import { createClient } from '@/utils/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import SuiviGraph from '@/components/chantiers/SuiviGraph'

export default async function ChantierSuiviPage({ params }: { params: Promise<{ id: string }> }) {
    // Await params for Next.js 15+
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="h-screen flex flex-col p-6 space-y-6">
            <div className="flex items-center justify-between">
                <Link href={`/dashboard/chantiers/${id}`} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={16} />
                    Retour au détail
                </Link>
                <h1 className="text-xl font-bold text-white">Suivi Interactif</h1>
            </div>

            {/* Graph Canvas */}
            <div className="flex-1 min-h-0">
                <SuiviGraph chantierId={id} user={user} />
            </div>
        </div>
    )
}
