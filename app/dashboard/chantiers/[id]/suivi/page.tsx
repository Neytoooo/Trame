import { getCachedUser } from '@/utils/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import SuiviGraph from '@/components/chantiers/SuiviGraph'

export default async function ChantierSuiviPage({ params }: { params: Promise<{ id: string }> }) {
    // Await params for Next.js 15+
    const { id } = await params
    const user = await getCachedUser()

    return (
        <div className="h-full flex flex-col space-y-4 overflow-hidden">
            <div className="shrink-0 flex items-center justify-between">
                <Link href={`/dashboard/chantiers/${id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">
                    <ArrowLeft size={16} />
                    Retour au détail
                </Link>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Suivi Interactif</h1>
            </div>

            {/* Graph Canvas */}
            <div className="flex-1 min-h-0">
                <SuiviGraph chantierId={id} user={user} />
            </div>
        </div>
    )
}
