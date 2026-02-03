import { createClient } from '@/utils/supabase/server'
import NewChantierModal from '@/components/dashboard/NewChantierModal'
import { MapPin, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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
                    <h1 className="text-3xl font-bold text-white">Chantiers en cours</h1>
                    <p className="text-gray-400">Suivez l'avancement et la rentabilité de vos projets.</p>
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
                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-blue-500/50 hover:bg-white/10"
                        >
                            {/* Badge Status */}
                            <div className="mb-4 flex justify-between items-start">
                                <span className={`rounded-full px-3 py-1 text-xs font-medium border ${chantier.status === 'en_cours' ? 'border-green-500/20 bg-green-500/10 text-green-400' :
                                    chantier.status === 'etude' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                                        chantier.status === 'annule' ? 'border-red-500/20 bg-red-500/10 text-red-400' :
                                            'border-gray-500/20 bg-gray-500/10 text-gray-400'
                                    }`}>
                                    {chantier.status === 'en_cours' ? 'En cours' :
                                        chantier.status === 'etude' ? 'En étude' :
                                            chantier.status === 'annule' ? 'Annulé' : 'Terminé'}
                                </span>
                                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <ArrowRight size={16} />
                                </div>
                            </div>

                            {/* Titre et Client */}
                            <h3 className="text-xl font-bold text-white mb-1">{chantier.name}</h3>
                            <p className="text-sm text-gray-400 mb-6">Client : <span className="text-gray-300">{chantier.clients?.name}</span></p>

                            {/* Automation Progress */}
                            {hasAutomation && (
                                <div className="mb-6">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400">Automatisation</span>
                                        <span className={`font-semibold ${progress === 100 ? 'text-green-400' : 'text-blue-400'}`}>{progress}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Footer Infos */}
                            <div className="flex items-center gap-4 border-t border-white/5 pt-4 text-xs text-gray-500">
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
                    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-12 text-gray-500">
                        <p>Aucun chantier pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    )
}