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

    // Arbre hiérarchique épuré
    const organigramNodes: OrganigramNode[] = useMemo(() => {
        const primaryMember = members[0] || {
            prenom: 'Mattis',
            nom: 'Khn',
            email: 'direction@trame-btp.fr',
            telephone: '+33 6 12 34 56 78',
            initials: 'MK',
            caEncaisse: companyTotals.totalCaEncaisse
        }

        const sophieMember = members.find(m => m.nom.toLowerCase().includes('martinez')) || members[1]
        const pierreMember = members.find(m => m.nom.toLowerCase().includes('durand')) || members[2]
        const marcMember = members.find(m => m.nom.toLowerCase().includes('lefebvre')) || members[3]
        const thomasMember = members.find(m => m.nom.toLowerCase().includes('bernard')) || members[4]

        return [
            // =========================================================================
            // NIVEAU 1 : DIRECTION GÉNÉRALE (Racine / Top)
            // =========================================================================
            {
                id: 'node-direction',
                memberId: primaryMember?.id || 'user-root',
                nom: primaryMember.nom || 'Khn',
                prenom: primaryMember.prenom || 'Mattis',
                role: 'Direction Générale',
                posteComplet: 'Président & Directeur Général BTP',
                departement: 'Direction',
                niveau: 1,
                email: primaryMember.email || 'direction@trame-btp.fr',
                telephone: primaryMember.telephone || '+33 6 12 34 56 78',
                initials: primaryMember.initials || 'MK',
                accentColor: 'indigo',
                statut: 'Actif',
                managerId: null,
                subordinateIds: ['node-travaux', 'node-affaires', 'node-metreur', 'node-finance'],
                caEncaisse: companyTotals.totalCaEncaisse,
                devisEnAttente: companyTotals.totalDevisEnAttente,
                nbChantiers: companyTotals.totalChantiers,
                matricule: '001-DG'
            },

            // =========================================================================
            // NIVEAU 2 : RESPONSABLES DE PÔLES / CADRES (Rattachés à la Direction)
            // =========================================================================
            {
                id: 'node-travaux',
                memberId: sophieMember?.id || 'member-sophie',
                nom: sophieMember?.nom || 'Martinez',
                prenom: sophieMember?.prenom || 'Sophie',
                role: 'Conduite de Travaux',
                posteComplet: 'Directrice Conduite de Travaux & Chantier',
                departement: 'Travaux & Chantiers',
                niveau: 2,
                email: sophieMember?.email || 'sophie.m@trame-btp.fr',
                telephone: sophieMember?.telephone || '+33 6 23 45 67 89',
                initials: sophieMember?.initials || 'SM',
                accentColor: 'emerald',
                statut: sophieMember?.statut || 'Actif',
                managerId: 'node-direction',
                subordinateIds: ['node-chef-gros-oeuvre', 'node-conducteur-second-oeuvre'],
                caEncaisse: sophieMember?.caEncaisse || 142500,
                devisEnAttente: sophieMember?.devisEnAttente || 68400,
                nbChantiers: sophieMember?.nbChantiers || 6,
                matricule: '002-CT'
            },
            {
                id: 'node-affaires',
                memberId: 'usr-thomas-ca',
                nom: 'Laurent',
                prenom: 'Thomas',
                role: 'Chargé d\'Affaires',
                posteComplet: 'Responsable Commercial & Chargé d\'Affaires BTP',
                departement: 'Affaires & Commerce',
                niveau: 2,
                email: 'thomas.laurent@trame-btp.fr',
                telephone: '+33 6 45 12 89 23',
                initials: 'TL',
                accentColor: 'sky',
                statut: 'Actif',
                managerId: 'node-direction',
                subordinateIds: ['node-charge-affaires-clim'],
                caEncaisse: 124800,
                devisEnAttente: 78500,
                nbChantiers: 5,
                matricule: '003-CA'
            },
            {
                id: 'node-metreur',
                memberId: 'usr-mattis-metreur',
                nom: 'Khn',
                prenom: 'Mattis (Second)',
                role: 'Métreur / Chiffreur',
                posteComplet: 'Responsable Études de Prix, DQE & Métrés',
                departement: 'Études & Métré',
                niveau: 2,
                email: 'mattiskhn2@gmail.com',
                telephone: '+33 6 98 76 54 32',
                initials: 'MK',
                accentColor: 'indigo',
                statut: 'Actif',
                managerId: 'node-direction',
                subordinateIds: [],
                caEncaisse: 98000,
                devisEnAttente: 62000,
                nbChantiers: 4,
                matricule: '004-MT'
            },
            {
                id: 'node-finance',
                memberId: 'usr-claire-compta',
                nom: 'Bernard',
                prenom: 'Claire',
                role: 'Responsable Comptabilité',
                posteComplet: 'Responsable Comptabilité, Facturation & Trésorerie',
                departement: 'Finance & Admin',
                niveau: 2,
                email: 'claire.bernard@trame-btp.fr',
                telephone: '+33 6 54 89 63 21',
                initials: 'CB',
                accentColor: 'rose',
                statut: 'Actif',
                managerId: 'node-direction',
                subordinateIds: [],
                caEncaisse: companyTotals.totalCaEncaisse,
                devisEnAttente: companyTotals.totalDevisEnAttente,
                nbChantiers: companyTotals.totalChantiers,
                matricule: '005-FC'
            },

            // =========================================================================
            // NIVEAU 3 : TERRAIN & CHEFS DE CHANTIER (Rattachés aux Cadres)
            // =========================================================================
            {
                id: 'node-chef-gros-oeuvre',
                memberId: pierreMember?.id || 'member-pierre',
                nom: pierreMember?.nom || 'Durand',
                prenom: pierreMember?.prenom || 'Pierre',
                role: 'Chef de Chantier',
                posteComplet: 'Chef de Chantier Principal - Gros Œuvre & Structure',
                departement: 'Travaux & Chantiers',
                niveau: 3,
                email: pierreMember?.email || 'pierre.d@trame-btp.fr',
                telephone: pierreMember?.telephone || '+33 6 34 56 78 90',
                initials: pierreMember?.initials || 'PD',
                accentColor: 'amber',
                statut: pierreMember?.statut || 'En chantier',
                managerId: 'node-travaux',
                subordinateIds: [],
                caEncaisse: pierreMember?.caEncaisse || 118200,
                devisEnAttente: pierreMember?.devisEnAttente || 45200,
                nbChantiers: pierreMember?.nbChantiers || 5,
                matricule: '006-CC'
            },
            {
                id: 'node-conducteur-second-oeuvre',
                memberId: thomasMember?.id || 'member-thomas',
                nom: thomasMember?.nom || 'Bernard',
                prenom: thomasMember?.prenom || 'Thomas',
                role: 'Conducteur de Travaux',
                posteComplet: 'Conducteur de Travaux - Second Œuvre & Finition',
                departement: 'Travaux & Chantiers',
                niveau: 3,
                email: thomasMember?.email || 'thomas.b@trame-btp.fr',
                telephone: thomasMember?.telephone || '+33 6 56 78 90 12',
                initials: thomasMember?.initials || 'TB',
                accentColor: 'violet',
                statut: thomasMember?.statut || 'En déplacement',
                managerId: 'node-travaux',
                subordinateIds: [],
                caEncaisse: thomasMember?.caEncaisse || 87900,
                devisEnAttente: thomasMember?.devisEnAttente || 34800,
                nbChantiers: thomasMember?.nbChantiers || 4,
                matricule: '007-CT'
            },
            {
                id: 'node-charge-affaires-clim',
                memberId: marcMember?.id || 'member-marc',
                nom: marcMember?.nom || 'Lefebvre',
                prenom: marcMember?.prenom || 'Marc',
                role: 'Chargé d\'Affaires',
                posteComplet: 'Chargé d\'Affaires - Électricité & Génie Climatique',
                departement: 'Affaires & Commerce',
                niveau: 3,
                email: marcMember?.email || 'marc.l@trame-btp.fr',
                telephone: marcMember?.telephone || '+33 6 45 67 89 01',
                initials: marcMember?.initials || 'ML',
                accentColor: 'sky',
                statut: marcMember?.statut || 'Actif',
                managerId: 'node-affaires',
                subordinateIds: [],
                caEncaisse: marcMember?.caEncaisse || 96400,
                devisEnAttente: marcMember?.devisEnAttente || 82100,
                nbChantiers: marcMember?.nbChantiers || 7,
                matricule: '008-CA'
            }
        ]
    }, [members, companyTotals])

    // Groupements hiérarchiques
    const level1Node = organigramNodes.find(n => n.niveau === 1)
    const level2Nodes = useMemo(() => organigramNodes.filter(n => n.niveau === 2), [organigramNodes])
    const travauxSubordinates = useMemo(() => organigramNodes.filter(n => n.managerId === 'node-travaux'), [organigramNodes])
    const affairesSubordinates = useMemo(() => organigramNodes.filter(n => n.managerId === 'node-affaires'), [organigramNodes])

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

    // Recalculer les fils au montage, au zoom, au redimensionnement et au survol
    useEffect(() => {
        calculateWires()
        const timer = setTimeout(calculateWires, 100)
        window.addEventListener('resize', calculateWires)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', calculateWires)
        }
    }, [calculateWires, zoom])

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
                        NIVEAU 1 : DIRECTION GÉNÉRALE (1 Cercle au sommet)
                       ========================================================= */}
                    {level1Node && (
                        <div className="flex flex-col items-center mb-16 sm:mb-20">
                            <CircularGlass3DBadge
                                node={level1Node}
                                managerName={null}
                                theme={badgeTheme}
                                isHighlighted={isConnectedToHovered(level1Node.id)}
                                isSelected={activeNodeId === level1Node.id}
                                isManagerOfHovered={hoveredNode?.managerId === level1Node.id}
                                isSubordinateOfHovered={hoveredNode?.subordinateIds.includes(level1Node.id)}
                                onSelect={() => {
                                    setActiveNodeId(level1Node.id)
                                    setSelectedNodeForModal(level1Node)
                                }}
                                onHover={(h) => {
                                    setHoveredNodeId(h ? level1Node.id : null)
                                    calculateWires()
                                }}
                            />
                        </div>
                    )}

                    {/* =========================================================
                        NIVEAU 2 : LES 4 PÔLES CADRES (Cercles en éventail reliés par les fils)
                       ========================================================= */}
                    <div className="grid grid-cols-4 gap-12 sm:gap-20 items-start mb-16 sm:mb-20">
                        {level2Nodes.map(node => (
                            <div key={node.id} className="flex flex-col items-center">
                                <CircularGlass3DBadge
                                    node={node}
                                    managerName={getManagerName(node.managerId)}
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
                            </div>
                        ))}
                    </div>

                    {/* =========================================================
                        NIVEAU 3 : CHEFS DE CHANTIER & TERRAIN (Reliés à leur responsable)
                       ========================================================= */}
                    <div className="grid grid-cols-4 gap-12 sm:gap-20 items-start pb-12">
                        {/* 1. Équipe Travaux (Pierre Durand & Thomas Bernard) */}
                        <div className="flex items-start justify-center gap-8">
                            {travauxSubordinates.map(node => (
                                <div key={node.id} className="flex flex-col items-center">
                                    <CircularGlass3DBadge
                                        node={node}
                                        managerName={getManagerName(node.managerId)}
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
                                </div>
                            ))}
                        </div>

                        {/* 2. Équipe Affaires (Marc Lefebvre) */}
                        <div className="flex items-start justify-center">
                            {affairesSubordinates.map(node => (
                                <div key={node.id} className="flex flex-col items-center">
                                    <CircularGlass3DBadge
                                        node={node}
                                        managerName={getManagerName(node.managerId)}
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
                                </div>
                            ))}
                        </div>

                        {/* 3. Pôle Études */}
                        <div className="flex justify-center text-[10px] text-slate-500 font-mono pt-4">
                            <span>Autonome</span>
                        </div>

                        {/* 4. Pôle Finance */}
                        <div className="flex justify-center text-[10px] text-slate-500 font-mono pt-4">
                            <span>Autonome</span>
                        </div>
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
