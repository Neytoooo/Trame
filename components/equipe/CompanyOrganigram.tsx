'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Network,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    X,
    Crown,
    HardHat,
    ShieldCheck,
    Briefcase,
    ArrowUpRight,
    Sparkles
} from 'lucide-react'
import CircularGlass3DBadge, { OrganigramNode } from './MetalBadge3D'
import { TeamMember, CompanyTotals } from '@/lib/teamData'

interface CompanyOrganigramProps {
    members: TeamMember[]
    companyTotals: CompanyTotals
    onSelectMemberDetails?: (member: TeamMember) => void
}

interface WireConnection {
    id: string
    parentId: string
    childId: string
    path: string
    isHighlighted: boolean
}

export default function CompanyOrganigram({
    members,
    companyTotals,
    onSelectMemberDetails
}: CompanyOrganigramProps) {
    const [zoom, setZoom] = useState<number>(1)
    const [badgeTheme, setBadgeTheme] = useState<'metallic' | 'ruby'>('ruby')
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
    const [selectedNodeForModal, setSelectedNodeForModal] = useState<OrganigramNode | null>(null)

    const treeContainerRef = useRef<HTMLDivElement>(null)
    const [wires, setWires] = useState<WireConnection[]>([])

    // Arbre hiérarchique dynamique et réactif selon les collaborateurs réels
    const organigramNodes: OrganigramNode[] = useMemo(() => {
        if (!members || members.length === 0) return []

        // 1. Trouver le nœud racine (Direction Générale / Niveau 1)
        // Priorité : un admin dont manager_id est null, ou le premier membre
        const rootCandidate = members.find(m => !m.manager_id && (m.role.toLowerCase().includes('admin') || m.role.toLowerCase().includes('direction')))
            || members.find(m => !m.manager_id)
            || members[0]

        const rootId = rootCandidate.id

        // Helper pour mapper le département et le poste complet selon le rôle
        const getDeptAndPoste = (role: string): {
            dept: 'Direction' | 'Travaux & Chantiers' | 'Affaires & Commerce' | 'Études & Métré' | 'Finance & Admin'
            poste: string
            accent: 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose' | 'violet'
        } => {
            const r = (role || '').toLowerCase()
            if (r.includes('admin') || r.includes('direct')) {
                return { dept: 'Direction', poste: 'Président & Directeur Général BTP', accent: 'indigo' }
            }
            if (r.includes('conducteur') || r.includes('travaux')) {
                return { dept: 'Travaux & Chantiers', poste: 'Conduite de Travaux & Chantier', accent: 'emerald' }
            }
            if (r.includes('chef') || r.includes('chantier')) {
                return { dept: 'Travaux & Chantiers', poste: 'Chef de Chantier - Gros Œuvre & Structure', accent: 'amber' }
            }
            if (r.includes('affaires') || r.includes('charge') || r.includes('commercial')) {
                return { dept: 'Affaires & Commerce', poste: 'Responsable Commercial & Chargé d\'Affaires BTP', accent: 'sky' }
            }
            if (r.includes('metreur') || r.includes('chiffreur') || r.includes('étude')) {
                return { dept: 'Études & Métré', poste: 'Responsable Études de Prix, DQE & Métrés', accent: 'indigo' }
            }
            if (r.includes('compta') || r.includes('finance')) {
                return { dept: 'Finance & Admin', poste: 'Responsable Comptabilité, Facturation & Trésorerie', accent: 'rose' }
            }
            return { dept: 'Travaux & Chantiers', poste: role, accent: 'indigo' }
        }

        // 2. Associer chaque collaborateur à son manager
        const nodes = members.map((m, idx) => {
            const isRoot = m.id === rootId
            let effectiveManagerId: string | null = null

            if (!isRoot) {
                if (m.manager_id && members.some(other => other.id === m.manager_id && other.id !== m.id)) {
                    effectiveManagerId = m.manager_id
                } else {
                    effectiveManagerId = rootId
                }
            }

            const { dept, poste, accent } = getDeptAndPoste(m.role)

            return {
                id: m.id,
                memberId: m.id,
                nom: m.nom || 'Collaborateur',
                prenom: m.prenom || '',
                role: m.role || 'Collaborateur',
                posteComplet: poste,
                departement: dept,
                niveau: isRoot ? 1 : 2,
                email: m.email || '',
                telephone: m.telephone || '',
                initials: m.initials || `${m.prenom?.[0] || 'U'}${m.nom?.[0] || ''}`.toUpperCase(),
                accentColor: m.accentColor || accent,
                statut: m.statut || 'Actif',
                managerId: effectiveManagerId,
                subordinateIds: [] as string[],
                caEncaisse: m.caEncaisse || 0,
                devisEnAttente: m.devisEnAttente || 0,
                nbChantiers: m.nbChantiers || 0,
                matricule: `${String(idx + 1).padStart(3, '0')}-BTP`
            } as OrganigramNode
        })

        // 3. Calculer les subordonnés directs
        nodes.forEach(node => {
            node.subordinateIds = nodes
                .filter(n => n.managerId === node.id)
                .map(n => n.id)
        })

        // 4. Calculer la profondeur hiérarchique (niveau 1, 2, ou 3)
        nodes.forEach(node => {
            if (!node.managerId) {
                node.niveau = 1
            } else {
                const parent = nodes.find(n => n.id === node.managerId)
                if (parent?.niveau === 1) {
                    node.niveau = 2
                } else {
                    node.niveau = 3
                }
            }
        })

        return nodes
    }, [members, companyTotals])

    // Groupements hiérarchiques réactifs
    const level1Nodes = useMemo(() => organigramNodes.filter(n => n.niveau === 1), [organigramNodes])
    const level2Nodes = useMemo(() => organigramNodes.filter(n => n.niveau === 2), [organigramNodes])

    const hoveredNode = useMemo(() => {
        return organigramNodes.find(n => n.id === hoveredNodeId)
    }, [hoveredNodeId, organigramNodes])

    const isConnectedToHovered = (nodeId: string) => {
        if (!hoveredNode) return false
        if (nodeId === hoveredNode.id) return true
        if (nodeId === hoveredNode.managerId) return true
        if (hoveredNode.subordinateIds.includes(nodeId)) return true
        return false
    }

    const getManagerName = (managerId: string | null) => {
        if (!managerId) return null
        const m = organigramNodes.find(n => n.id === managerId)
        return m ? `${m.prenom} ${m.nom}` : null
    }

    // =========================================================================
    // CALCUL DYNAMIQUE DES FILS / CÂBLES COURBÉS (BÉZIER DIRECT ENTRE CERCLES)
    // =========================================================================
    const calculateWires = useCallback(() => {
        if (!treeContainerRef.current) return
        const container = treeContainerRef.current
        const containerRect = container.getBoundingClientRect()

        const newWires: WireConnection[] = []

        // Parcours de tous les nœuds ayant un supérieur (managerId)
        organigramNodes.forEach(childNode => {
            if (!childNode.managerId) return

            const parentEl = container.querySelector(`[data-node-id="${childNode.managerId}"]`) as HTMLElement
            const childEl = container.querySelector(`[data-node-id="${childNode.id}"]`) as HTMLElement

            if (!parentEl || !childEl) return

            const parentBadge = (parentEl.querySelector('.perspective-1000') || parentEl) as HTMLElement
            const childBadge = (childEl.querySelector('.perspective-1000') || childEl) as HTMLElement

            const pRect = parentBadge.getBoundingClientRect()
            const cRect = childBadge.getBoundingClientRect()

            // Point de départ : bas du cercle parent
            const startX = (pRect.left + pRect.width / 2) - containerRect.left + container.scrollLeft
            const startY = pRect.bottom - containerRect.top + container.scrollTop - 4

            // Point d'arrivée : haut du cercle enfant
            const endX = (cRect.left + cRect.width / 2) - containerRect.left + container.scrollLeft
            const endY = cRect.top - containerRect.top + container.scrollTop + 4

            // Courbure de Bézier naturelle (comme dessiné dans le schéma Paint)
            const deltaY = endY - startY
            const cpY1 = startY + deltaY * 0.55
            const cpY2 = endY - deltaY * 0.55

            const path = `M ${startX} ${startY} C ${startX} ${cpY1}, ${endX} ${cpY2}, ${endX} ${endY}`

            // Vérifie si le fil est surligné (si le parent ou l'enfant est survolé)
            const isHighlighted =
                hoveredNodeId === childNode.id ||
                hoveredNodeId === childNode.managerId

            newWires.push({
                id: `wire-${childNode.managerId}-${childNode.id}`,
                parentId: childNode.managerId,
                childId: childNode.id,
                path,
                isHighlighted
            })
        })

        setWires(newWires)
    }, [organigramNodes, hoveredNodeId])

    // Recalculer les fils au montage, au zoom, au redimensionnement et au changement d'organigramme
    useEffect(() => {
        calculateWires()
        const timer1 = setTimeout(calculateWires, 50)
        const timer2 = setTimeout(calculateWires, 200)
        window.addEventListener('resize', calculateWires)
        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            window.removeEventListener('resize', calculateWires)
        }
    }, [calculateWires, zoom, organigramNodes])

    return (
        <div className="relative flex-1 flex flex-col min-h-0 bg-[#070B12]/95 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md overflow-hidden">
            {/* =========================================================================
                1. EN-TÊTE ÉPURÉ
               ========================================================================= */}
            <div className="shrink-0 px-5 py-3 border-b border-white/10 bg-slate-950/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/30 to-white/5 border border-white/30 shadow-sm flex items-center justify-center">
                        <Network size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                            Organigramme Hiérarchique
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/15">
                                Badges Ronds 3D & Fils Connectés
                            </span>
                        </h2>
                        <p className="text-[11px] text-slate-400">
                            Fils directs connectés entre collaborateurs. Survolez un badge pour voir sa section.
                        </p>
                    </div>
                </div>

                {/* Légende Hiérarchie 3D + Zoom */}
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center bg-white/[0.06] border border-white/10 rounded-xl px-2.5 py-1 text-xs gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                            <span className="text-[11px] font-semibold text-rose-200">Direction (Rubis)</span>
                        </div>
                        <span className="text-white/20">|</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-[0_0_8px_#cbd5e1]" />
                            <span className="text-[11px] font-semibold text-slate-300">Équipe (Obsidienne)</span>
                        </div>
                    </div>

                    <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-xl p-0.5 text-xs text-slate-300">
                        <button
                            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.65))}
                            title="Zoom arrière"
                            className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ZoomOut size={13} />
                        </button>
                        <span className="px-2 font-mono text-[11px] text-slate-400">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={() => setZoom(prev => Math.min(prev + 0.1, 1.35))}
                            title="Zoom avant"
                            className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ZoomIn size={13} />
                        </button>
                        <button
                            onClick={() => setZoom(1)}
                            title="Réinitialiser"
                            className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-l border-white/10 ml-0.5"
                        >
                            <RotateCcw size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* =========================================================================
                2. TOILE PRINCIPALE : BADGES RONDS + FILS SVG COURBÉS INTERCONNECTÉS
               ========================================================================= */}
            <div
                ref={treeContainerRef}
                onScroll={calculateWires}
                className="relative flex-1 overflow-auto p-6 sm:p-12 select-none flex flex-col items-center custom-scrollbar"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 50% 12%, rgba(225, 29, 72, 0.08) 0%, transparent 60%),
                        radial-gradient(circle at 20% 70%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
                        linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
                    `,
                    backgroundSize: '100% 100%, 100% 100%, 36px 36px, 36px 36px'
                }}
            >
                {/* -------------------------------------------------------------
                    CALQUE SVG D'ARRIÈRE-PLAN : LES VRAIS FILS COURBÉS ENTRE BADGES
                   ------------------------------------------------------------- */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-0"
                    style={{ minWidth: '100%', minHeight: '100%' }}
                >
                    <defs>
                        {/* Dégradé métallique pour les câbles au repos */}
                        <linearGradient id="wireGradientDefault" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.8" />
                            <stop offset="50%" stopColor="#64748b" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#475569" stopOpacity="0.8" />
                        </linearGradient>

                        {/* Dégradé lumineux pour les câbles actifs */}
                        <linearGradient id="wireGradientActive" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
                            <stop offset="50%" stopColor="#818cf8" stopOpacity="1" />
                            <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
                        </linearGradient>

                        {/* Filtre de lueur intense pour les fils */}
                        <filter id="wireGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#60a5fa" floodOpacity="0.85" />
                        </filter>
                    </defs>

                    {/* DESSIN DE CHAQUE FIL COURBÉ SELON LA HIÉRARCHIE */}
                    {wires.map(wire => (
                        <g key={wire.id}>
                            {/* Câble d'ombre portée */}
                            <path
                                d={wire.path}
                                fill="none"
                                stroke="#000000"
                                strokeWidth={wire.isHighlighted ? "6" : "4"}
                                strokeOpacity="0.6"
                                strokeLinecap="round"
                            />

                            {/* Câble physique courbé */}
                            <path
                                d={wire.path}
                                fill="none"
                                stroke={wire.isHighlighted ? "url(#wireGradientActive)" : "url(#wireGradientDefault)"}
                                strokeWidth={wire.isHighlighted ? "3.5" : "2.5"}
                                strokeLinecap="round"
                                filter={wire.isHighlighted ? "url(#wireGlow)" : undefined}
                                className="transition-all duration-300"
                            />

                            {/* Impulsion lumineuse animée voyageant le long du fil */}
                            <circle r={wire.isHighlighted ? "4.5" : "3"} fill={wire.isHighlighted ? "#ffffff" : "#93c5fd"}>
                                <animateMotion
                                    path={wire.path}
                                    dur={wire.isHighlighted ? "1.8s" : "3.2s"}
                                    repeatCount="indefinite"
                                />
                            </circle>
                        </g>
                    ))}
                </svg>

                {/* -------------------------------------------------------------
                    CONTENEUR DES NŒUDS RONDS (ARBRE HIÉRARCHIQUE)
                   ------------------------------------------------------------- */}
                <div
                    className="relative flex flex-col items-center transition-transform duration-200 origin-top z-10"
                    style={{
                        transform: `scale(${zoom})`,
                        width: 'max-content',
                        minWidth: '100%'
                    }}
                >
                    {/* =========================================================
                        NIVEAU 1 : DIRECTION GÉNÉRALE (Racine au sommet)
                       ========================================================= */}
                    {level1Nodes.length > 0 && (
                        <div className="flex flex-wrap justify-center items-center gap-10 mb-16 sm:mb-20">
                            {level1Nodes.map(node => (
                                <CircularGlass3DBadge
                                    key={node.id}
                                    node={node}
                                    managerName={null}
                                    theme={badgeTheme}
                                    isHighlighted={isConnectedToHovered(node.id)}
                                    isSelected={activeNodeId === node.id}
                                    isManagerOfHovered={hoveredNode?.managerId === node.id}
                                    isSubordinateOfHovered={hoveredNode?.subordinateIds.includes(node.id)}
                                    onSelect={() => {
                                        setActiveNodeId(node.id)
                                        setSelectedNodeForModal(node)
                                    }}
                                    onHover={(h) => {
                                        setHoveredNodeId(h ? node.id : null)
                                        calculateWires()
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* =========================================================
                        NIVEAU 2 & NIVEAU 3 : BRANCHES PAR PÔLES ET RESPONSABLES
                       ========================================================= */}
                    <div className="flex flex-wrap justify-center items-start gap-12 sm:gap-20 pb-16">
                        {level2Nodes.map(l2Node => {
                            const subordinates = organigramNodes.filter(n => n.managerId === l2Node.id)

                            return (
                                <div key={l2Node.id} className="flex flex-col items-center min-w-[210px]">
                                    {/* Badge Niveau 2 (Responsable / Cadre BTP) */}
                                    <div className="mb-16 sm:mb-20">
                                        <CircularGlass3DBadge
                                            node={l2Node}
                                            managerName={getManagerName(l2Node.managerId)}
                                            theme={badgeTheme}
                                            isHighlighted={isConnectedToHovered(l2Node.id)}
                                            isSelected={activeNodeId === l2Node.id}
                                            isManagerOfHovered={hoveredNode?.managerId === l2Node.id}
                                            isSubordinateOfHovered={hoveredNode?.subordinateIds.includes(l2Node.id)}
                                            onSelect={() => {
                                                setActiveNodeId(l2Node.id)
                                                setSelectedNodeForModal(l2Node)
                                            }}
                                            onHover={(h) => {
                                                setHoveredNodeId(h ? l2Node.id : null)
                                                calculateWires()
                                            }}
                                        />
                                    </div>

                                    {/* Subordonnés Niveau 3 rattachés à ce responsable */}
                                    {subordinates.length > 0 ? (
                                        <div className="flex flex-wrap justify-center items-start gap-8">
                                            {subordinates.map(subNode => {
                                                const subSubordinates = organigramNodes.filter(n => n.managerId === subNode.id)

                                                return (
                                                    <div key={subNode.id} className="flex flex-col items-center">
                                                        <CircularGlass3DBadge
                                                            node={subNode}
                                                            managerName={getManagerName(subNode.managerId)}
                                                            theme={badgeTheme}
                                                            isHighlighted={isConnectedToHovered(subNode.id)}
                                                            isSelected={activeNodeId === subNode.id}
                                                            isManagerOfHovered={hoveredNode?.managerId === subNode.id}
                                                            isSubordinateOfHovered={hoveredNode?.subordinateIds.includes(subNode.id)}
                                                            onSelect={() => {
                                                                setActiveNodeId(subNode.id)
                                                                setSelectedNodeForModal(subNode)
                                                            }}
                                                            onHover={(h) => {
                                                                setHoveredNodeId(h ? subNode.id : null)
                                                                calculateWires()
                                                            }}
                                                        />

                                                        {/* Subordonnés Niveau 4 éventuels */}
                                                        {subSubordinates.length > 0 && (
                                                            <div className="mt-14 flex flex-wrap justify-center gap-6">
                                                                {subSubordinates.map(subSub => (
                                                                    <CircularGlass3DBadge
                                                                        key={subSub.id}
                                                                        node={subSub}
                                                                        managerName={getManagerName(subSub.managerId)}
                                                                        theme={badgeTheme}
                                                                        isHighlighted={isConnectedToHovered(subSub.id)}
                                                                        isSelected={activeNodeId === subSub.id}
                                                                        isManagerOfHovered={hoveredNode?.managerId === subSub.id}
                                                                        isSubordinateOfHovered={hoveredNode?.subordinateIds.includes(subSub.id)}
                                                                        onSelect={() => {
                                                                            setActiveNodeId(subSub.id)
                                                                            setSelectedNodeForModal(subSub)
                                                                        }}
                                                                        onHover={(h) => {
                                                                            setHoveredNodeId(h ? subSub.id : null)
                                                                            calculateWires()
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex justify-center text-[10px] text-slate-500 font-mono pt-4">
                                            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5">Pôle autonome</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* =========================================================================
                3. LÉGENDE INFÉRIEURE
               ========================================================================= */}
            <div className="shrink-0 px-5 py-2.5 bg-slate-950/70 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 z-20">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-white">Sections de l'entreprise :</span>
                    <span className="inline-flex items-center gap-1.5 text-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                        Direction
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                        Travaux & Chantiers
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sky-300">
                        <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
                        Affaires & Commerce
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-indigo-300">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_#818cf8]" />
                        Études & Métré
                    </span>
                </div>

                <div className="text-[10px] text-slate-400 font-mono">
                    ✦ Les fils courbés relient physiquement les supérieurs à leurs collaborateurs
                </div>
            </div>

            {/* =========================================================================
                4. MODALE DE PROFIL CLIC RAPIDE
               ========================================================================= */}
            <AnimatePresence>
                {selectedNodeForModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 12 }}
                            className="relative w-full max-w-md bg-[#111827] border border-white/20 rounded-3xl p-6 shadow-2xl text-white"
                        >
                            <button
                                onClick={() => setSelectedNodeForModal(null)}
                                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={16} />
                            </button>

                            {/* En-tête avec cercle 3D */}
                            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 shadow-xl flex items-center justify-center bg-black shrink-0">
                                    <img
                                        src={selectedNodeForModal.niveau === 1 ? '/avatar-red.jpg' : '/avatar-black.jpg'}
                                        alt={`${selectedNodeForModal.prenom} ${selectedNodeForModal.nom}`}
                                        className="w-full h-full object-cover select-none pointer-events-none transform scale-105"
                                    />
                                    <div className="absolute bottom-1 px-1.5 py-0.2 rounded-full bg-black/80 border border-white/30 text-[9px] font-black text-white">
                                        {selectedNodeForModal.initials}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-lg font-bold text-white truncate">
                                        {selectedNodeForModal.prenom} {selectedNodeForModal.nom}
                                    </h3>
                                    <p className="text-xs text-slate-300 font-medium">
                                        {selectedNodeForModal.posteComplet}
                                    </p>
                                    <span className="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                        Section : {selectedNodeForModal.departement}
                                    </span>
                                </div>
                            </div>

                            {/* Hiérarchie */}
                            <div className="my-4 space-y-2 text-xs">
                                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-between">
                                    <span className="text-slate-400 font-mono text-[11px]">Rattachement N+1 :</span>
                                    <span className="font-semibold text-slate-200">
                                        {selectedNodeForModal.managerId
                                            ? getManagerName(selectedNodeForModal.managerId)
                                            : 'Direction Générale (Présidence)'}
                                    </span>
                                </div>

                                {selectedNodeForModal.subordinateIds.length > 0 && (
                                    <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5">
                                        <span className="text-slate-400 block mb-1.5 font-mono text-[11px]">
                                            Collaborateurs rattachés ({selectedNodeForModal.subordinateIds.length}) :
                                        </span>
                                        <div className="space-y-1">
                                            {selectedNodeForModal.subordinateIds.map(subId => {
                                                const sub = organigramNodes.find(n => n.id === subId)
                                                return sub ? (
                                                    <div key={subId} className="flex justify-between text-slate-300 font-medium text-[11px] bg-black/20 p-2 rounded-xl">
                                                        <span>{sub.prenom} {sub.nom}</span>
                                                        <span className="text-slate-400 text-[10px]">{sub.role}</span>
                                                    </div>
                                                ) : null
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                                <button
                                    onClick={() => setSelectedNodeForModal(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 transition-colors"
                                >
                                    Fermer
                                </button>
                                {onSelectMemberDetails && (
                                    <button
                                        onClick={() => {
                                            const matched = members.find(m => m.id === selectedNodeForModal.memberId) || members[0]
                                            if (matched) {
                                                setSelectedNodeForModal(null)
                                                onSelectMemberDetails(matched)
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all"
                                    >
                                        Consulter Dossier
                                        <ArrowUpRight size={13} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
