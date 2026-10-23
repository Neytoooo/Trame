'use client'

import React, { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Crown,
    HardHat,
    Briefcase,
    ShieldCheck,
    Building2,
    Users,
    Mail,
    Phone,
    Sparkles
} from 'lucide-react'

export interface OrganigramNode {
    id: string
    memberId: string
    nom: string
    prenom: string
    role: string
    posteComplet: string
    departement: 'Direction' | 'Travaux & Chantiers' | 'Affaires & Commerce' | 'Études & Métré' | 'Finance & Admin'
    niveau: 1 | 2 | 3
    email: string
    telephone: string
    initials: string
    accentColor: 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose' | 'violet'
    statut: 'Actif' | 'En chantier' | 'En déplacement' | 'Congés'
    managerId: string | null
    subordinateIds: string[]
    caEncaisse?: number
    devisEnAttente?: number
    nbChantiers?: number
    matricule: string
}

interface CircularGlass3DBadgeProps {
    node: OrganigramNode
    managerName?: string | null
    theme?: 'metallic' | 'ruby'
    isHighlighted?: boolean
    isSelected?: boolean
    isManagerOfHovered?: boolean
    isSubordinateOfHovered?: boolean
    onSelect?: () => void
    onHover?: (hovered: boolean) => void
}

