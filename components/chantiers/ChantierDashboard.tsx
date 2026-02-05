'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    MapPin, Calendar, User, Phone, Mail, FileText, Plus,
    ArrowLeft, Briefcase, TrendingUp, CheckCircle, Clock
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import StatusBadge from '@/components/ui/StatusBadge'
import ChantierStatusSelect from '@/components/chantiers/ChantierStatusSelect'
import ArticleStockListener from '@/components/chantiers/ArticleStockListener'
import Image from 'next/image'

interface ChantierDashboardProps {
    chantier: any
    devisList: any[]
    facturesList: any[]
    linkedDevisIds: Set<string>
    createEmptyDevisAction: (chantierId: string) => Promise<any>
}

export default function ChantierDashboard({
    chantier,
    devisList,
    facturesList,
    linkedDevisIds,
    createEmptyDevisAction
}: ChantierDashboardProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'devis' | 'factures'>('overview')

    // Calculations for KPIs
    const totalDevis = devisList.reduce((acc, curr) => acc + (Number(curr.total_ttc) || 0), 0)
    const totalFactures = facturesList.reduce((acc, curr) => acc + (Number(curr.total_ttc) || 0), 0)
    const pendingDevisCount = devisList.filter(d => d.status === 'en_attente').length
    const paidFacturesCount = facturesList.filter(f => f.status === 'payee').length

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <ArticleStockListener chantierId={chantier.id} />

            {/* --- HEADER --- */}
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                    <Link href="/dashboard/chantiers" className="mb-2 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-white">
                        <ArrowLeft size={16} />
                        Retour aux chantiers
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{chantier.name}</h1>
                        <ChantierStatusSelect id={chantier.id} currentStatus={chantier.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><MapPin size={14} /> {chantier.address_line1 || 'Adresse non renseignée'}</span>
                        <span className="flex items-center gap-1"><Calendar size={14} /> Début : {chantier.date_debut || 'Non planifié'}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={`/dashboard/chantiers/${chantier.id}/suivi`}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                        <Briefcase size={18} />
                        Voir le Suivi
                    </Link>
                    <form action={async () => await createEmptyDevisAction(chantier.id)}>
                        <button type="submit" className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all hover:scale-105">
                            <Plus size={18} />
                            Créer un Devis
                        </button>
                    </form>
                </div>
            </div>

            {/* --- TABS --- */}
            <div className="border-b border-gray-200 dark:border-white/10">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`
                            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                            ${activeTab === 'overview'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}
                        `}
                    >
                        Vue d'ensemble
                    </button>
                    <button
                        onClick={() => setActiveTab('devis')}
                        className={`
                            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                            ${activeTab === 'devis'
                                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}
                        `}
                    >
                        Devis ({devisList.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('factures')}
                        className={`
                            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                            ${activeTab === 'factures'
                                ? 'border-green-500 text-green-600 dark:text-green-400'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}
                        `}
                    >
                        Factures ({facturesList.length})
                    </button>
                </nav>
            </div>

            {/* --- CONTENT --- */}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* STATS ROW */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:bg-white/5 dark:border-white/10">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Devis</p>
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                    <FileText size={18} />
                                </div>
                            </div>
                            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{totalDevis.toFixed(2)} €</p>
                            <div className="mt-1 flex items-center text-xs text-gray-500">
                                <span className="font-medium text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full mr-2 dark:bg-purple-500/20 dark:text-purple-300">{pendingDevisCount} en attente</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:bg-white/5 dark:border-white/10">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Facturé</p>
                                <div className="p-2 bg-green-50 rounded-lg text-green-600 dark:bg-green-500/10 dark:text-green-400">
                                    <TrendingUp size={18} />
                                </div>
                            </div>
                            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{totalFactures.toFixed(2)} €</p>
                            <div className="mt-1 flex items-center text-xs text-gray-500">
                                <span className="font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full mr-2 dark:bg-green-500/20 dark:text-green-300">{paidFacturesCount} payées</span>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 shadow-md text-white">
                            <div className="flex items-center justify-between">
                                <p className="text-blue-100 text-sm font-medium">Conversion</p>
                                <div className="p-2 bg-white/10 rounded-lg text-white">
                                    <Briefcase size={18} />
                                </div>
                            </div>
                            <p className="mt-2 text-2xl font-bold">
                                {devisList.length > 0
                                    ? Math.round((facturesList.length / devisList.length) * 100)
                                    : 0}%
                            </p>
                            <p className="mt-1 text-xs text-blue-100">Taux devis → facture</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* CLIENT CARD */}
                        <div className="lg:col-span-1 h-fit">
                            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
                                <div className="absolute top-0 w-full h-24 bg-gradient-to-r from-blue-500 to-purple-600 opacity-10"></div>
                                <div className="p-6 relative">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-2xl font-bold text-blue-600 shadow-sm dark:border-gray-800 dark:bg-blue-900 dark:text-blue-200">
                                        {chantier.clients?.name?.charAt(0) || 'C'}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{chantier.clients?.name || 'Client Inconnu'}</h3>
                                    <Badge variant="outline" className="mt-2">{chantier.clients?.type === 'professionnel' ? 'Entreprise' : 'Particulier'}</Badge>

                                    <div className="mt-6 space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 dark:bg-white/5">
                                                <Mail size={16} />
                                            </div>
                                            <span className="truncate">{chantier.clients?.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 dark:bg-white/5">
                                                <Phone size={16} />
                                            </div>
                                            <span className="truncate">{chantier.clients?.phone_mobile || chantier.clients?.phone_fixe || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 dark:bg-white/5">
                                                <MapPin size={16} />
                                            </div>
                                            <span className="truncate">
                                                {chantier.clients?.city ? `${chantier.clients.zip_code} ${chantier.clients.city}` : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RECENT ACTIVITY */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Latest Devis */}
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Derniers Devis</h3>
                                    <button onClick={() => setActiveTab('devis')} className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">Voir tout</button>
                                </div>
                                {devisList.length > 0 ? (
                                    <div className="space-y-3">
                                        {devisList.slice(0, 3).map(devis => (
                                            <Link key={devis.id} href={`/dashboard/devis/${devis.id}/edit`} className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all dark:bg-white/5 dark:hover:bg-white/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-all dark:bg-white/10">
                                                        <FileText size={16} className="text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{devis.name || 'Sans Titre'}</p>
                                                        <p className="text-xs text-gray-500">{new Date(devis.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <StatusBadge status={devis.status || 'brouillon'} />
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Aucun devis récent.</p>
                                )}
                            </div>

                            {/* Latest Factures */}
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Dernières Factures</h3>
                                    <button onClick={() => setActiveTab('factures')} className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">Voir tout</button>
                                </div>
                                {facturesList.length > 0 ? (
                                    <div className="space-y-3">
                                        {facturesList.slice(0, 3).map(facture => (
                                            <Link key={facture.id} href={`/dashboard/factures/${facture.id}/edit`} className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all dark:bg-white/5 dark:hover:bg-white/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-all dark:bg-white/10">
                                                        <FileText size={16} className="text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{facture.numero || 'Brouillon'}</p>
                                                        <p className="text-xs text-gray-500">{new Date(facture.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <StatusBadge status={facture.status || 'brouillon'} />
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Aucune facture récente.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DEVIS TAB */}
            {activeTab === 'devis' && (
                <div className="grid grid-cols-1 gap-4">
                    {devisList.map((devis) => (
                        <Link
                            key={devis.id}
                            href={`/dashboard/devis/${devis.id}/edit`}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-purple-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-purple-500/30"
                        >
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-900 dark:text-white text-lg">{devis.name || 'Sans Titre'}</p>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                        {devis.reference && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs dark:bg-white/10">{devis.reference}</span>}
                                        <span>{new Date(devis.created_at).toLocaleDateString()}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{devis.total_ttc ? `${Number(devis.total_ttc).toFixed(2)} €` : '-- €'}</span>
                                <div className="flex items-center gap-2">
                                    {linkedDevisIds.has(devis.id) && <StatusBadge status="automatise" showIcon={true} />}
                                    <StatusBadge status={devis.status || 'brouillon'} />
                                </div>
                            </div>
                        </Link>
                    ))}
                    {devisList.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 dark:bg-white/5 dark:border-white/10">
                            <p className="text-gray-500">Aucun devis pour le moment.</p>
                        </div>
                    )}
                </div>
            )}

            {/* FACTURES TAB */}
            {activeTab === 'factures' && (
                <div className="grid grid-cols-1 gap-4">
                    {facturesList.map((facture) => (
                        <Link
                            key={facture.id}
                            href={`/dashboard/factures/${facture.id}/edit`}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-green-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-green-500/30"
                        >
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white text-lg">{facture.numero || 'Brouillon'}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                        {new Date(facture.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{facture.total_ttc ? `${Number(facture.total_ttc).toFixed(2)} €` : '-- €'}</span>
                                <StatusBadge status={facture.status || 'brouillon'} />
                            </div>
                        </Link>
                    ))}
                    {facturesList.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 dark:bg-white/5 dark:border-white/10">
                            <p className="text-gray-500">Aucune facture pour le moment.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
