'use client'

import { useState } from 'react'
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock,
    MapPin, User, Plus, Filter, CheckCircle2, AlertCircle,
    Building2, HardHat, Phone, X, Check
} from 'lucide-react'

export interface PlanningIntervention {
    id: string
    title: string
    chantierName: string
    clientName: string
    address: string
    technicien: string
    zone: string
    dayIndex: number // 0 = Lundi, 1 = Mardi, 2 = Mercredi, 3 = Jeudi, 4 = Vendredi, 5 = Samedi
    startTime: string // "08:30"
    endTime: string   // "10:30"
    color: 'rose' | 'blue' | 'purple' | 'emerald' | 'amber'
    status: 'planifie' | 'en_cours' | 'termine'
    notes?: string
}

const INITIAL_INTERVENTIONS: PlanningIntervention[] = [
    // LUNDI 19/10
    {
        id: 'int-1',
        title: 'Métré & Sondage Acrotères',
        chantierName: 'RESIDENCE PLEIN AIR',
        clientName: 'FONCIA Rives de Seine',
        address: '14 Rue de Conflans, 78700 Conflans-Sainte-Honorine',
        technicien: 'VINUESA Alexandre',
        zone: 'Paris Ouest (78)',
        dayIndex: 0,
        startTime: '08:30',
        endTime: '11:00',
        color: 'rose',
        status: 'termine',
        notes: 'Vérification dimensionnelle des relevés de couvertines alu'
    },
    {
        id: 'int-2',
        title: 'Installation Base-Vie & Roulotte raccordée',
        chantierName: 'RESIDENCE LES JASMINS',
        clientName: 'Syndic LAMY Poissy',
        address: '32 Rue Paul Cézanne, 78300 Poissy',
        technicien: 'VINUESA Alexandre',
        zone: 'Paris Ouest (78)',
        dayIndex: 0,
        startTime: '13:30',
        endTime: '17:00',
        color: 'rose',
        status: 'termine',
        notes: 'Raccordement électrique et eau avec le gardien'
    },

    // MARDI 20/10 (Aujourd'hui)
    {
        id: 'int-3',
        title: 'Lavage Haute Pression Façade Bât. A & B',
        chantierName: 'RESIDENCE LES JASMINS',
        clientName: 'Syndic LAMY Poissy',
        address: '32 Rue Paul Cézanne, 78300 Poissy',
        technicien: 'Équipe 1 - Façade & Ravalement',
        zone: 'Paris Ouest (78)',
        dayIndex: 1,
        startTime: '08:30',
        endTime: '12:00',
        color: 'blue',
        status: 'en_cours',
        notes: 'Lavage eau chaude 140 bars + pulvérisation fongicide rémanent'
    },
    {
        id: 'int-4',
        title: 'Relevé Voirie & Balisage Piétons',
        chantierName: '76 AVENUE DE PARIS',
        clientName: 'Cabinet BARBEY Immobilier',
        address: '76 Avenue de Paris, 94160 Saint-Mandé',
        technicien: 'VINUESA Alexandre',
        zone: 'Paris Est (94)',
        dayIndex: 1,
        startTime: '14:00',
        endTime: '16:30',
        color: 'rose',
        status: 'en_cours',
        notes: 'Préparation dossier technique pour arrêté municipal'
    },

    // MERCREDI 21/10
    {
        id: 'int-5',
        title: 'Pose Couvertines Aluminium 15/10ème',
        chantierName: 'RESIDENCE PLEIN AIR',
        clientName: 'FONCIA Rives de Seine',
        address: '14 Rue de Conflans, 78700 Conflans-Sainte-Honorine',
        technicien: 'Équipe 2 - Échafaudages',
        zone: 'Paris Ouest (78)',
        dayIndex: 2,
        startTime: '08:30',
        endTime: '12:30',
        color: 'emerald',
        status: 'planifie',
        notes: 'Fixation pattes inox et joints néoprène d\'étanchéité'
    },
    {
        id: 'int-6',
        title: 'Piquage Enduits & Reprise Bétons Fibrés R3',
        chantierName: 'RESIDENCE LES JASMINS',
        clientName: 'Syndic LAMY Poissy',
        address: '32 Rue Paul Cézanne, 78300 Poissy',
        technicien: 'Équipe 1 - Façade & Ravalement',
        zone: 'Paris Ouest (78)',
        dayIndex: 2,
        startTime: '13:30',
        endTime: '17:00',
        color: 'blue',
        status: 'planifie'
    },

    // JEUDI 22/10
    {
        id: 'int-7',
        title: 'Visite Technique Préalable Échafaudage',
        chantierName: '76 AVENUE DE PARIS',
        clientName: 'Cabinet BARBEY Immobilier',
        address: '76 Avenue de Paris, 94160 Saint-Mandé',
        technicien: 'DURAND Pierre (Conducteur)',
        zone: 'Paris Est (94)',
        dayIndex: 3,
        startTime: '09:00',
        endTime: '11:30',
        color: 'amber',
        status: 'planifie',
        notes: 'Contrôle implantation tunnel piétonnier sécurisé'
    },
    {
        id: 'int-8',
        title: 'Essai Teinte Nuancier D3 avec Conseil Syndical',
        chantierName: 'RESIDENCE LES JASMINS',
        clientName: 'Syndic LAMY Poissy',
        address: '32 Rue Paul Cézanne, 78300 Poissy',
        technicien: 'VINUESA Alexandre',
        zone: 'Paris Ouest (78)',
        dayIndex: 3,
        startTime: '14:00',
        endTime: '16:00',
        color: 'rose',
        status: 'planifie',
        notes: 'Application témoins RAL 9010 et Sable Doré sur pignon nord'
    },

    // VENDREDI 23/10
    {
        id: 'int-9',
        title: 'Contrôle Décennal SMA BTP & Suivi Drone Acrotères',
        chantierName: 'RESIDENCE PLEIN AIR',
        clientName: 'FONCIA Rives de Seine',
        address: '14 Rue de Conflans, 78700 Conflans-Sainte-Honorine',
        technicien: 'DURAND Pierre (Conducteur)',
        zone: 'Paris Ouest (78)',
        dayIndex: 4,
        startTime: '09:00',
        endTime: '12:00',
        color: 'amber',
        status: 'planifie'
    },
    {
        id: 'int-10',
        title: 'Réception Préalable Phase 1 - 5 Bâtiments',
        chantierName: 'RESIDENCE LES JASMINS',
        clientName: 'Syndic LAMY Poissy',
        address: '32 Rue Paul Cézanne, 78300 Poissy',
        technicien: 'VINUESA Alexandre',
        zone: 'Paris Ouest (78)',
        dayIndex: 4,
        startTime: '14:00',
        endTime: '16:30',
        color: 'rose',
        status: 'planifie',
        notes: 'Signature PV d\'avancement pour situation n°1'
    }
]

