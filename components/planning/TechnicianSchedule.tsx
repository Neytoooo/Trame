'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    User,
    Plus,
    Filter,
    CheckCircle2,
    AlertCircle,
    Building2,
    HardHat,
    Phone,
    X,
    Check,
    CalendarDays,
    Trash2,
    Sparkles,
    Briefcase,
    Smartphone,
    RefreshCw
} from 'lucide-react'
import PillButton from '@/components/ui/PillButton'
import {
    StoredIntervention,
    formatDateKey,
    getMondayOfWeek
} from '@/types/planning'
import {
    PlanningChantierOption,
    PlanningTeamMemberOption,
    createPlanningInterventionAction,
    updatePlanningInterventionStatusAction,
    deletePlanningInterventionAction
} from '@/app/actions/planning'

interface TechnicianScheduleProps {
    initialInterventions?: StoredIntervention[]
    chantiersList?: PlanningChantierOption[]
    teamMembersList?: PlanningTeamMemberOption[]
}

const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
]

const QUICK_MISSIONS = [
    'Visite technique & diagnostic',
    'Métré & relevé de cotes',
    'Installation base-vie & sécurisation',
    'Lavage haute pression & décapage',
    'Pose couvertines aluminium',
    'Piquage enduits & reprise maçonnerie',
    'Réception de chantier & signature PV'
]

// Calcul du numéro de semaine ISO
function getWeekNumber(date: Date): number {
    const target = new Date(date.valueOf())
    const dayNr = (date.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNr + 3)
    const firstThursday = target.valueOf()
    target.setMonth(0, 1)
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
}

