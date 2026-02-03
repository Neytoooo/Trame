import { createClient } from '@/utils/supabase/server'
import NewChantierModal from '@/components/dashboard/NewChantierModal'
import { MapPin, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

export default async function ChantiersPage() {
    const supabase = await createClient()

    // 1. On récupère les chantiers ET le nom du client associé (Jointure) ET les nœuds pour le calcul
    const { data: chantiers } = await supabase
        .from('chantiers')
        .select(`
            *,
            clients(name),
            chantier_nodes(status, type)
        `)
        .order('created_at', { ascending: false })

    // 2. On récupère la liste simple des clients pour le formulaire
    const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .order('name')

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chantiers en cours</h1>
                    <p className="text-gray-500 dark:text-gray-400">Suivez l'avancement et la rentabilité de vos projets.</p>
                </div>
                {/* On passe la liste des clients au composant client */}
                <NewChantierModal clients={clients || []} />
            </div>

            {/* Grille des chantiers */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {chantiers?.map((chantier: any) => {
                    // Calcul de l'avancement
                    const nodes = chantier.chantier_nodes || []
                    const relevantNodes = nodes.filter((n: any) => n.type !== 'start') // On ignore le nœud de départ
                    const totalNodes = relevantNodes.length
                    const doneNodes = relevantNodes.filter((n: any) => n.status === 'done').length
                    const progress = totalNodes > 0 ? Math.round((doneNodes / totalNodes) * 100) : 0
                    const hasAutomation = totalNodes > 0

                    return (
                        <Link
                            key={chantier.id}
                            href={`/dashboard/chantiers/${chantier.id}`} // Lien vers le détail (à faire plus tard)
                            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500/50 hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                        >
                            {/* Badge Status */}
                            <div className="mb-4 flex justify-between items-start">
                                <Badge variant={
                                    (chantier.status === 'en_cours' ? 'success' :
                                        chantier.status === 'etude' ? 'info' :
                                            chantier.status === 'annule' ? 'error' : 'gray') as any
                                }>
                                    {chantier.status === 'en_cours' ? 'En cours' :
                                        chantier.status === 'etude' ? 'En étude' :
                                            chantier.status === 'annule' ? 'Annulé' : 'Terminé'}
                                </Badge>
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-colors dark:bg-white/10 dark:text-gray-400">
                                    <ArrowRight size={16} />
                                </div>
                            </div>

                            {/* Titre et Client */}
                            <h3 className="text-xl font-bold text-gray-900 mb-1 dark:text-white">{chantier.name}</h3>
                            <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">Client : <span className="text-gray-700 font-medium dark:text-gray-300">{chantier.clients?.name}</span></p>

                            {/* Automation Progress */}
                            {hasAutomation && (
                                <div className="mb-6">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500 dark:text-gray-400">Automatisation</span>
                                        <span className={`font-semibold ${progress === 100 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>{progress}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden dark:bg-white/10">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Footer Infos */}
                            <div className="flex items-center gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-white/5 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    {chantier.address_line1 || 'Non renseigné'}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {chantier.date_debut || '--/--/----'}
                                </div>
                            </div>
                        </Link>
                    )
                })}

                {/* Carte vide si aucun chantier */}
                {(!chantiers || chantiers.length === 0) && (
                    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-gray-500 dark:border-white/10 dark:text-gray-400">
                        <p>Aucun chantier pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    )
}