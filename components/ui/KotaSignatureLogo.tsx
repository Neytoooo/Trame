'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Sparkles } from 'lucide-react'

interface KotaSignatureLogoProps {
    className?: string
    showTagline?: boolean
}

export default function KotaSignatureLogo({ className = '', showTagline = true }: KotaSignatureLogoProps) {
    const [replayKey, setReplayKey] = useState(0)
    const [isRevealed, setIsRevealed] = useState(false)

    const handleReplay = () => {
        setIsRevealed(false)
        setReplayKey((prev) => prev + 1)
    }

    // Normalized smooth cubic bezier path modeling the continuous ribbon loop of the K
    const ribbonPath =
        'M 140 450 C 95 405, 85 270, 130 170 C 165 95, 235 75, 275 95 C 310 115, 290 190, 255 260 C 235 300, 290 345, 360 400 C 420 450, 455 460, 415 488 C 360 508, 280 488, 220 465 C 180 450, 260 340, 325 270 C 395 195, 455 205, 445 268 C 435 320, 360 350, 285 325 Z'

    return (
        <div className={`relative flex items-center gap-4 select-none ${className}`}>
            {/* --- 1. EMBLEM CONTAINER (KINETIC DRAW + RESPIRATION) --- */}
            <div
                onClick={handleReplay}
                className="group relative flex-shrink-0 cursor-pointer"
                title="Cliquer pour rejouer l'animation de signature"
            >
                {/* Ambient breathing aura behind the emblem */}
                <motion.div
                    key={`aura-${replayKey}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                        opacity: isRevealed ? [0.2, 0.45, 0.2] : 0,
                        scale: isRevealed ? [1, 1.15, 1] : 0.8
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 4.2,
                        ease: 'easeInOut'
                    }}
                    className="absolute -inset-3 rounded-full bg-gradient-to-tr from-[#E3C28D]/25 via-[#F6EBD7]/20 to-indigo-500/15 blur-2xl pointer-events-none"
                />

                {/* Floating Respiration Wrapper */}
                <motion.div
                    key={`floating-${replayKey}`}
                    animate={
                        isRevealed
                            ? {
                                  y: [0, -3.5, 0],
                                  scale: [1, 1.025, 1]
                              }
                            : {}
                    }
                    transition={{
                        repeat: Infinity,
                        duration: 4.5,
                        ease: 'easeInOut'
                    }}
                    className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                >
                    {/* SVG KINETIC STROKE TRACER (Plays on initial load / replay) */}
                    <AnimatePresence>
                        {!isRevealed && (
                            <svg
                                key={`svg-${replayKey}`}
                                viewBox="0 0 520 520"
                                className="absolute inset-0 w-full h-full pointer-events-none z-20"
                            >
                                <defs>
                                    <linearGradient id="goldTracerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#FFF8ED" />
                                        <stop offset="40%" stopColor="#F6EBD7" />
                                        <stop offset="80%" stopColor="#E2C494" />
                                        <stop offset="100%" stopColor="#C9A063" />
                                    </linearGradient>
                                    <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
                                        <feGaussianBlur stdDeviation="6" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                {/* Background track */}
                                <path
                                    d={ribbonPath}
                                    fill="none"
                                    stroke="rgba(246, 235, 215, 0.08)"
                                    strokeWidth="28"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Glowing kinetic drawing path */}
                                <motion.path
                                    d={ribbonPath}
                                    fill="none"
                                    stroke="url(#goldTracerGrad)"
                                    strokeWidth="22"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    filter="url(#goldGlow)"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: [0, 1, 1, 0.4] }}
                                    transition={{
                                        duration: 1.5,
                                        ease: [0.22, 1, 0.36, 1]
                                    }}
                                    onAnimationComplete={() => setIsRevealed(true)}
                                />
                            </svg>
                        )}
                    </AnimatePresence>

                    {/* 3D SHADED EMBLEM (Fades in with light bloom as the kinetic trace completes) */}
                    <motion.div
                        key={`img-${replayKey}`}
                        initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
                        animate={{
                            opacity: isRevealed ? 1 : 0.05,
                            scale: isRevealed ? 1 : 0.92,
                            filter: isRevealed ? 'blur(0px)' : 'blur(8px)'
                        }}
                        transition={{
                            duration: 0.8,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className="relative w-full h-full"
                    >
                        <Image
                            src="/kota-symbol.png"
                            alt="KOTA Emblem"
                            fill
                            className="object-contain drop-shadow-[0_8px_20px_rgba(246,235,215,0.18)]"
                            priority
                        />

                        {/* Subtle shimmering light glint sweep */}
                        {isRevealed && (
                            <motion.div
                                initial={{ x: '-150%', opacity: 0 }}
                                animate={{ x: '150%', opacity: [0, 0.8, 0] }}
                                transition={{
                                    repeat: Infinity,
                                    repeatDelay: 5,
                                    duration: 1.4,
                                    ease: 'easeInOut'
                                }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-25 pointer-events-none mix-blend-overlay"
                            />
                        )}
                    </motion.div>

                    {/* Luminous burst flash at the moment of reveal */}
                    <motion.div
                        key={`flash-${replayKey}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={
                            isRevealed
                                ? { opacity: [0, 0.75, 0], scale: [0.8, 1.4, 1.8] }
                                : { opacity: 0 }
                        }
                        transition={{ duration: 0.65, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-full bg-radial from-[#FFF9F0]/60 via-[#F6EBD7]/20 to-transparent blur-md pointer-events-none"
                    />
                </motion.div>
            </div>

            {/* --- 2. ACCOMPANYING TYPOGRAPHY & BRAND LOCKUP --- */}
            <motion.div
                key={`typo-${replayKey}`}
                initial={{ opacity: 0, x: -16, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{
                    delay: 0.4,
                    duration: 0.9,
                    ease: [0.16, 1, 0.3, 1]
                }}
                className="flex flex-col justify-center"
            >
                {/* Brand Name */}
                <div className="flex items-center">
                    <span className="text-3xl lg:text-4xl font-black tracking-[0.16em] uppercase font-serif bg-gradient-to-r from-[#FFFFFF] via-[#F6EBD7] to-[#D5C6AC] bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(246,235,215,0.15)]">
                        KOTA
                    </span>
                </div>

                {/* Subtitle Row: Technology & Design */}
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] tracking-[0.28em] text-slate-300/90 font-semibold uppercase leading-none font-mono">
                        Technology & Design
                    </span>
                </div>
            </motion.div>
        </div>
    )
}