export default function TechnicianSchedule({
    initialInterventions = [],
    chantiersList = [],
    teamMembersList = []
}: TechnicianScheduleProps) {
    // 1. GESTION DU CALENDRIER TEMPS RÉEL
    const today = useMemo(() => new Date(), [])
    const todayStr = useMemo(() => formatDateKey(today), [today])

    // Date de référence pour la semaine affichée (par défaut la semaine d'aujourd'hui)
    const [currentReferenceDate, setCurrentReferenceDate] = useState<Date>(today)

    // Calcul du Lundi de la semaine affichée
    const currentMonday = useMemo(() => {
        return getMondayOfWeek(currentReferenceDate)
    }, [currentReferenceDate])

    // Générer les 6 jours de la semaine de travail (Lundi à Samedi)
    const weekDays = useMemo(() => {
        const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
        const fullLabels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

        return labels.map((label, index) => {
            const dayDate = new Date(currentMonday)
            dayDate.setDate(currentMonday.getDate() + index)

            const dateKey = formatDateKey(dayDate)
            const dayNumber = String(dayDate.getDate()).padStart(2, '0')
            const monthNumber = String(dayDate.getMonth() + 1).padStart(2, '0')

            return {
                label,
                fullLabel: fullLabels[index],
                dateFormatted: `${dayNumber}/${monthNumber}`,
                dateKey,
                rawDate: dayDate,
                isToday: dateKey === todayStr,
                dayIndex: index
            }
        })
    }, [currentMonday, todayStr])

    // Navigation de semaine
    const handlePrevWeek = () => {
        setCurrentReferenceDate(prev => {
            const next = new Date(prev)
            next.setDate(next.getDate() - 7)
            return next
        })
    }

    const handleNextWeek = () => {
        setCurrentReferenceDate(prev => {
            const next = new Date(prev)
            next.setDate(next.getDate() + 7)
            return next
        })
    }

    const handleJumpToToday = () => {
        setCurrentReferenceDate(new Date())
    }

    const isCurrentWeek = useMemo(() => {
        return weekDays.some(d => d.isToday)
    }, [weekDays])

    const weekNumber = useMemo(() => {
        return getWeekNumber(currentMonday)
    }, [currentMonday])

    // 2. DONNÉES & INTERVENTIONS
    const [interventions, setInterventions] = useState<StoredIntervention[]>(initialInterventions)
    const [selectedTech, setSelectedTech] = useState<string>('Tous les techniciens')
    const [selectedChantierFilter, setSelectedChantierFilter] = useState<string>('Tous les chantiers')
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Tous les statuts')
    const [isSyncingMobile, setIsSyncingMobile] = useState(false)

    // Synchronisation en direct avec KOTA Mobile
    const syncFromMobile = async (showLoader = false) => {
        if (showLoader) setIsSyncingMobile(true)
        try {
            const res = await fetch('/api/mobile/planning')
            if (res.ok) {
                const data = await res.json()
                if (data.success && Array.isArray(data.interventions)) {
                    setInterventions(data.interventions)
                }
            }
        } catch (e) {
            // Ignorer silencieusement si déconnecté
        } finally {
            if (showLoader) setIsSyncingMobile(false)
        }
    }

    // Polling toutes les 10 secondes et à la reprise de focus pour synchroniser en temps réel les actions mobile
    useEffect(() => {
        const interval = setInterval(() => {
            syncFromMobile(false)
        }, 10000)

        const handleFocus = () => {
            syncFromMobile(false)
        }
        window.addEventListener('focus', handleFocus)

        return () => {
            clearInterval(interval)
            window.removeEventListener('focus', handleFocus)
        }
    }, [])

    // Modals
    const [activeModalItem, setActiveModalItem] = useState<StoredIntervention | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    // Formulaire de création
    const [newTitle, setNewTitle] = useState('')
    const [newChantierId, setNewChantierId] = useState('')
    const [newChantierName, setNewChantierName] = useState('')
    const [newClientName, setNewClientName] = useState('')
    const [newAddress, setNewAddress] = useState('')
    const [newTech, setNewTech] = useState('')
    const [newDate, setNewDate] = useState(todayStr)
    const [newStart, setNewStart] = useState('08:30')
    const [newEnd, setNewEnd] = useState('11:30')
    const [newNotes, setNewNotes] = useState('')

    // Initialiser les valeurs du formulaire quand chantiersList est disponible
    useEffect(() => {
        if (chantiersList.length > 0 && !newChantierName) {
            setNewChantierId(chantiersList[0].id)
            setNewChantierName(chantiersList[0].name)
            setNewClientName(chantiersList[0].clientName)
            setNewAddress(chantiersList[0].address)
        }
    }, [chantiersList, newChantierName])

    useEffect(() => {
        if (teamMembersList.length > 0 && !newTech) {
            setNewTech(teamMembersList[0].name)
        }
    }, [teamMembersList, newTech])

    // Gestion du changement de chantier dans le formulaire
    const handleChantierChange = (chantierId: string) => {
        setNewChantierId(chantierId)
        const found = chantiersList.find(c => c.id === chantierId)
        if (found) {
            setNewChantierName(found.name)
            setNewClientName(found.clientName)
            setNewAddress(found.address)
        }
    }

    // Filtrer les interventions affichées
    const filteredInterventions = useMemo(() => {
        return interventions.filter(item => {
            if (selectedTech !== 'Tous les techniciens' && item.technicien !== selectedTech) return false
            if (selectedChantierFilter !== 'Tous les chantiers' && item.chantierName !== selectedChantierFilter) return false
            if (selectedStatusFilter !== 'Tous les statuts' && item.status !== selectedStatusFilter) return false
            return true
        })
    }, [interventions, selectedTech, selectedChantierFilter, selectedStatusFilter])

    // Ouvrir la création calée sur un jour précis
    const handleOpenCreateForDate = (dateKey: string, timeSlot?: string) => {
        setNewDate(dateKey)
        if (timeSlot) {
            setNewStart(timeSlot)
            const [h, m] = timeSlot.split(':').map(Number)
            const endHour = String(h + 2).padStart(2, '0')
            setNewEnd(`${endHour}:${String(m).padStart(2, '0')}`)
        }
        setIsCreateModalOpen(true)
    }

    // Créer une intervention
    const handleCreateIntervention = async (e: React.FormEvent) => {
        e.preventDefault()
        setActionLoading(true)

        const res = await createPlanningInterventionAction({
            title: newTitle || 'Intervention Chantier',
            chantierName: newChantierName || 'Chantier KOTA',
            clientName: newClientName || 'Client',
            address: newAddress || 'Adresse chantier',
            technicien: newTech || 'Technicien assigné',
            date: newDate,
            startTime: newStart,
            endTime: newEnd,
            notes: newNotes,
            chantier_id: newChantierId || null,
            color: 'rose'
        })

        setActionLoading(false)

        if (res.success && res.intervention) {
            setInterventions(prev => [res.intervention!, ...prev])
            setIsCreateModalOpen(false)
            setNewTitle('')
            setNewNotes('')
        } else {
            alert(res.error || 'Erreur lors de la planification de l\'intervention.')
        }
    }

    // Mettre à jour le statut
    const handleUpdateStatus = async (item: StoredIntervention, nextStatus: 'planifie' | 'en_cours' | 'termine') => {
        setActionLoading(true)
        const res = await updatePlanningInterventionStatusAction(item.id, nextStatus)
        setActionLoading(false)

        if (res.success) {
            setInterventions(prev => prev.map(i => i.id === item.id ? { ...i, status: nextStatus } : i))
            if (activeModalItem?.id === item.id) {
                setActiveModalItem(prev => prev ? { ...prev, status: nextStatus } : null)
            }
        }
    }

    // Supprimer une intervention
    const handleDeleteIntervention = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette intervention du planning ?')) return

        setActionLoading(true)
        const res = await deletePlanningInterventionAction(id)
        setActionLoading(false)

        if (res.success) {
            setInterventions(prev => prev.filter(i => i.id !== id))
            setActiveModalItem(null)
        }
    }

    // Formater la date d'aujourd'hui en français
    const todayFormattedLong = useMemo(() => {
        return today.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }, [today])

    return (
        <div className="h-full flex flex-col overflow-hidden space-y-3 animate-in fade-in duration-300">

            {/* ========================================================================= */}
            {/* 1. TOP HEADER & WEEK NAVIGATOR (Synchronisé avec la date d'aujourd'hui) */}
            {/* ========================================================================= */}
            <div className="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-[#131B2A]/90 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs shrink-0">
                        <CalendarIcon size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                Planning des Interventions
                            </h1>
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-bold border border-indigo-500/20">
                                Semaine {weekNumber}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize mt-0.5">
                            Aujourd'hui : {todayFormattedLong}
                        </p>
                    </div>
                </div>

                {/* Week Navigator & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                    {/* Contrôles de navigation de semaine */}
                    <div className="flex items-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0D121B] p-0.5 shadow-2xs">
                        <button
                            onClick={handlePrevWeek}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1A2438] transition-colors cursor-pointer"
                            title="Semaine précédente"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <button
                            onClick={handleJumpToToday}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                isCurrentWeek
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1A2438]'
                            }`}
                            title="Revenir à la semaine actuelle"
                        >
                            Aujourd'hui
                        </button>

                        <button
                            onClick={handleNextWeek}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1A2438] transition-colors cursor-pointer"
                            title="Semaine suivante"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Sélecteur Technicien */}
                    <select
                        value={selectedTech}
                        onChange={(e) => setSelectedTech(e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0D121B] px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs focus:border-indigo-500 outline-none"
                    >
                        <option value="Tous les techniciens">Tous les techniciens</option>
                        {teamMembersList.map(t => (
                            <option key={t.id} value={t.name}>{t.name} ({t.role})</option>
                        ))}
                    </select>

                    {/* Sélecteur Chantier */}
                    <select
                        value={selectedChantierFilter}
                        onChange={(e) => setSelectedChantierFilter(e.target.value)}
                        className="hidden sm:block rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0D121B] px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs focus:border-indigo-500 outline-none max-w-[180px] truncate"
                    >
                        <option value="Tous les chantiers">Tous les chantiers</option>
                        {chantiersList.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>

                    {/* Bouton Synchro KOTA Mobile */}
                    <button
                        type="button"
                        onClick={() => syncFromMobile(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-2xs"
                        title="Synchronisé en continu avec l'application KOTA Mobile. Cliquez pour actualiser."
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <Smartphone size={13} className="text-emerald-500" />
                        <span className="hidden md:inline">{isSyncingMobile ? 'Actualisation...' : 'KOTA Mobile'}</span>
                    </button>

                    {/* Bouton Planifier */}
                    <PillButton
                        type="button"
                        onClick={() => handleOpenCreateForDate(todayStr, '08:30')}
                        variant="primary"
                        icon={<Plus size={14} />}
                    >
                        Planifier
                    </PillButton>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. GRILLE DU PLANNING HEBDOMADAIRE (Synchronisée avec les 6 jours de la semaine) */}
            {/* ========================================================================= */}
            <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-[#131B2A]/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden backdrop-blur-xl">

                {/* En-tête des 6 Jours */}
                <div className="shrink-0 grid grid-cols-7 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/90 dark:bg-[#0D121B]/90 text-center select-none">
                    {/* Colonne Horaires */}
                    <div className="p-3 text-xs font-bold uppercase text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-white/[0.08] flex items-center justify-center gap-1">
                        <Clock size={13} />
                        <span>Heure</span>
                    </div>

                    {/* Colonnes des Jours */}
                    {weekDays.map((day) => (
                        <div
                            key={day.dateKey}
                            className={`p-2.5 sm:p-3 text-xs font-bold border-r border-slate-200 dark:border-white/[0.08] last:border-r-0 transition-colors ${
                                day.isToday
                                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                                    : 'text-slate-700 dark:text-slate-200'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-1.5">
                                <span>{day.label}</span>
                                <span className="font-mono text-[11px] opacity-75">{day.dateFormatted}</span>
                            </div>

                            {day.isToday && (
                                <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-indigo-600 text-white shadow-2xs">
                                    Aujourd'hui
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Corps de la grille horaire */}
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
                    {TIME_SLOTS.map((slot) => {
                        const slotHour = parseInt(slot.split(':')[0], 10)

                        return (
                            <div key={slot} className="grid grid-cols-7 min-h-[76px]">
                                {/* Colonne Heure */}
                                <div className="p-2 text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-[#0D121B]/50 border-r border-slate-200 dark:border-white/[0.08] flex items-start justify-center pt-2 font-mono text-[11px]">
                                    {slot}
                                </div>

                                {/* 6 Colonnes de Jours */}
                                {weekDays.map((day) => {
                                    // Filtrer les interventions qui correspondent à ce jour et à cette tranche horaire
                                    const slotInterventions = filteredInterventions.filter(item => {
                                        if (item.date !== day.dateKey) return false
                                        const startHour = parseInt(item.startTime.split(':')[0], 10)
                                        return startHour === slotHour
                                    })

                                    return (
                                        <div
                                            key={day.dateKey}
                                            onClick={(e) => {
                                                // Si on clique sur le fond vide, proposer de planifier à cette heure
                                                if (e.target === e.currentTarget) {
                                                    handleOpenCreateForDate(day.dateKey, slot)
                                                }
                                            }}
                                            className={`p-1.5 border-r border-slate-100 dark:border-white/[0.04] last:border-r-0 relative hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group ${
                                                day.isToday ? 'bg-indigo-500/[0.02] dark:bg-indigo-500/[0.03]' : ''
                                            }`}
                                        >
                                            {/* Bouton rapide d'ajout au survol de la case vide */}
                                            {slotInterventions.length === 0 && (
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <span className="text-[10px] text-indigo-500 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                                        + Planifier
                                                    </span>
                                                </div>
                                            )}

                                            {/* Cartes d'interventions */}
                                            {slotInterventions.map(item => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setActiveModalItem(item)
                                                    }}
                                                    className="w-full text-left rounded-xl p-2.5 transition-all hover:scale-[1.02] shadow-xs mb-1.5 bg-white dark:bg-[#1A2438] border border-slate-200/90 dark:border-white/[0.08] hover:border-indigo-400 dark:hover:border-indigo-500 group/card cursor-pointer"
                                                >
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                                        <span className="font-mono">{item.startTime} - {item.endTime}</span>
                                                        <span
                                                            className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold ${
                                                                item.status === 'termine'
                                                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                                                    : item.status === 'en_cours'
                                                                    ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                                                                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                                            }`}
                                                        >
                                                            {item.status === 'termine' ? 'Terminé' : item.status === 'en_cours' ? 'En cours' : 'Planifié'}
                                                        </span>
                                                    </div>

                                                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate leading-tight uppercase tracking-tight">
                                                        {item.chantierName}
                                                    </div>

                                                    <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate font-medium mt-0.5">
                                                        {item.title}
                                                    </div>

                                                    <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate mt-1">
                                                        <HardHat size={11} className="shrink-0" />
                                                        <span className="truncate">{item.technicien}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>

                {/* Footer récapitulatif par jour */}
                <div className="shrink-0 grid grid-cols-7 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#0D121B]/80 text-center py-2 px-1 font-bold text-xs select-none">
                    <div className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] flex items-center justify-center">
                        Total
                    </div>
                    {weekDays.map((day) => {
                        const count = filteredInterventions.filter(i => i.date === day.dateKey).length
                        return (
                            <div
                                key={day.dateKey}
                                className={`font-mono text-xs ${
                                    day.isToday ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                {count} {count > 1 ? 'interv.' : 'interv.'}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. MODAL DÉTAILS D'INTERVENTION & CHANGEMENT DE STATUT */}
            {/* ========================================================================= */}
            {activeModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModalItem(null)} />
                    <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#131B2A] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-bold border border-indigo-500/20 mb-1.5">
                                    <Clock size={12} />
                                    {activeModalItem.startTime} - {activeModalItem.endTime} • {activeModalItem.date}
                                </span>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                    {activeModalItem.chantierName}
                                </h3>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                                    {activeModalItem.title}
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveModalItem(null)}
                                className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3.5 border-y border-slate-100 dark:border-white/[0.08] py-4 my-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                                <Building2 size={16} className="text-indigo-500 shrink-0" />
                                <span>Client / Maître d'ouvrage : <strong>{activeModalItem.clientName}</strong></span>
                            </div>

                            <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                                <MapPin size={16} className="text-rose-500 shrink-0 mt-0.5" />
                                <span>{activeModalItem.address}</span>
                            </div>

                            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                                <HardHat size={16} className="text-amber-500 shrink-0" />
                                <span>Technicien assigné : <strong>{activeModalItem.technicien}</strong></span>
                            </div>

                            {activeModalItem.notes && (
                                <div className="rounded-xl bg-slate-50 dark:bg-[#0D121B] p-3 text-xs text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/[0.08]">
                                    <span className="font-bold block text-slate-800 dark:text-slate-200 mb-0.5">Consignes d'intervention :</span>
                                    {activeModalItem.notes}
                                </div>
                            )}

                            {/* Statut actuel & Switcher */}
                            <div className="pt-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                                    Statut de l'intervention :
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => handleUpdateStatus(activeModalItem, 'planifie')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                            activeModalItem.status === 'planifie'
                                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                                : 'bg-slate-50 dark:bg-[#0D121B] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                                        }`}
                                    >
                                        Planifié
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => handleUpdateStatus(activeModalItem, 'en_cours')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                            activeModalItem.status === 'en_cours'
                                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                                : 'bg-slate-50 dark:bg-[#0D121B] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                                        }`}
                                    >
                                        En cours
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => handleUpdateStatus(activeModalItem, 'termine')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                            activeModalItem.status === 'termine'
                                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                                : 'bg-slate-50 dark:bg-[#0D121B] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                                        }`}
                                    >
                                        Terminé
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => handleDeleteIntervention(activeModalItem.id)}
                                className="px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Trash2 size={13} />
                                Supprimer
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveModalItem(null)}
                                className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 4. MODAL DE PLANIFICATION D'INTERVENTION */}
            {/* ========================================================================= */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsCreateModalOpen(false)} />
                    <form
                        onSubmit={handleCreateIntervention}
                        className="relative w-full max-w-lg rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#131B2A] p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Plus size={18} className="text-indigo-600 dark:text-indigo-400" />
                                Planifier une Nouvelle Intervention
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3.5 text-xs sm:text-sm">
                            {/* Choix du Chantier */}
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                                    Chantier concerné *
                                </label>
                                {chantiersList.length > 0 ? (
                                    <select
                                        value={newChantierId}
                                        onChange={(e) => handleChantierChange(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0D121B] px-3.5 py-2.5 text-slate-900 dark:text-white font-medium outline-none focus:border-indigo-500"
                                    >
                                        {chantiersList.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.clientName})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={newChantierName}
                                        onChange={(e) => setNewChantierName(e.target.value)}
                                        placeholder="Nom du chantier"
                                        required
                                        className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0D121B] px-3.5 py-2.5 text-slate-900 dark:text-white"
                                    />
                                )}
                            </div>

                            {/* Titre / Mission */}
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                                    Objet / Mission des travaux *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Pose échafaudage, Lavage façade, Métré..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0D121B] px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                />

                                {/* Suggestions rapides */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {QUICK_MISSIONS.slice(0, 4).map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setNewTitle(m)}
                                            className="px-2 py-0.5 text-[10px] rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2438] dark:hover:bg-[#23304a] text-slate-600 dark:text-slate-300 transition-colors"
                                        >
                                            + {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Technicien assigné */}
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                                    Technicien / Responsable assigné
                                </label>
                                <select
                                    value={newTech}
                                    onChange={(e) => setNewTech(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0D121B] px-3.5 py-2.5 text-slate-900 dark:text-white font-medium outline-none focus:border-indigo-500"
                                >
                                    {teamMembersList.map(t => (
                                        <option key={t.id} value={t.name}>{t.name} ({t.role})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date & Horaires */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0D121B] px-3 py-2 text-slate-900 dark:text-white font-mono text-xs outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                                        Heure Début
                                    </label>
                                    <input
                                        type="time"
                                        value={newStart}
                                        onChange={(e) => setNewStart(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0D121B] px-3 py-2 text-slate-900 dark:text-white font-mono text-xs text-center outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                                        Heure Fin
                                    </label>
                                    <input
                                        type="time"
                                        value={newEnd}
                                        onChange={(e) => setNewEnd(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0D121B] px-3 py-2 text-slate-900 dark:text-white font-mono text-xs text-center outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Notes / Consignes */}
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                                    Notes & consignes d'accès
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Ex: Code portail 4589B, contacter le gardien..."
                                    value={newNotes}
                                    onChange={(e) => setNewNotes(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0D121B] px-3.5 py-2 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.08]">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Annuler
                            </button>
                            <PillButton
                                type="submit"
                                loading={actionLoading}
                                variant="primary"
                                icon={<Check size={14} />}
                            >
                                Confirmer la planification
                            </PillButton>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