export default function CircularGlass3DBadge({
    node,
    managerName,
    theme = 'ruby',
    isHighlighted = false,
    isSelected = false,
    isManagerOfHovered = false,
    isSubordinateOfHovered = false,
    onSelect,
    onHover
}: CircularGlass3DBadgeProps) {
    const badgeRef = useRef<HTMLDivElement>(null)
    const [rotateX, setRotateX] = useState(0)
    const [rotateY, setRotateY] = useState(0)
    const [glarePos, setGlarePos] = useState({ x: 30, y: 30, opacity: 0 })
    const [isHovered, setIsHovered] = useState(false)

    // Calcul 3D d'inclinaison selon la position du curseur
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!badgeRef.current) return
        const rect = badgeRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const centerX = rect.width / 2
        const centerY = rect.height / 2

        const rotX = ((y - centerY) / centerY) * -14
        const rotY = ((x - centerX) / centerX) * 14

        setRotateX(rotX)
        setRotateY(rotY)

        const glareX = (x / rect.width) * 100
        const glareY = (y / rect.height) * 100
        setGlarePos({ x: glareX, y: glareY, opacity: 0.85 })
    }

    const handleMouseEnter = () => {
        setIsHovered(true)
        onHover?.(true)
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
        setRotateX(0)
        setRotateY(0)
        setGlarePos({ x: 30, y: 30, opacity: 0 })
        onHover?.(false)
    }

    const isBoss = node.niveau === 1
    // Tailles parfaitement circulaires selon le niveau hiérarchique
    const sizeClasses = isBoss
        ? 'w-24 h-24 sm:w-28 sm:h-28'
        : node.niveau === 2
        ? 'w-20 h-20 sm:w-24 sm:h-24'
        : 'w-18 h-18 sm:w-20 sm:h-20'

    // Détails de la section
    const getDeptDetails = () => {
        switch (node.departement) {
            case 'Direction':
                return {
                    label: 'Direction Générale',
                    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                    glow: 'shadow-[0_0_35px_rgba(251,191,36,0.6)]',
                    ring: 'ring-amber-400',
                    colorHex: '#fbbf24'
                }
            case 'Travaux & Chantiers':
                return {
                    label: 'Travaux & Chantiers',
                    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    glow: 'shadow-[0_0_35px_rgba(52,211,153,0.6)]',
                    ring: 'ring-emerald-400',
                    colorHex: '#34d399'
                }
            case 'Affaires & Commerce':
                return {
                    label: 'Affaires & Commerce',
                    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                    glow: 'shadow-[0_0_35px_rgba(56,189,248,0.6)]',
                    ring: 'ring-sky-400',
                    colorHex: '#38bdf8'
                }
            case 'Études & Métré':
                return {
                    label: 'Études & Métré',
                    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
                    glow: 'shadow-[0_0_35px_rgba(129,140,248,0.6)]',
                    ring: 'ring-indigo-400',
                    colorHex: '#818cf8'
                }
            default:
                return {
                    label: 'Finance & Admin',
                    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                    glow: 'shadow-[0_0_35px_rgba(251,113,133,0.6)]',
                    ring: 'ring-rose-400',
                    colorHex: '#f43f5e'
                }
        }
    }

    const deptInfo = getDeptDetails()
    const isConnected = isHighlighted || isManagerOfHovered || isSubordinateOfHovered

    // Image 3D sélectionnée : Rouge uniquement pour le chef (niveau 1), Noir obsidienne pour tout le reste
    const avatarSrc = isBoss ? '/avatar-red.jpg' : '/avatar-black.jpg'

    return (
        <div
            id={`node-${node.id}`}
            data-node-id={node.id}
            className="relative flex flex-col items-center group select-none"
        >
            {/* =========================================================================
                LE BADGE 100% ROND EN 3D (IMAGE 3D RÉELLE + VERRE LENTILLE + INITIALES)
               ========================================================================= */}
            <div
                className="perspective-1000 cursor-pointer"
                style={{ perspective: '800px' }}
                onClick={onSelect}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <motion.div
                    ref={badgeRef}
                    animate={{
                        rotateX: rotateX,
                        rotateY: rotateY,
                        scale: isHovered || isSelected ? 1.15 : isConnected ? 1.06 : 1,
                        y: isHovered ? -6 : 0
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 24,
                        mass: 0.6
                    }}
                    className={`
                        relative ${sizeClasses} rounded-full flex items-center justify-center p-1.5
                        transition-shadow duration-300
                    `}
                    style={{
                        transformStyle: 'preserve-3d',
                        // Anneau circulaire 3D en verre réfractif
                        background: isBoss
                            ? `radial-gradient(circle at 35% 25%, 
                                rgba(255, 120, 140, 0.5) 0%, 
                                rgba(225, 29, 72, 0.3) 40%, 
                                rgba(136, 13, 30, 0.2) 70%, 
                                rgba(10, 0, 3, 0.85) 100%
                              )`
                            : `radial-gradient(circle at 35% 25%, 
                                rgba(255, 255, 255, 0.35) 0%, 
                                rgba(148, 163, 184, 0.15) 40%, 
                                rgba(51, 65, 85, 0.1) 70%, 
                                rgba(0, 0, 0, 0.85) 100%
                              )`,
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: isHovered || isSelected
                            ? isBoss
                                ? '0 0 35px rgba(225, 29, 72, 0.85), inset 0 0 0 2px rgba(255, 180, 195, 0.9), inset 0 3px 8px rgba(255, 255, 255, 0.8)'
                                : '0 0 30px rgba(255, 255, 255, 0.5), inset 0 0 0 2px rgba(255, 255, 255, 0.85), inset 0 3px 8px rgba(255, 255, 255, 0.7)'
                            : isConnected
                            ? isBoss
                                ? '0 0 25px rgba(225, 29, 72, 0.55), inset 0 0 0 2px rgba(251, 113, 133, 0.7)'
                                : '0 0 22px rgba(255, 255, 255, 0.35), inset 0 0 0 2px rgba(255, 255, 255, 0.6)'
                            : isBoss
                            ? '0 16px 32px -6px rgba(0, 0, 0, 0.85), inset 0 0 0 1.5px rgba(251, 113, 133, 0.5), inset 0 3px 6px rgba(255, 255, 255, 0.5)'
                            : '0 16px 32px -6px rgba(0, 0, 0, 0.85), inset 0 0 0 1.5px rgba(255, 255, 255, 0.3), inset 0 3px 6px rgba(255, 255, 255, 0.4)'
                    }}
                >
                    {/* REFLET LUMINEUX D'ANGLE EN ARC DE CERCLE */}
                    <div className="absolute top-1 left-2 w-7 h-7 rounded-full pointer-events-none opacity-90 overflow-hidden z-20">
                        <div
                            className="w-full h-full rounded-full"
                            style={{
                                background: isBoss
                                    ? 'radial-gradient(circle at 30% 30%, rgba(255, 220, 230, 0.95) 0%, rgba(255, 120, 150, 0.5) 45%, transparent 75%)'
                                    : 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95) 0%, rgba(200, 220, 240, 0.5) 45%, transparent 75%)'
                            }}
                        />
                    </div>

                    {/* BISEAU CONCENTRIQUE INTÉRIEUR DE VERRE */}
                    <div
                        className="absolute inset-1 rounded-full pointer-events-none z-20"
                        style={{
                            border: isBoss ? '1.5px solid rgba(251, 113, 133, 0.4)' : '1.5px solid rgba(255, 255, 255, 0.25)',
                            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.4), inset 0 -2px 3px rgba(0, 0, 0, 0.5)'
                        }}
                    />

                    {/* REFLET SPÉCULAIRE DYNAMIQUE SUIVANT LA SOURIS */}
                    <div
                        className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-150 z-20"
                        style={{
                            opacity: glarePos.opacity,
                            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.45) 0%, transparent 60%)`
                        }}
                    />

                    {/* =========================================================
                        L'AVATAR 3D DU PERSONNAGE (Image réelle Red pour chef, Black pour le reste)
                       ========================================================= */}
                    <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-black">
                        {/* L'image 3D réelle fournie */}
                        <img
                            src={avatarSrc}
                            alt={`${node.prenom} ${node.nom}`}
                            className="w-full h-full object-cover select-none pointer-events-none transform scale-105"
                            draggable={false}
                        />

                        {/* Lentille caustique protectrice par-dessus l'image */}
                        <div
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                                background: isBoss
                                    ? 'radial-gradient(circle at 35% 25%, rgba(255, 150, 170, 0.2) 0%, transparent 65%)'
                                    : 'radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.15) 0%, transparent 65%)',
                                boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.8)'
                            }}
                        />

                        {/* INITIALES EN MÉDAILLON EN BAS DU CERCLE */}
                        <div
                            className="absolute bottom-1 px-2 py-0.5 rounded-full border shadow-lg backdrop-blur-md flex items-center justify-center font-black tracking-wider text-[10px] select-none z-10"
                            style={{
                                background: isBoss ? 'rgba(50, 3, 15, 0.88)' : 'rgba(10, 14, 22, 0.88)',
                                borderColor: isBoss ? 'rgba(251, 113, 133, 0.6)' : 'rgba(255, 255, 255, 0.45)',
                                color: '#ffffff'
                            }}
                        >
                            {node.initials}
                        </div>
                    </div>

                    {/* Couronne dorée pour la Direction */}
                    {isBoss && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border border-white shadow-[0_2px_10px_rgba(245,158,11,0.9)] flex items-center justify-center z-30">
                            <Crown size={12} className="text-slate-950 font-bold" />
                        </div>
                    )}
                </motion.div>
            </div>

            {/* =========================================================================
                ÉTIQUETTE ÉPURÉE SOUS LE CERCLE (Nom & Poste)
               ========================================================================= */}
            <div className="mt-2 text-center pointer-events-none max-w-[130px]">
                <h4 className="text-xs font-bold text-white tracking-tight truncate drop-shadow-sm">
                    {node.prenom} {node.nom}
                </h4>
                <p className="text-[10px] text-slate-400 truncate font-medium">
                    {node.role}
                </p>
            </div>

            {/* =========================================================================
                AU SURVOL : BULLE RÉVÉLANT LA SECTION
               ========================================================================= */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.94 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 top-full mt-2 w-64 p-3.5 rounded-2xl bg-gradient-to-b from-[#1b2332]/95 via-[#121824]/95 to-[#0a0f18]/95 border border-white/25 shadow-[0_20px_45px_rgba(0,0,0,0.8)] text-white backdrop-blur-xl pointer-events-none"
                    >
                        {/* Triangle supérieur */}
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#1b2332] border-t border-l border-white/25" />

                        {/* SECTION MISE EN ÉVIDENCE */}
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                                SECTION :
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${deptInfo.badge} truncate`}>
                                {deptInfo.label}
                            </span>
                        </div>

                        {/* Identité */}
                        <div className="border-b border-white/10 pb-2 mb-2">
                            <p className="text-sm font-extrabold text-white">
                                {node.prenom} {node.nom}
                            </p>
                            <p className="text-[11px] text-slate-300 font-medium leading-snug mt-0.5">
                                {node.posteComplet}
                            </p>
                        </div>

                        {/* Chaîne hiérarchique */}
                        <div className="space-y-1 text-[10px] text-slate-300">
                            {managerName && (
                                <p className="flex items-center justify-between">
                                    <span className="text-slate-400 font-mono">Supérieur (N+1) :</span>
                                    <span className="font-semibold text-slate-200">{managerName}</span>
                                </p>
                            )}
                            {node.subordinateIds.length > 0 && (
                                <p className="flex items-center justify-between">
                                    <span className="text-slate-400 font-mono">Équipe :</span>
                                    <span className="font-semibold text-indigo-300">{node.subordinateIds.length} subordonné(s)</span>
                                </p>
                            )}
                            <p className="flex items-center justify-between">
                                <span className="text-slate-400 font-mono">Statut :</span>
                                <span className={`font-semibold ${node.statut === 'Actif' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {node.statut}
                                </span>
                            </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                            <span>ID-{node.matricule}</span>
                            <span className="text-blue-400 font-medium">Cliquer pour dossier</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
