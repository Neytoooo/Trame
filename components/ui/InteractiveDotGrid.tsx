'use client'

import { useEffect, useRef } from 'react'

interface Dot {
    x: number
    y: number
    baseX: number
    baseY: number
    size: number
    baseAlpha: number
    alpha: number
    color: string
}

export default function InteractiveDotGrid() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationFrameId: number
        let width = 0
        let height = 0
        let dpr = 1

        const mouse = {
            x: -1000,
            y: -1000,
            targetX: -1000,
            targetY: -1000,
            isHovered: false
        }

        const SPACING = 28 // Distance between dots
        const INFLUENCE_RADIUS = 160 // Influence radius of cursor
        const REPEL_FORCE = 8 // Subtle magnetic repulsion
        let dots: Dot[] = []

        const initDots = () => {
            dots = []
            const cols = Math.ceil(width / SPACING) + 1
            const rows = Math.ceil(height / SPACING) + 1

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * SPACING
                    const y = j * SPACING
                    dots.push({
                        x,
                        y,
                        baseX: x,
                        baseY: y,
                        size: 1.1,
                        baseAlpha: 0.16,
                        alpha: 0.16,
                        color: '#94A3B8'
                    })
                }
            }
        }

        const handleResize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2)
            width = window.innerWidth
            height = window.innerHeight
            canvas.width = width * dpr
            canvas.height = height * dpr
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
            ctx.scale(dpr, dpr)
            initDots()
        }

        handleResize()
        window.addEventListener('resize', handleResize)

        const handleMouseMove = (e: MouseEvent) => {
            mouse.targetX = e.clientX
            mouse.targetY = e.clientY
            mouse.isHovered = true
        }

        const handleMouseLeave = () => {
            mouse.targetX = -1000
            mouse.targetY = -1000
            mouse.isHovered = false
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseleave', handleMouseLeave)

        // Render loop
        const render = () => {
            // Smooth mouse interpolation (lerp)
            mouse.x += (mouse.targetX - mouse.x) * 0.15
            mouse.y += (mouse.targetY - mouse.y) * 0.15

            ctx.clearRect(0, 0, width, height)

            for (let i = 0; i < dots.length; i++) {
                const dot = dots[i]

                const dx = mouse.x - dot.baseX
                const dy = mouse.y - dot.baseY
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < INFLUENCE_RADIUS) {
                    // Interaction factor (1 near cursor, 0 at edge of radius)
                    const factor = 1 - dist / INFLUENCE_RADIUS
                    const easeFactor = factor * factor

                    // Repulsion displacement
                    const angle = Math.atan2(dy, dx)
                    const repel = easeFactor * REPEL_FORCE
                    dot.x = dot.baseX - Math.cos(angle) * repel
                    dot.y = dot.baseY - Math.sin(angle) * repel

                    // Expand size and increase glow / alpha
                    dot.size = 1.1 + easeFactor * 1.8
                    dot.alpha = 0.16 + easeFactor * 0.72

                    // Color shifts from subtle slate to light cream/gold or electric cyan
                    // Highlighting the dot with KOTA's warm cream/amber tone
                    ctx.fillStyle = `rgba(246, 235, 215, ${dot.alpha})`
                } else {
                    // Smooth return to base position and alpha
                    dot.x += (dot.baseX - dot.x) * 0.1
                    dot.y += (dot.baseY - dot.y) * 0.1
                    dot.size += (1.1 - dot.size) * 0.1
                    dot.alpha += (dot.baseAlpha - dot.alpha) * 0.1

                    ctx.fillStyle = `rgba(148, 163, 184, ${dot.alpha})`
                }

                ctx.beginPath()
                ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
                ctx.fill()
            }

            // Draw a subtle soft radial flashlight over the hovered area
            if (mouse.x > -500 && mouse.y > -500) {
                const gradient = ctx.createRadialGradient(
                    mouse.x,
                    mouse.y,
                    0,
                    mouse.x,
                    mouse.y,
                    INFLUENCE_RADIUS * 1.4
                )
                gradient.addColorStop(0, 'rgba(246, 235, 215, 0.045)')
                gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.025)')
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

                ctx.fillStyle = gradient
                ctx.beginPath()
                ctx.arc(mouse.x, mouse.y, INFLUENCE_RADIUS * 1.4, 0, Math.PI * 2)
                ctx.fill()
            }

            animationFrameId = requestAnimationFrame(render)
        }

        render()

        return () => {
            cancelAnimationFrame(animationFrameId)
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ width: '100%', height: '100%' }}
        />
    )
}
