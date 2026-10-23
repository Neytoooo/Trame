'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search,
    Plus,
    TrendingUp,
    Clock,
    FileText,
    FileCheck,
    HardHat,
    Users,
    Building2,
    Phone,
    Mail,
    X,
    ChevronRight,
    BarChart3,
    SlidersHorizontal,
    LayoutGrid,
    Table as TableIcon,
    Wallet,
    Calendar,
    ArrowUpRight,
    Check,
    Network
} from 'lucide-react'
import CompanyOrganigram from './CompanyOrganigram'
import { TeamMember, CompanyTotals, computeCompanyTotals } from '@/lib/teamData'
import StatusBadge from '@/components/ui/StatusBadge'
import PillButton from '@/components/ui/PillButton'

interface TeamPerformanceClientProps {
    initialMembers: TeamMember[]
    initialTotals: CompanyTotals
}

type SortOption = 'ca' | 'devis_attente' | 'conversion' | 'chantiers' | 'clients' | 'nb_devis' | 'nb_factures'
type ViewMode = 'organigramme' | 'cards' | 'table'

export default function TeamPerformanceClient({
    initialMembers,
    initialTotals
}: TeamPerformanceClientProps) {
    const [members, setMembers] = useState<TeamMember[]>(initialMembers)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRole, setSelectedRole] = useState<string>('all')
    const [sortBy, setSortBy] = useState<SortOption>('ca')
    const [viewMode, setViewMode] = useState<ViewMode>('organigramme')
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // Form state for new collaborator
    const [newMemberForm, setNewMemberForm] = useState({
        prenom: '',
        nom: '',
        role: 'Chargé d\'Affaires BTP',
        email: '',
        telephone: '+33 6 ',
        accentColor: 'indigo' as TeamMember['accentColor'],
        statut: 'Actif' as TeamMember['statut'],
        caEncaisse: 0,
        devisEnAttente: 0,
        nbDevis: 0,
        nbFactures: 0,
        nbChantiers: 0,
        nbClients: 0
    })

    // Formatting helpers
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(val)
    }

    const formatPercent = (val: number) => `${Math.round(val)}%`

    // Filter and Sort members
    const filteredAndSortedMembers = useMemo(() => {
        let result = members.filter(member => {
            const fullName = `${member.prenom} ${member.nom}`.toLowerCase()
            const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.email.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesRole = selectedRole === 'all' || member.role === selectedRole
            return matchesSearch && matchesRole
        })

        result.sort((a, b) => {
            switch (sortBy) {
                case 'ca':
                    return (b.caEncaisse || 0) - (a.caEncaisse || 0)
                case 'devis_attente':
                    return (b.devisEnAttente || 0) - (a.devisEnAttente || 0)
                case 'conversion':
                    return (b.tauxConversion || 0) - (a.tauxConversion || 0)
                case 'chantiers':
                    return (b.nbChantiers || 0) - (a.nbChantiers || 0)
                case 'clients':
                    return (b.nbClients || 0) - (a.nbClients || 0)
                case 'nb_devis':
                    return (b.nbDevis || 0) - (a.nbDevis || 0)
                case 'nb_factures':
                    return (b.nbFactures || 0) - (a.nbFactures || 0)
                default:
                    return 0
            }
        })

        return result
    }, [members, searchQuery, selectedRole, sortBy])

    // Dynamic Company Totals
    const companyTotals = useMemo(() => {
        return computeCompanyTotals(members)
    }, [members])

    // Avatar color helpers (subtle, corporate palette)
    const getAvatarBg = (color: TeamMember['accentColor']) => {
        switch (color) {
            case 'emerald':
                return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
            case 'amber':
                return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
            case 'sky':
                return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20'
            case 'rose':
                return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
            case 'violet':
                return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
            case 'indigo':
            default:
                return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20'
        }
    }

    // Handle adding a new collaborator
    const handleAddCollaborateur = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMemberForm.prenom || !newMemberForm.nom) return

        const initials = `${newMemberForm.prenom[0] || ''}${newMemberForm.nom[0] || ''}`.toUpperCase()
        const conversion = newMemberForm.nbDevis > 0
            ? Math.round((newMemberForm.nbFactures / newMemberForm.nbDevis) * 100)
            : 0
        const panier = newMemberForm.nbFactures > 0
            ? Math.round(newMemberForm.caEncaisse / newMemberForm.nbFactures)
            : 0

        const newCollaborateur: TeamMember = {
            id: `member-${Date.now()}`,
            prenom: newMemberForm.prenom,
            nom: newMemberForm.nom,
            role: newMemberForm.role,
            email: newMemberForm.email || `${newMemberForm.prenom.toLowerCase()}.${newMemberForm.nom[0].toLowerCase()}@trame-btp.fr`,
            telephone: newMemberForm.telephone,
            initials: initials || 'CO',
            accentColor: newMemberForm.accentColor,
            statut: newMemberForm.statut,
            caEncaisse: Number(newMemberForm.caEncaisse) || 0,
            devisEnAttente: Number(newMemberForm.devisEnAttente) || 0,
            nbDevis: Number(newMemberForm.nbDevis) || 0,
            nbFactures: Number(newMemberForm.nbFactures) || 0,
            tauxConversion: conversion,
            panierMoyen: panier,
            nbChantiers: Number(newMemberForm.nbChantiers) || 0,
            nbClients: Number(newMemberForm.nbClients) || 0,
            chantiersList: [],
            clientsList: [],
            derniersDevis: [],
            dernieresFactures: []
        }

        setMembers(prev => [newCollaborateur, ...prev])
        setIsAddModalOpen(false)
        setNewMemberForm({
            prenom: '',
            nom: '',
            role: 'Chargé d\'Affaires BTP',
            email: '',
            telephone: '+33 6 ',
            accentColor: 'indigo',
            statut: 'Actif',
            caEncaisse: 0,
            devisEnAttente: 0,
            nbDevis: 0,
            nbFactures: 0,
            nbChantiers: 0,
            nbClients: 0
        })
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* =========================================================================
                1. FIXED HEADER (Corporate title, counts, view toggle, and actions)
               ========================================================================= */}
            <div className="shrink-0 space-y-3 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                Équipe & Collaborateurs
                            </h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                                <Users size={12} className="text-slate-500 dark:text-slate-400" />
                                {members.length} collaborateurs
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Suivi opérationnel, portefeuille d'affaires et performances commerciales de l'équipe.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {/* View Mode Toggle: Clean Pill */}
                        <div className="flex items-center bg-slate-100 dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('organigramme')}
                                title="Vue Organigramme 3D Métal"
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    viewMode === 'organigramme'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-semibold'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Network size={14} />
                                <span className="hidden sm:inline">Organigramme 3D</span>
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                title="Vue Cartes"
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    viewMode === 'cards'
                                        ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-semibold'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <LayoutGrid size={14} />
                                <span className="hidden sm:inline">Cartes</span>
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                title="Vue Tableau"
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-semibold'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <TableIcon size={14} />
                                <span className="hidden sm:inline">Tableau</span>
                            </button>
                        </div>

                        {/* Add collaborator button */}
                        <PillButton
                            onClick={() => setIsAddModalOpen(true)}
                            variant="primary"
                            icon={<Plus size={14} />}
                        >
                            Nouveau collaborateur
                        </PillButton>
                    </div>
                </div>

                {/* Filters & Sorting Bar (Cartes & Tableau) */}
                {viewMode !== 'organigramme' && (
                <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 shadow-xs">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                        <input
                            type="text"
                            placeholder="Rechercher un collaborateur, un poste, un email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1524] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Role Filters + Sort Selector */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Role Pills */}
                        <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-[#0E1524] p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/80 text-[11px]">
                            <button
                                onClick={() => setSelectedRole('all')}
                                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                                    selectedRole === 'all'
                                        ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-semibold'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                Tous
                            </button>
                            <button
                                onClick={() => setSelectedRole('Direction')}
                                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                                    selectedRole === 'Direction' || selectedRole.includes('Exploitation')
                                        ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-semibold'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                Direction
                            </button>
                            <button
                                onClick={() => setSelectedRole('Chargée d\'Affaires - Rénovation & Particuliers')}
                                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                                    selectedRole.includes('Affaires')
                                        ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-semibold'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                Chargés d'Affaires
                            </button>
                            <button
                                onClick={() => setSelectedRole('Chef de Chantier - Gros Œuvre & Structure')}
                                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                                    selectedRole.includes('Chantier') || selectedRole.includes('Conducteur')
                                        ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-semibold'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                Conduite de Travaux
                            </button>
                        </div>

                        {/* Sort Selector without emojis */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Trier par :</span>
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-[#0E1524] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                >
                                    <option value="ca">Chiffre d'affaires encaissé</option>
                                    <option value="devis_attente">Devis en attente</option>
                                    <option value="conversion">Taux de signature (%)</option>
                                    <option value="chantiers">Nombre de chantiers</option>
                                    <option value="clients">Clients sous gestion</option>
                                    <option value="nb_devis">Devis créés</option>
                                    <option value="nb_factures">Factures créées</option>
                                </select>
                                <SlidersHorizontal size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>

            {/* 2. SCROLLABLE BODY */}
            {viewMode === 'organigramme' ? (
                <div className="flex-1 min-h-0 flex flex-col pt-1 pb-2">
                    <CompanyOrganigram
                        members={members}
                        companyTotals={companyTotals}
                        onSelectMemberDetails={(m) => setSelectedMember(m)}
                    />
                </div>
            ) : (
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-8 space-y-6">

                {/* -------------------------------------------------------------
                    EXECUTIVE KPI SUMMARY BAR (Clean, corporate, no gaming)
                   ------------------------------------------------------------- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* KPI 1: CA Encaissé */}
                    <div className="bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                            <span className="text-xs font-semibold">CA Encaissé (Payé)</span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                                <Wallet size={15} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {formatCurrency(companyTotals.totalCaEncaisse)}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                                <TrendingUp size={12} className="text-emerald-500" />
                                Cumul des factures réglées
                            </p>
                        </div>
                    </div>

                    {/* KPI 2: Devis en Attente */}
                    <div className="bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                            <span className="text-xs font-semibold">Devis en Négociation</span>
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                                <Clock size={15} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {formatCurrency(companyTotals.totalDevisEnAttente)}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                En attente d'approbation client
                            </p>
                        </div>
                    </div>

                    {/* KPI 3: Taux de Signature */}
                    <div className="bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                            <span className="text-xs font-semibold">Taux de Signature</span>
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                                <BarChart3 size={15} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {companyTotals.tauxConversionGlobal}%
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                {companyTotals.totalFactures} factures sur {companyTotals.totalDevis} devis
                            </p>
                        </div>
                    </div>

                    {/* KPI 4: Chantiers & Clients */}
                    <div className="bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                            <span className="text-xs font-semibold">Portefeuille Actif</span>
                            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
                                <HardHat size={15} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {companyTotals.totalChantiers} <span className="text-sm font-normal text-slate-400">chantiers</span>
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                {companyTotals.totalClients} clients sous contrat
                            </p>
                        </div>
                    </div>
                </div>

                {/* -------------------------------------------------------------
                    VIEW: CARDS OR MASTER TABLE
                   ------------------------------------------------------------- */}
                {viewMode === 'cards' ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                Collaborateurs ({filteredAndSortedMembers.length})
                            </h2>
                            <span className="text-xs text-slate-400">
                                Cliquez sur une fiche pour consulter le détail des chantiers et devis
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredAndSortedMembers.map((member) => {
                                const percentOfTotalCa = companyTotals.totalCaEncaisse > 0
                                    ? Math.round((member.caEncaisse / companyTotals.totalCaEncaisse) * 100)
                                    : 0

                                return (
                                    <div
                                        key={member.id}
                                        onClick={() => setSelectedMember(member)}
                                        className="bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col justify-between group"
                                    >
                                        <div>
                                            {/* Top Identity & Status */}
                                            <div className="flex items-start justify-between gap-3 mb-3.5">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${getAvatarBg(member.accentColor)}`}>
                                                        {member.initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {member.prenom} {member.nom}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                            {member.role}
                                                        </p>
                                                    </div>
                                                </div>

                                                <StatusBadge
                                                    status={member.statut === 'Actif' ? 'en_cours' : member.statut === 'En chantier' ? 'payee' : 'etude'}
                                                    customLabel={member.statut}
                                                />
                                            </div>

                                            {/* Contacts line */}
                                            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80">
                                                <span className="flex items-center gap-1.5 truncate">
                                                    <Mail size={12} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{member.email}</span>
                                                </span>
                                            </div>

                                            {/* Financial Metrics */}
                                            <div className="grid grid-cols-2 gap-2.5 mb-3">
                                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/70 dark:border-slate-800">
                                                    <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mb-0.5">
                                                        CA Encaissé
                                                    </p>
                                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(member.caEncaisse)}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        {percentOfTotalCa}% du CA société
                                                    </p>
                                                </div>

                                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/70 dark:border-slate-800">
                                                    <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mb-0.5">
                                                        Devis en attente
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                        {formatCurrency(member.devisEnAttente)}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        {member.nbDevis} devis soumis
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Operational Summary */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                                                    <span className="flex items-center gap-1.5">
                                                        <HardHat size={13} className="text-indigo-500" />
                                                        <span>{member.nbChantiers} chantiers suivis</span>
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Users size={13} className="text-sky-500" />
                                                        <span>{member.nbClients} clients</span>
                                                    </span>
                                                </div>

                                                {/* Signature progress bar */}
                                                <div>
                                                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                                                        <span>Taux de transformation</span>
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                            {member.tauxConversion}% ({member.nbFactures}/{member.nbDevis})
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                                            style={{ width: `${Math.min(member.tauxConversion, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                                            <span>Fiche détaillée</span>
                                            <span className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                                Consulter <ChevronRight size={13} />
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    /* -------------------------------------------------------------
                       MASTER TABLE VIEW (Corporate Data Table)
                       ------------------------------------------------------------- */
                    <div className="bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-[#0E1524]/60 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                                        <th className="py-3 px-4">Collaborateur</th>
                                        <th className="py-3 px-4">Statut</th>
                                        <th className="py-3 px-4 text-right">CA Encaissé</th>
                                        <th className="py-3 px-4 text-right">Devis en Attente</th>
                                        <th className="py-3 px-3 text-center">Devis</th>
                                        <th className="py-3 px-3 text-center">Factures</th>
                                        <th className="py-3 px-3 text-center">Transformation</th>
                                        <th className="py-3 px-3 text-center">Chantiers</th>
                                        <th className="py-3 px-3 text-center">Clients</th>
                                        <th className="py-3 px-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {filteredAndSortedMembers.map((member) => {
                                        return (
                                            <tr
                                                key={member.id}
                                                onClick={() => setSelectedMember(member)}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                                            >
                                                {/* Identity */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${getAvatarBg(member.accentColor)}`}>
                                                            {member.initials}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white">
                                                                {member.prenom} {member.nom}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400">
                                                                {member.role}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Statut */}
                                                <td className="py-3 px-4">
                                                    <StatusBadge
                                                        status={member.statut === 'Actif' ? 'en_cours' : 'etude'}
                                                        customLabel={member.statut}
                                                    />
                                                </td>

                                                {/* CA Encaissé */}
                                                <td className="py-3 px-4 text-right">
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                                        {formatCurrency(member.caEncaisse)}
                                                    </span>
                                                </td>

                                                {/* Devis en attente */}
                                                <td className="py-3 px-4 text-right">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                                        {formatCurrency(member.devisEnAttente)}
                                                    </span>
                                                </td>

                                                {/* Devis */}
                                                <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                                                    {member.nbDevis}
                                                </td>

                                                {/* Factures */}
                                                <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                                                    {member.nbFactures}
                                                </td>

                                                {/* Transformation */}
                                                <td className="py-3 px-3 text-center">
                                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        {member.tauxConversion}%
                                                    </span>
                                                </td>

                                                {/* Chantiers */}
                                                <td className="py-3 px-3 text-center font-medium text-slate-800 dark:text-slate-200">
                                                    {member.nbChantiers}
                                                </td>

                                                {/* Clients */}
                                                <td className="py-3 px-3 text-center font-medium text-slate-800 dark:text-slate-200">
                                                    {member.nbClients}
                                                </td>

                                                {/* Action */}
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setSelectedMember(member)
                                                        }}
                                                        className="px-2.5 py-1 text-xs rounded-lg font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                                    >
                                                        Consulter
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* -------------------------------------------------------------
                    EXECUTIVE COMPANY CONSOLIDATION (Clean Corporate Report Card)
                   ------------------------------------------------------------- */}
                <div className="rounded-2xl bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200">
                                <Building2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                                    Consolidation Globale de l'Entreprise
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Synthèse financière et répartition d'activité sur l'ensemble des {companyTotals.nombreCollaborateurs} collaborateurs
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                            <div>
                                <p className="text-[11px] text-slate-400">Panier Moyen Facturé</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(companyTotals.panierMoyenGlobal)}</p>
                            </div>
                            <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
                            <div>
                                <p className="text-[11px] text-slate-400">Transformation Globale</p>
                                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{companyTotals.tauxConversionGlobal}%</p>
                            </div>
                        </div>
                    </div>

                    {/* 4 Pillars Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/70 dark:border-slate-800">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                Total Encaissé (Factures payées)
                            </p>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                {formatCurrency(companyTotals.totalCaEncaisse)}
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/70 dark:border-slate-800">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                Devis en Négociation
                            </p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                                {formatCurrency(companyTotals.totalDevisEnAttente)}
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/70 dark:border-slate-800">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                Volume Commercial
                            </p>
                            <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                                {companyTotals.totalDevis} devis / {companyTotals.totalFactures} factures
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/70 dark:border-slate-800">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                Portefeuille d'Affaires
                            </p>
                            <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                                {companyTotals.totalChantiers} chantiers / {companyTotals.totalClients} clients
                            </p>
                        </div>
                    </div>

                    {/* Breakdown bar: Contribution to total revenue */}
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs mb-2 text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                Répartition du chiffre d'affaires par collaborateur
                            </span>
                            <span>Total : {formatCurrency(companyTotals.totalCaEncaisse)}</span>
                        </div>

                        <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden p-0.5 gap-0.5">
                            {members.map(m => {
                                const share = companyTotals.totalCaEncaisse > 0
                                    ? (m.caEncaisse / companyTotals.totalCaEncaisse) * 100
                                    : 0
                                if (share <= 0) return null

                                const colorClass =
                                    m.accentColor === 'indigo' ? 'bg-indigo-500' :
                                    m.accentColor === 'emerald' ? 'bg-emerald-500' :
                                    m.accentColor === 'amber' ? 'bg-amber-500' :
                                    m.accentColor === 'sky' ? 'bg-sky-500' :
                                    m.accentColor === 'rose' ? 'bg-rose-500' : 'bg-purple-500'

                                return (
                                    <div
                                        key={m.id}
                                        style={{ width: `${share}%` }}
                                        title={`${m.prenom} ${m.nom}: ${formatCurrency(m.caEncaisse)} (${Math.round(share)}%)`}
                                        className={`h-full ${colorClass} transition-all rounded-xs hover:opacity-90 cursor-pointer`}
                                        onClick={() => setSelectedMember(m)}
                                    />
                                )
                            })}
                        </div>

                        {/* Legend pills */}
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                            {members.map(m => {
                                const share = companyTotals.totalCaEncaisse > 0
                                    ? Math.round((m.caEncaisse / companyTotals.totalCaEncaisse) * 100)
                                    : 0
                                return (
                                    <div
                                        key={m.id}
                                        onClick={() => setSelectedMember(m)}
                                        className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                                    >
                                        <span className={`w-2 h-2 rounded-full ${
                                            m.accentColor === 'indigo' ? 'bg-indigo-500' :
                                            m.accentColor === 'emerald' ? 'bg-emerald-500' :
                                            m.accentColor === 'amber' ? 'bg-amber-500' :
                                            m.accentColor === 'sky' ? 'bg-sky-500' :
                                            m.accentColor === 'rose' ? 'bg-rose-500' : 'bg-purple-500'
                                        }`} />
                                        <span>{m.prenom} {m.nom} ({share}%)</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

            </div>
            )}

            {/* =========================================================================
                3. SLIDE-OVER DRAWER (Detailed Collaborator Profile)
               ========================================================================= */}
            <AnimatePresence>
                {selectedMember && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedMember(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#131B2A] border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col overflow-hidden z-10"
                        >
                            {/* Drawer Header */}
                            <div className="shrink-0 p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border ${getAvatarBg(selectedMember.accentColor)}`}>
                                        {selectedMember.initials}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                                {selectedMember.prenom} {selectedMember.nom}
                                            </h2>
                                            <StatusBadge
                                                status={selectedMember.statut === 'Actif' ? 'en_cours' : 'etude'}
                                                customLabel={selectedMember.statut}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {selectedMember.role}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedMember(null)}
                                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
                                {/* Contacts */}
                                <div className="flex items-center gap-3 text-xs">
                                    <a
                                        href={`mailto:${selectedMember.email}`}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition-colors"
                                    >
                                        <Mail size={13} className="text-slate-400" />
                                        <span className="truncate">{selectedMember.email}</span>
                                    </a>
                                    <a
                                        href={`tel:${selectedMember.telephone}`}
                                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-colors"
                                    >
                                        <Phone size={13} className="text-slate-400" />
                                        <span>{selectedMember.telephone}</span>
                                    </a>
                                </div>

                                {/* Financial & Activity Indicators */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Indicateurs Commerciaux & Financiers
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/80 dark:border-slate-800">
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                CA Encaissé
                                            </p>
                                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                {formatCurrency(selectedMember.caEncaisse)}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Sur factures payées</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/80 dark:border-slate-800">
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                Devis en Attente
                                            </p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                                                {formatCurrency(selectedMember.devisEnAttente)}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">En cours de signature</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/80 dark:border-slate-800">
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                Devis & Factures
                                            </p>
                                            <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                                                {selectedMember.nbDevis} devis / {selectedMember.nbFactures} fact.
                                            </p>
                                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
                                                Transformation : {selectedMember.tauxConversion}%
                                            </p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/80 dark:border-slate-800">
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                Chantiers & Clients
                                            </p>
                                            <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                                                {selectedMember.nbChantiers} chantiers / {selectedMember.nbClients} cli.
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Sous responsabilité</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Chantiers gérés */}
                                <div className="space-y-2.5">
                                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                        <HardHat size={14} className="text-indigo-500" />
                                        Chantiers sous gestion ({selectedMember.chantiersList.length})
                                    </h3>

                                    {selectedMember.chantiersList.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedMember.chantiersList.map(ch => (
                                                <div
                                                    key={ch.id}
                                                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                            {ch.nom}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {ch.ville || 'Région Parisienne'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-slate-900 dark:text-white">
                                                            {formatCurrency(ch.montant)}
                                                        </p>
                                                        <StatusBadge status={ch.statut} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Aucun chantier rattaché pour le moment.</p>
                                    )}
                                </div>

                                {/* Clients récents */}
                                <div className="space-y-2.5">
                                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                        <Users size={14} className="text-sky-500" />
                                        Portefeuille Clients ({selectedMember.clientsList.length})
                                    </h3>

                                    {selectedMember.clientsList.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {selectedMember.clientsList.map(cl => (
                                                <div
                                                    key={cl.id}
                                                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/70 dark:border-slate-800 text-xs"
                                                >
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                        {cl.nom}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {cl.ville || 'France'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Aucun client direct rattaché.</p>
                                    )}
                                </div>

                                {/* Derniers devis / factures */}
                                <div className="space-y-2.5">
                                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                        <FileCheck size={14} className="text-emerald-500" />
                                        Dernières Activités Commerciales
                                    </h3>

                                    <div className="space-y-2">
                                        {selectedMember.derniersDevis.map((d, i) => (
                                            <div
                                                key={i}
                                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs"
                                            >
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {d.ref} • {d.client}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400">Devis</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-slate-900 dark:text-white">
                                                        {formatCurrency(d.montant)}
                                                    </p>
                                                    <StatusBadge status={d.statut} />
                                                </div>
                                            </div>
                                        ))}

                                        {selectedMember.dernieresFactures.map((f, i) => (
                                            <div
                                                key={`f-${i}`}
                                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1524] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs"
                                            >
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {f.ref} • {f.client}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400">Facture</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(f.montant)}
                                                    </p>
                                                    <StatusBadge status={f.statut} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* =========================================================================
                4. MODAL: NOUVEAU COLLABORATEUR
               ========================================================================= */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-10 overflow-hidden"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        Nouveau Collaborateur
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Renseignez les coordonnées et informations de suivi opérationnel
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddCollaborateur} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                            Prénom *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newMemberForm.prenom}
                                            onChange={e => setNewMemberForm({ ...newMemberForm, prenom: e.target.value })}
                                            placeholder="ex: Julien"
                                            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                            Nom *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newMemberForm.nom}
                                            onChange={e => setNewMemberForm({ ...newMemberForm, nom: e.target.value })}
                                            placeholder="ex: Fontaine"
                                            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                        Poste / Fonction BTP
                                    </label>
                                    <input
                                        type="text"
                                        value={newMemberForm.role}
                                        onChange={e => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                                        placeholder="ex: Chargé d'Affaires Couverture"
                                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                            Email professionnel
                                        </label>
                                        <input
                                            type="email"
                                            value={newMemberForm.email}
                                            onChange={e => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                                            placeholder="julien.f@trame-btp.fr"
                                            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                            Téléphone
                                        </label>
                                        <input
                                            type="text"
                                            value={newMemberForm.telephone}
                                            onChange={e => setNewMemberForm({ ...newMemberForm, telephone: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Metrics Inputs */}
                                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                                        Données d'activité
                                    </p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                                                CA Encaissé (€ HT)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={newMemberForm.caEncaisse}
                                                onChange={e => setNewMemberForm({ ...newMemberForm, caEncaisse: Number(e.target.value) })}
                                                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                                                Devis en Attente (€ HT)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={newMemberForm.devisEnAttente}
                                                onChange={e => setNewMemberForm({ ...newMemberForm, devisEnAttente: Number(e.target.value) })}
                                                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                                                Devis créés
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={newMemberForm.nbDevis}
                                                onChange={e => setNewMemberForm({ ...newMemberForm, nbDevis: Number(e.target.value) })}
                                                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                                                Factures créées
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={newMemberForm.nbFactures}
                                                onChange={e => setNewMemberForm({ ...newMemberForm, nbFactures: Number(e.target.value) })}
                                                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                                                Chantiers gérés
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={newMemberForm.nbChantiers}
                                                onChange={e => setNewMemberForm({ ...newMemberForm, nbChantiers: Number(e.target.value) })}
                                                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                                                Clients sous gestion
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={newMemberForm.nbClients}
                                                onChange={e => setNewMemberForm({ ...newMemberForm, nbClients: Number(e.target.value) })}
                                                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200/80 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer"
                                    >
                                        Enregistrer
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
