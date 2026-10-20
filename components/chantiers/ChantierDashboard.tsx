'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    MapPin, Calendar, User, Phone, Mail, FileText, Plus,
    ArrowLeft, Briefcase, TrendingUp, CheckCircle, Clock,
    ArrowUpRight, Building2, ExternalLink, ShieldCheck
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import StatusBadge from '@/components/ui/StatusBadge'
import ChantierStatusSelect from '@/components/chantiers/ChantierStatusSelect'
import ArticleStockListener from '@/components/chantiers/ArticleStockListener'
import PillButton from '@/components/ui/PillButton'

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
    const conversionRate = devisList.length > 0
        ? Math.min(100, Math.round((facturesList.length / devisList.length) * 100))
        : 0

    const clientInitials = chantier.clients?.name
        ? chantier.clients.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'CL'

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <ArticleStockListener chantierId={chantier.id} />

            {/* --- 1. HEADER ÉPURÉ & BOUTONS ACTION --- */}
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between pt-1">
                <div className="space-y-2">
                    {/* Back Breadcrumb Pill */}
                    <Link
                        href="/dashboard/chantiers"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all active:scale-95"
                    >
                        <ArrowLeft size={13} className="text-slate-400 dark:text-slate-500" />
                        Retour aux chantiers
                    </Link>

                    {/* Chantier Title & Status Select */}
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            {chantier.name}
                        </h1>
                        <ChantierStatusSelect id={chantier.id} currentStatus={chantier.status} />
                    </div>

                    {/* Metadata Pill Tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5 bg-white dark:bg-[#131B2A] px-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-xs">
                            <MapPin size={13} className="text-indigo-600 dark:text-indigo-400" />
                            {chantier.address_line1 || 'Adresse non renseignée'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-white dark:bg-[#131B2A] px-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-xs">
                            <Calendar size={13} className="text-indigo-600 dark:text-indigo-400" />
                            Début : {chantier.date_debut ? new Date(chantier.date_debut).toLocaleDateString('fr-FR') : 'Non planifié'}
                        </span>
                    </div>
                </div>

                {/* Top Action Buttons (Unified PillButtons) */}
                <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                    <PillButton
                        href={`/dashboard/chantiers/${chantier.id}/suivi`}
                        variant="secondary"
                        icon={<Briefcase size={14} className="text-indigo-600 dark:text-indigo-400" />}
                    >
                        Voir le Suivi
                    </PillButton>
                    <form action={async () => await createEmptyDevisAction(chantier.id)}>
                        <PillButton
                            type="submit"
                            variant="primary"
                            icon={<Plus size={14} />}
                        >
                            Créer un Devis
                        </PillButton>
                    </form>
                </div>
            </div>

            {/* --- 2. SEGMENTED PILL TABS --- */}
            <div className="flex items-center">
                <div className="inline-flex p-1 bg-slate-100 dark:bg-[#0E1524] border border-slate-200/80 dark:border-slate-800 rounded-full">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all select-none ${
                            activeTab === 'overview'
                                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        Vue d'ensemble
                    </button>
                    <button
                        onClick={() => setActiveTab('devis')}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all select-none ${
                            activeTab === 'devis'
                                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>Devis</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            activeTab === 'devis'
                                ? 'bg-indigo-100 dark:bg-white/20 text-indigo-700 dark:text-white'
                                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                            {devisList.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('factures')}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all select-none ${
                            activeTab === 'factures'
                                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>Factures</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            activeTab === 'factures'
                                ? 'bg-indigo-100 dark:bg-white/20 text-indigo-700 dark:text-white'
                                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                            {facturesList.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* --- 3. TAB CONTENTS --- */}

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* BENTO STATS ROW (3 Cards Solides & Épurées) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* KPI 1: Total Devis */}
                        <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-6 shadow-xs dark:shadow-none hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    Total Devis Chiffrés
                                </span>
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
                                    <FileText size={15} />
                                </span>
                            </div>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                {totalDevis.toFixed(2)} €
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="inline-flex items-center text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/40">
                                    {pendingDevisCount} en attente
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                    {devisList.length} devis au total
                                </span>
                            </div>
                        </div>

                        {/* KPI 2: Total Factures */}
                        <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-6 shadow-xs dark:shadow-none hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    Total Facturé
                                </span>
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                                    <TrendingUp size={15} />
                                </span>
                            </div>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                {totalFactures.toFixed(2)} €
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/40">
                                    {paidFacturesCount} réglée{paidFacturesCount > 1 ? 's' : ''}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                    {facturesList.length} facture{facturesList.length > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {/* KPI 3: Conversion Commerciale (Épurée) */}
                        <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-6 shadow-xs dark:shadow-none hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    Conversion Devis → Facture
                                </span>
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                                    <ShieldCheck size={15} />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {conversionRate}%
                                </p>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    ratio de transformation
                                </span>
                            </div>
                            {/* Visual Progress Bar */}
                            <div className="mt-4 w-full h-2 rounded-full bg-slate-100 dark:bg-[#0E1524] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
                                    style={{ width: `${conversionRate}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* TWO-COLUMN DETAILS GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* LEFT COLUMN: CLIENT PROFILE CARD */}
                        <div className="lg:col-span-1">
                            <div className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-6 shadow-xs dark:shadow-none">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-black text-base flex items-center justify-center shadow-xs">
                                        {clientInitials}
                                    </div>
                                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                        chantier.clients?.type === 'professionnel'
                                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    }`}>
                                        {chantier.clients?.type === 'professionnel' ? 'Entreprise' : 'Particulier'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                                    {chantier.clients?.name || 'Client Inconnu'}
                                </h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                    Maître d'ouvrage associé
                                </p>

                                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-3.5">
                                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                                        <div className="w-7 h-7 shrink-0 rounded-lg bg-slate-100 dark:bg-[#0E1524] text-slate-500 dark:text-slate-400 flex items-center justify-center">
                                            <Mail size={13} />
                                        </div>
                                        <a
                                            href={chantier.clients?.email ? `mailto:${chantier.clients.email}` : undefined}
                                            className="truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                                        >
                                            {chantier.clients?.email || 'Email non renseigné'}
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                                        <div className="w-7 h-7 shrink-0 rounded-lg bg-slate-100 dark:bg-[#0E1524] text-slate-500 dark:text-slate-400 flex items-center justify-center">
                                            <Phone size={13} />
                                        </div>
                                        <a
                                            href={chantier.clients?.phone_mobile ? `tel:${chantier.clients.phone_mobile}` : undefined}
                                            className="truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                                        >
                                            {chantier.clients?.phone_mobile || chantier.clients?.phone_fixe || 'Téléphone non renseigné'}
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                                        <div className="w-7 h-7 shrink-0 rounded-lg bg-slate-100 dark:bg-[#0E1524] text-slate-500 dark:text-slate-400 flex items-center justify-center">
                                            <MapPin size={13} />
                                        </div>
                                        <span className="truncate font-medium">
                                            {chantier.clients?.city
                                                ? `${chantier.clients.zip_code || ''} ${chantier.clients.city}`.trim()
                                                : 'Ville non renseignée'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                                    <Link
                                        href="/dashboard/clients"
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Consulter la fiche client
                                        <ArrowUpRight size={13} />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: RECENT DEVIS & FACTURES */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Recent Devis */}
                            <div className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-6 shadow-xs dark:shadow-none">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">Derniers Devis</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Chiffrages et offres associés à ce chantier</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('devis')}
                                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 transition-colors"
                                    >
                                        Voir tout ({devisList.length})
                                    </button>
                                </div>

                                {devisList.length > 0 ? (
                                    <div className="space-y-2.5">
                                        {devisList.slice(0, 3).map((devis) => (
                                            <Link
                                                key={devis.id}
                                                href={`/dashboard/devis/${devis.id}/edit`}
                                                className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E1524] hover:bg-slate-100 dark:hover:bg-[#162032] border border-slate-200/60 dark:border-slate-800/80 transition-all"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#131B2A] border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                                                        <FileText size={15} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {devis.name || 'Devis sans titre'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                                            {new Date(devis.created_at).toLocaleDateString('fr-FR')} {devis.reference ? `• Réf: ${devis.reference}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">
                                                        {devis.total_ttc ? `${Number(devis.total_ttc).toFixed(2)} €` : '-- €'}
                                                    </span>
                                                    <StatusBadge status={devis.status || 'brouillon'} />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0E1524]/50">
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Aucun devis créé pour ce chantier.</p>
                                    </div>
                                )}
                            </div>

                            {/* Recent Factures */}
                            <div className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-6 shadow-xs dark:shadow-none">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">Dernières Factures</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Facturations et acomptes enregistrés</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('factures')}
                                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 transition-colors"
                                    >
                                        Voir tout ({facturesList.length})
                                    </button>
                                </div>

                                {facturesList.length > 0 ? (
                                    <div className="space-y-2.5">
                                        {facturesList.slice(0, 3).map((facture) => (
                                            <Link
                                                key={facture.id}
                                                href={`/dashboard/factures/${facture.id}/edit`}
                                                className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E1524] hover:bg-slate-100 dark:hover:bg-[#162032] border border-slate-200/60 dark:border-slate-800/80 transition-all"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#131B2A] border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                                                        <FileText size={15} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                            {facture.numero || 'Facture sans numéro'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                                            {new Date(facture.created_at).toLocaleDateString('fr-FR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">
                                                        {facture.total_ttc ? `${Number(facture.total_ttc).toFixed(2)} €` : '-- €'}
                                                    </span>
                                                    <StatusBadge status={facture.status || 'brouillon'} />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0E1524]/50">
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Aucune facture enregistrée pour ce chantier.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: DEVIS LIST */}
            {activeTab === 'devis' && (
                <div className="space-y-4">
                    {devisList.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {devisList.map((devis) => (
                                <Link
                                    key={devis.id}
                                    href={`/dashboard/devis/${devis.id}/edit`}
                                    className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-5 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                                            <FileText size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                                {devis.name || 'Sans Titre'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                {devis.reference && (
                                                    <span className="font-mono bg-slate-100 dark:bg-[#0E1524] px-2 py-0.5 rounded-full text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800">
                                                        {devis.reference}
                                                    </span>
                                                )}
                                                <span>Émis le {new Date(devis.created_at).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800/80">
                                        <div className="text-right">
                                            <span className="text-base font-black text-slate-900 dark:text-white">
                                                {devis.total_ttc ? `${Number(devis.total_ttc).toFixed(2)} €` : '-- €'}
                                            </span>
                                            <p className="text-[10px] text-slate-400 font-medium">Montant TTC</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {linkedDevisIds.has(devis.id) && <StatusBadge status="automatise" showIcon={true} />}
                                            <StatusBadge status={devis.status || 'brouillon'} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white dark:bg-[#131B2A] rounded-[24px] border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
                            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                                <FileText size={20} />
                            </div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">Aucun devis pour ce chantier</h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto font-medium">
                                Créez votre première proposition commerciale pour ce client afin de commencer à chiffrer.
                            </p>
                            <div className="pt-2">
                                <form action={async () => await createEmptyDevisAction(chantier.id)}>
                                    <PillButton type="submit" variant="primary" icon={<Plus size={14} />}>
                                        Créer le premier Devis
                                    </PillButton>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: FACTURES LIST */}
            {activeTab === 'factures' && (
                <div className="space-y-4">
                    {facturesList.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {facturesList.map((facture) => (
                                <Link
                                    key={facture.id}
                                    href={`/dashboard/factures/${facture.id}/edit`}
                                    className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-5 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                                            <FileText size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                                                {facture.numero || 'Facture sans numéro'}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                                                Émise le {new Date(facture.created_at).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800/80">
                                        <div className="text-right">
                                            <span className="text-base font-black text-slate-900 dark:text-white">
                                                {facture.total_ttc ? `${Number(facture.total_ttc).toFixed(2)} €` : '-- €'}
                                            </span>
                                            <p className="text-[10px] text-slate-400 font-medium">Montant TTC</p>
                                        </div>
                                        <StatusBadge status={facture.status || 'brouillon'} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white dark:bg-[#131B2A] rounded-[24px] border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                                <FileText size={20} />
                            </div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">Aucune facture émise</h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto font-medium">
                                Les factures et acomptes générés pour ce chantier apparaîtront ici.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
