'use client'

import React from 'react'
import Link from 'next/link'
import {
    MapPin, Calendar, Phone, Mail, FileText, Plus,
    ArrowLeft, Briefcase, TrendingUp,
    ArrowUpRight, ShieldCheck, Receipt
} from 'lucide-react'
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

    // Calculations for KPIs
    const totalDevis = devisList.reduce((acc, curr) => acc + (Number(curr.total_ttc) || (Number(curr.total_ht) * 1.2) || 0), 0)
    const totalFactures = facturesList.reduce((acc, curr) => acc + (Number(curr.total_ttc) || 0), 0)
    const paidFactures = facturesList.filter(f => f.status === 'payee' || f.status === 'paye')
    const totalPaid = paidFactures.reduce((acc, curr) => acc + (Number(curr.total_ttc) || 0), 0)
    const pendingDevisCount = devisList.filter(d => d.status === 'en_attente' || d.status === 'brouillon').length
    const conversionRate = devisList.length > 0
        ? Math.min(100, Math.round((facturesList.length / devisList.length) * 100))
        : 0

    const clientInitials = chantier.clients?.name
        ? chantier.clients.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'CL'

    return (
        <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
            <ArticleStockListener chantierId={chantier.id} />

            {/* --- FIXED HEADER & KPIS --- */}
            <div className="shrink-0 space-y-4 pb-3">
                {/* --- 1. COMPACT HEADER --- */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1.5">
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
                        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {chantier.name}
                        </h1>
                        <ChantierStatusSelect id={chantier.id} currentStatus={chantier.status} />
                    </div>

                    {/* Metadata Pill Tags */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
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

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
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

            {/* --- 2. COMPACT 4-KPIs STRIP (All Financials At A Glance) --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* KPI 1: Chiffrage Devis */}
                <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-4 shadow-xs dark:shadow-none">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Total Chiffré (Devis)
                        </span>
                        <div className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/40">
                            <FileText size={13} />
                        </div>
                    </div>
                    <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {totalDevis.toFixed(2)} €
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                            {devisList.length} devis
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">
                            • {pendingDevisCount} en cours
                        </span>
                    </div>
                </div>

                {/* KPI 2: Total Facturé */}
                <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-4 shadow-xs dark:shadow-none">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Total Facturé
                        </span>
                        <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
                            <Receipt size={13} />
                        </div>
                    </div>
                    <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {totalFactures.toFixed(2)} €
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {facturesList.length} facture{facturesList.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">
                            émise{facturesList.length > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* KPI 3: Règlements Encaissés */}
                <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-4 shadow-xs dark:shadow-none">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Encaissé / Règlements
                        </span>
                        <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                            <TrendingUp size={13} />
                        </div>
                    </div>
                    <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {totalPaid.toFixed(2)} €
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {paidFactures.length} réglée{paidFactures.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">
                            sur {facturesList.length}
                        </span>
                    </div>
                </div>

                {/* KPI 4: Conversion Commerciale */}
                <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-4 shadow-xs dark:shadow-none">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Conversion Devis → Facture
                        </span>
                        <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                            <ShieldCheck size={13} />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {conversionRate}%
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium">transformation</span>
                    </div>
                    <div className="mt-2 w-full h-1.5 rounded-full bg-slate-100 dark:bg-[#0E1524] overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${conversionRate}%` }}
                        />
                    </div>
                </div>
            </div>
            </div>

            {/* --- 3. PANORAMIC 3-COLUMN BENTO (Scrollable) --- */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                {/* COLUMN 1: CLIENT & CHANTIER SPECIFICATIONS */}
                <div className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-5 shadow-xs dark:shadow-none space-y-4">
                    {/* Header with Monogram */}
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                                {clientInitials}
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                    {chantier.clients?.name || 'Client Inconnu'}
                                </h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                    Maître d'ouvrage
                                </p>
                            </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            chantier.clients?.type === 'professionnel'
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}>
                            {chantier.clients?.type === 'professionnel' ? 'Pro' : 'Particulier'}
                        </span>
                    </div>

                    {/* Direct Contact Links */}
                    <div className="space-y-2.5 text-xs">
                        <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 p-2 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/50 dark:border-slate-800/60">
                            <div className="w-6 h-6 shrink-0 rounded-lg bg-white dark:bg-[#131B2A] text-slate-400 dark:text-slate-500 flex items-center justify-center shadow-2xs">
                                <Mail size={12} />
                            </div>
                            <a
                                href={chantier.clients?.email ? `mailto:${chantier.clients.email}` : undefined}
                                className="truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium flex-1"
                            >
                                {chantier.clients?.email || 'Email non renseigné'}
                            </a>
                        </div>

                        <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 p-2 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/50 dark:border-slate-800/60">
                            <div className="w-6 h-6 shrink-0 rounded-lg bg-white dark:bg-[#131B2A] text-slate-400 dark:text-slate-500 flex items-center justify-center shadow-2xs">
                                <Phone size={12} />
                            </div>
                            <a
                                href={chantier.clients?.phone_mobile ? `tel:${chantier.clients.phone_mobile}` : undefined}
                                className="truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium flex-1"
                            >
                                {chantier.clients?.phone_mobile || chantier.clients?.phone_fixe || 'Téléphone non renseigné'}
                            </a>
                        </div>

                        <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 p-2 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/50 dark:border-slate-800/60">
                            <div className="w-6 h-6 shrink-0 rounded-lg bg-white dark:bg-[#131B2A] text-slate-400 dark:text-slate-500 flex items-center justify-center shadow-2xs">
                                <MapPin size={12} />
                            </div>
                            <span className="truncate font-medium flex-1">
                                {chantier.clients?.city
                                    ? `${chantier.clients.zip_code || ''} ${chantier.clients.city}`.trim()
                                    : 'Ville non renseignée'}
                            </span>
                        </div>
                    </div>

                    {/* Chantier Specifications Details */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Détails du Chantier
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/50 dark:border-slate-800/60">
                                <p className="text-[10px] text-slate-400 font-medium">Statut</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 capitalize mt-0.5">
                                    {chantier.status === 'en_cours' ? 'En cours' : chantier.status === 'etude' ? 'En étude' : chantier.status || 'Non défini'}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/50 dark:border-slate-800/60">
                                <p className="text-[10px] text-slate-400 font-medium">Démarrage</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {chantier.date_debut ? new Date(chantier.date_debut).toLocaleDateString('fr-FR') : 'Non défini'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Link to Full Client View */}
                    <div className="pt-2">
                        <Link
                            href="/dashboard/clients"
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white bg-slate-50 dark:bg-[#0E1524] hover:bg-slate-100 dark:hover:bg-[#162032] border border-slate-200/70 dark:border-slate-800 transition-all"
                        >
                            <ArrowUpRight size={13} />
                            Ouvrir le module clients
                        </Link>
                    </div>
                </div>

                {/* COLUMN 2: DEVIS DU CHANTIER (FULL LIST IN VIEW) */}
                <div className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-5 shadow-xs dark:shadow-none space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/40">
                                <FileText size={15} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                    Devis
                                </h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                    {devisList.length} chiffrage{devisList.length > 1 ? 's' : ''} associé{devisList.length > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        <form action={async () => await createEmptyDevisAction(chantier.id)}>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-100 dark:border-indigo-900/50 transition-all active:scale-95 cursor-pointer"
                            >
                                <Plus size={12} />
                                Nouveau
                            </button>
                        </form>
                    </div>

                    {/* Devis Items List */}
                    {devisList.length > 0 ? (
                        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-0.5 no-scrollbar">
                            {devisList.map((devis) => (
                                <Link
                                    key={devis.id}
                                    href={`/dashboard/devis/${devis.id}/edit`}
                                    className="group block p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E1524] hover:bg-slate-100 dark:hover:bg-[#162032] border border-slate-200/60 dark:border-slate-800/80 transition-all hover:border-indigo-400 dark:hover:border-indigo-500"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {devis.name || 'Devis sans titre'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                                {new Date(devis.created_at).toLocaleDateString('fr-FR')} {devis.reference ? `• Réf: ${devis.reference}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {linkedDevisIds.has(devis.id) && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                                                    Auto
                                                </span>
                                            )}
                                            <StatusBadge status={devis.status || 'brouillon'} />
                                        </div>
                                    </div>
                                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-xs">
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                            Montant TTC
                                        </span>
                                        <span className="font-black text-slate-900 dark:text-white">
                                            {devis.total_ttc ? `${Number(devis.total_ttc).toFixed(2)} €` : (devis.total_ht ? `${(Number(devis.total_ht) * 1.2).toFixed(2)} €` : '-- €')}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0E1524]/50">
                            <FileText size={20} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Aucun devis créé</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Créez votre première proposition commerciale.</p>
                        </div>
                    )}
                </div>

                {/* COLUMN 3: FACTURES DU CHANTIER (FULL LIST IN VIEW) */}
                <div className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2A] p-5 shadow-xs dark:shadow-none space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                                <Receipt size={15} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                    Factures & Acomptes
                                </h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                    {facturesList.length} facture{facturesList.length > 1 ? 's' : ''} émise{facturesList.length > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/40">
                            {totalFactures.toFixed(2)} €
                        </span>
                    </div>

                    {/* Factures Items List */}
                    {facturesList.length > 0 ? (
                        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-0.5 no-scrollbar">
                            {facturesList.map((facture) => (
                                <Link
                                    key={facture.id}
                                    href={`/dashboard/factures/${facture.id}/edit`}
                                    className="group block p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E1524] hover:bg-slate-100 dark:hover:bg-[#162032] border border-slate-200/60 dark:border-slate-800/80 transition-all hover:border-emerald-400 dark:hover:border-emerald-500"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                {facture.numero || 'Facture sans numéro'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                                Émise le {new Date(facture.created_at).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                        <StatusBadge status={facture.status || 'brouillon'} />
                                    </div>
                                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-xs">
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                            Montant TTC
                                        </span>
                                        <span className="font-black text-slate-900 dark:text-white">
                                            {facture.total_ttc ? `${Number(facture.total_ttc).toFixed(2)} €` : '-- €'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0E1524]/50">
                            <Receipt size={20} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Aucune facture enregistrée</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Les factures et acomptes apparaîtront ici.</p>
                        </div>
                    )}
                </div>

            </div>
            </div>
        </div>
    )
}