const DAYS = [
    { label: 'Lun', date: '19/10' },
    { label: 'Mar', date: '20/10' },
    { label: 'Mer', date: '21/10' },
    { label: 'Jeu', date: '22/10' },
    { label: 'Ven', date: '23/10' },
    { label: 'Sam', date: '24/10' }
]

const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
]

const TECHNICIENS = [
    'VINUESA Alexandre',
    'DURAND Pierre (Conducteur)',
    'Équipe 1 - Façade & Ravalement',
    'Équipe 2 - Échafaudages',
    'Tous les techniciens'
]

const ZONES = [
    'Toutes les zones',
    'Paris Ouest (78)',
    'Paris Est (77, 93, 94)',
    'Paris Nord (95)',
    'Paris Centre (75)'
]

export default function TechnicianSchedule() {
    const [interventions, setInterventions] = useState<PlanningIntervention[]>(INITIAL_INTERVENTIONS)
    const [selectedTech, setSelectedTech] = useState('VINUESA Alexandre')
    const [selectedZone, setSelectedZone] = useState('Toutes les zones')
    const [activeModalItem, setActiveModalItem] = useState<PlanningIntervention | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // Formulaire de nouvelle intervention
    const [newTitle, setNewTitle] = useState('')
    const [newChantier, setNewChantier] = useState('RESIDENCE LES JASMINS')
    const [newAddress, setNewAddress] = useState('35 Quater Boulevard Gambetta, 78300 Poissy')
    const [newDay, setNewDay] = useState(0)
    const [newStart, setNewStart] = useState('08:30')
    const [newEnd, setNewEnd] = useState('11:00')

    const filtered = interventions.filter(item => {
        if (selectedTech !== 'Tous les techniciens' && item.technicien !== selectedTech) return false
        if (selectedZone !== 'Toutes les zones' && item.zone !== selectedZone) return false
        return true
    })

    const handleCreateIntervention = (e: React.FormEvent) => {
        e.preventDefault()
        const newInt: PlanningIntervention = {
            id: `int-${Date.now()}`,
            title: newTitle || 'Intervention Chantier',
            chantierName: newChantier,
            clientName: 'Syndic',
            address: newAddress,
            technicien: selectedTech === 'Tous les techniciens' ? 'VINUESA Alexandre' : selectedTech,
            zone: 'Paris Ouest (78)',
            dayIndex: Number(newDay),
            startTime: newStart,
            endTime: newEnd,
            color: 'rose',
            status: 'planifie'
        }
        setInterventions([...interventions, newInt])
        setIsCreateModalOpen(false)
        setNewTitle('')
    }

    return (
        <div className="h-full flex flex-col overflow-hidden space-y-3 animate-in fade-in duration-300">
            {/* --- HEADER BAR (Issu de la capture Batiecom Photo 2) --- */}
            <div className="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#131B2A] backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Planning des Interventions</h1>
                            <span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-xs font-bold dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                                Semaine 42
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Planning hebdomadaire par technicien, zone géographique et chantier (Vue Progiciel BTP)
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Sélecteur Technicien */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">Technicien :</span>
                        <select
                            value={selectedTech}
                            onChange={(e) => setSelectedTech(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-[#0E1524] dark:text-slate-100"
                        >
                            {TECHNICIENS.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sélecteur Zone Géo */}
                    <select
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-[#0E1524] dark:text-slate-100"
                    >
                        {ZONES.map(z => (
                            <option key={z} value={z}>{z}</option>
                        ))}
                    </select>

                    {/* Bouton Nouvelle Intervention */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 transition-all active:scale-95"
                    >
                        <Plus size={15} />
                        Planifier
                    </button>
                </div>
            </div>

            {/* --- GRILLE DU PLANNING HEBDOMADAIRE (Batiecom BLUE SELECT Style) --- */}
            <div className="flex-1 min-h-0 flex flex-col rounded-[24px] border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-[#131B2A]">
                {/* Header Jours */}
                <div className="shrink-0 grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center dark:border-slate-800 dark:bg-[#0E1524]">
                    <div className="p-3 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center">
                        <Clock size={14} className="mr-1" /> Heure
                    </div>
                    {DAYS.map((day, idx) => (
                        <div
                            key={idx}
                            className={`p-3 text-xs font-bold uppercase border-r border-slate-200 last:border-r-0 dark:border-slate-800 ${
                                idx === 4 ? 'bg-indigo-50/40 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'
                            }`}
                        >
                            <span>{day.label} </span>
                            <span className="font-mono text-[11px] opacity-75">{day.date}</span>
                        </div>
                    ))}
                </div>

                {/* Corps de la grille horaire */}
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-xs">
                    {TIME_SLOTS.map((slot) => {
                        const slotHour = parseInt(slot.split(':')[0])

                        return (
                            <div key={slot} className="grid grid-cols-7 min-h-[72px]">
                                {/* Colonne Heure */}
                                <div className="p-2 text-center text-gray-400 bg-gray-50/40 border-r border-gray-200 dark:border-white/10 dark:bg-black/10 flex items-start justify-center pt-2">
                                    {slot}
                                </div>

                                {/* Colonnes des Jours */}
                                {DAYS.map((_, dayIndex) => {
                                    // Trouver les interventions qui commencent sur cette heure
                                    const slotInterventions = filtered.filter(item => {
                                        if (item.dayIndex !== dayIndex) return false
                                        const startHour = parseInt(item.startTime.split(':')[0])
                                        return startHour === slotHour
                                    })

                                    return (
                                        <div
                                            key={dayIndex}
                                            className="p-1 border-r border-gray-100 last:border-r-0 relative hover:bg-gray-50/50 dark:border-white/5 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            {slotInterventions.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setActiveModalItem(item)}
                                                    className="w-full text-left rounded-lg p-2 transition-all hover:scale-[1.02] shadow-sm mb-1 bg-rose-100/90 border border-rose-300/80 text-rose-950 dark:bg-rose-950/70 dark:border-rose-500/40 dark:text-rose-100"
                                                >
                                                    <div className="flex items-center justify-between text-[10px] font-bold opacity-80 mb-0.5">
                                                        <span>{item.startTime} - {item.endTime}</span>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${
                                                            item.status === 'termine' ? 'bg-emerald-500' :
                                                            item.status === 'en_cours' ? 'bg-blue-500' : 'bg-rose-400'
                                                        }`} />
                                                    </div>
                                                    <div className="font-extrabold text-[11px] truncate leading-tight uppercase tracking-tight">
                                                        {item.chantierName}
                                                    </div>
                                                    <div className="text-[10px] opacity-75 truncate font-sans">
                                                        {item.title}
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

                {/* Footer avec compteur journalier (comme dans Batiecom) */}
                <div className="shrink-0 grid grid-cols-7 border-t border-gray-200 bg-gray-50/90 text-center dark:border-white/10 dark:bg-black/30 py-2.5 font-bold text-xs">
                    <div className="text-gray-500 uppercase tracking-wider text-[11px]">Interventions</div>
                    {DAYS.map((_, dayIndex) => {
                        const count = filtered.filter(i => i.dayIndex === dayIndex).length
                        return (
                            <div key={dayIndex} className="font-mono text-blue-600 dark:text-blue-400">
                                {count}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* --- MODAL DÉTAIL D'INTERVENTION --- */}
            {activeModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModalItem(null)} />
                    <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#131B2A] animate-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 mb-1 border border-indigo-100 dark:border-indigo-900/50">
                                    {activeModalItem.startTime} - {activeModalItem.endTime} • {DAYS[activeModalItem.dayIndex].label} {DAYS[activeModalItem.dayIndex].date}
                                </span>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {activeModalItem.chantierName}
                                </h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {activeModalItem.title}
                                </p>
                            </div>
                            <button onClick={() => setActiveModalItem(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3 border-y border-slate-100 py-4 my-4 dark:border-slate-800/80 text-sm">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <Building2 size={16} className="text-indigo-500 shrink-0" />
                                <span>Client / Syndic : <strong>{activeModalItem.clientName}</strong></span>
                            </div>
                            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                                <MapPin size={16} className="text-rose-500 shrink-0 mt-0.5" />
                                <span>{activeModalItem.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <HardHat size={16} className="text-amber-500 shrink-0" />
                                <span>Technicien assigné : <strong>{activeModalItem.technicien}</strong></span>
                            </div>
                            {activeModalItem.notes && (
                                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-[#0E1524] dark:text-slate-400 italic border border-slate-100 dark:border-slate-800">
                                    Consignes : {activeModalItem.notes}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setActiveModalItem(null)}
                                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL DE CRÉATION D'INTERVENTION --- */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
                    <form onSubmit={handleCreateIntervention} className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#131B2A] animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Plus size={18} className="text-indigo-600 dark:text-indigo-400" /> Planifier une intervention
                            </h3>
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Chantier</label>
                                <input
                                    type="text"
                                    value={newChantier}
                                    onChange={(e) => setNewChantier(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-[#0E1524] dark:text-white text-xs font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Mission / Travaux</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Pose échafaudage, Ravalement D2..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-[#0E1524] dark:text-white text-xs font-medium placeholder-slate-400 dark:placeholder-slate-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Adresse</label>
                                <input
                                    type="text"
                                    value={newAddress}
                                    onChange={(e) => setNewAddress(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-[#0E1524] dark:text-white text-xs font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Jour</label>
                                    <select
                                        value={newDay}
                                        onChange={(e) => setNewDay(parseInt(e.target.value))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-[#0E1524] dark:text-white"
                                    >
                                        {DAYS.map((d, i) => (
                                            <option key={i} value={i}>{d.label} {d.date}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Début</label>
                                    <input
                                        type="text"
                                        value={newStart}
                                        onChange={(e) => setNewStart(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-mono text-center text-slate-900 dark:border-slate-800 dark:bg-[#0E1524] dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Fin</label>
                                    <input
                                        type="text"
                                        value={newEnd}
                                        onChange={(e) => setNewEnd(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-mono text-center text-slate-900 dark:border-slate-800 dark:bg-[#0E1524] dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-xl px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
