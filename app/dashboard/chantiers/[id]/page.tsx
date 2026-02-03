import { createClient } from '@/utils/supabase/server'
import { createEmptyDevis } from '@/app/actions/devis'
import { notFound } from 'next/navigation'
import {
    MapPin,
    Calendar,
    User,
    Phone,
    Mail,
    FileText,
    Plus,
    ArrowLeft,
    Briefcase
} from 'lucide-react'
import Link from 'next/link'
import ChantierStatusSelect from '@/components/chantiers/ChantierStatusSelect'

function getDevisStatusLabel(status: string) {
    switch (status) {
        case 'brouillon': return 'Brouillon'
        case 'en_attente': return 'En préparation'
        case 'en_attente_approbation': return 'Approbation'
        case 'valide': return 'Validé'
        case 'refuse': return 'Refusé'
        default: return status?.replace(/_/g, ' ')
    }
}

function getDevisStatusColor(status: string) {
    switch (status) {
        case 'brouillon': return 'border-gray-500/20 bg-gray-500/10 text-gray-400'
        case 'en_attente': return 'border-blue-500/20 bg-blue-500/10 text-blue-400'
        case 'en_attente_approbation': return 'border-green-500/20 bg-green-500/10 text-green-400'
        case 'valide': return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
        case 'refuse': return 'border-red-500/20 bg-red-500/10 text-red-400'
        default: return 'border-gray-500/20 bg-gray-500/10 text-gray-400'
    }
}

// Cette fonction reçoit l'ID depuis l'URL (ex: /dashboard/chantiers/123-abc)
export default async function ChantierDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. On récupère le chantier ET le client associé
    const { data: chantier, error } = await supabase
        .from('chantiers')
        .select('*, clients(*)') // La magie de Supabase : on récupère tout le client lié
        .eq('id', id)
        .single()
    // 2. On récupère les devis associés au chantier
    const { data: devisList } = await supabase
        .from('devis')
        .select('*')
        .eq('chantier_id', id)
        .order('created_at', { ascending: false })

    // 3. On récupère les factures associées au chantier
    const { data: facturesList } = await supabase
        .from('factures')
        .select('*')
        .eq('chantier_id', id)
        .order('created_at', { ascending: false })

    if (error || !chantier) {
        return notFound() // Affiche une page 404 si l'ID n'existe pas
    }

    function getFactureStatusLabel(status: string) {
        switch (status) {
            case 'brouillon': return 'Brouillon'
            case 'en_attente': return 'En attente'
            case 'payee': return 'Payée'
            case 'retard': return 'En retard'
            default: return status
        }
    }

    function getFactureStatusColor(status: string) {
        switch (status) {
            case 'brouillon': return 'border-gray-500/20 bg-gray-500/10 text-gray-400'
            case 'en_attente': return 'border-orange-500/20 bg-orange-500/10 text-orange-400'
            case 'payee': return 'border-green-500/20 bg-green-500/10 text-green-400'
            case 'retard': return 'border-red-500/20 bg-red-500/10 text-red-400'
            default: return 'border-gray-500/20 bg-gray-500/10 text-gray-400'
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* --- HEADER --- */}
            <div>
                <Link href="/dashboard/chantiers" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-white">
                    <ArrowLeft size={16} />
                    Retour aux chantiers
                </Link>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{chantier.name}</h1>
                            <div className="inline-block relative z-10">
                                <ChantierStatusSelect id={chantier.id} currentStatus={chantier.status} />
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1"><MapPin size={14} /> {chantier.address_line1 || 'Adresse non renseignée'}</span>
                            <span className="flex items-center gap-1"><Calendar size={14} /> Début : {chantier.date_debut || 'Non planifié'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/dashboard/chantiers/${id}/suivi`}
                            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        >
                            <Briefcase size={18} />
                            Voir le Suivi
                        </Link>
                        <form action={async () => {
                            'use server'
                            await createEmptyDevis(id) // id vient de tes params récupérés au début
                        }}>
                            <button type="submit" className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all hover:scale-105">
                                <Plus size={18} />
                                Créer un Devis
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* --- COLONNE GAUCHE : INFO CLIENT (Carte Bento) --- */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-md">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                            <User size={20} className="text-blue-600 dark:text-blue-400" />
                            Client
                        </h2>

                        {chantier.clients ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xl font-medium text-gray-900 dark:text-white">{chantier.clients.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{chantier.clients.type === 'professionnel' ? 'Entreprise' : 'Particulier'}</p>
                                </div>

                                <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-white/5">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 dark:bg-white/5">
                                            <Mail size={16} />
                                        </div>
                                        {chantier.clients.email || 'Pas d\'email'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 dark:bg-white/5">
                                            <Phone size={16} />
                                        </div>
                                        {chantier.clients.phone_mobile || chantier.clients.phone_fixe || 'Pas de tel'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 dark:bg-white/5">
                                            <MapPin size={16} />
                                        </div>
                                        <span className="flex-1 truncate">
                                            {chantier.clients.city ? `${chantier.clients.zip_code} ${chantier.clients.city}` : 'Adresse inconnue'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-red-500 dark:text-red-400">Client introuvable (supprimé ?)</p>
                        )}
                    </div>
                </div>

                {/* --- COLONNE DROITE : DOCUMENTS (Devis/Factures) --- */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Section Devis */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-md">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                <FileText size={20} className="text-purple-600 dark:text-purple-400" />
                                Devis & Chiffrages
                            </h2>
                        </div>

                        {devisList && devisList.length > 0 ? (
                            <div className="space-y-3">
                                {devisList.map((devis) => (
                                    <Link
                                        key={devis.id}
                                        href={`/dashboard/devis/${devis.id}/edit`}
                                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:bg-gray-100/80 hover:border-gray-200 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-white/20"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{devis.name || 'Sans Titre'}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {devis.reference ? `Réf: ${devis.reference} • ` : ''}
                                                    {new Date(devis.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{devis.total_ttc ? `${devis.total_ttc} €` : '-- €'}</span>
                                            <span className={`rounded-full px-2 py-1 text-xs font-medium border ${getDevisStatusColor(devis.status)}`}>
                                                {getDevisStatusLabel(devis.status)}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center dark:border-white/10 dark:bg-black/20">
                                <div className="mb-3 rounded-full bg-white p-3 text-gray-400 shadow-sm dark:bg-white/5 dark:text-gray-500">
                                    <FileText size={24} />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400">Aucun devis créé pour ce chantier.</p>
                            </div>
                        )}
                    </div>

                    {/* Section Factures */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-md">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                <FileText size={20} className="text-green-600 dark:text-green-400" />
                                Factures
                            </h2>
                        </div>

                        {facturesList && facturesList.length > 0 ? (
                            <div className="space-y-3">
                                {facturesList.map((facture) => (
                                    <Link
                                        key={facture.id}
                                        href={`/dashboard/factures/${facture.id}/edit`}
                                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:bg-gray-100/80 hover:border-gray-200 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-white/20"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{facture.numero || 'Brouillon'}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(facture.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{facture.total_ttc ? `${Number(facture.total_ttc).toFixed(2)} €` : '-- €'}</span>
                                            <span className={`rounded-full px-2 py-1 text-xs font-medium border ${getFactureStatusColor(facture.status)}`}>
                                                {getFactureStatusLabel(facture.status)}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center dark:border-white/10 dark:bg-black/20">
                                <div className="mb-3 rounded-full bg-white p-3 text-gray-400 shadow-sm dark:bg-white/5 dark:text-gray-500">
                                    <FileText size={24} />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400">Aucune facture créée pour ce chantier.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}