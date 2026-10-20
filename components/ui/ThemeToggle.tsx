'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme, resolvedTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="w-8 h-8 rounded-full bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.04)]" />
        )
    }

    const isDark = resolvedTheme === 'dark'

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark')
    }

    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-slate-50 dark:bg-[#131B2A] dark:hover:bg-[#1A2438] border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer active:scale-95"
            title={isDark ? "Passer en mode jour" : "Passer en mode nuit"}
            aria-label="Changer de thème"
        >
            {isDark ? (
                <Sun size={14} className="text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-90" />
            ) : (
                <Moon size={14} className="text-slate-600 transition-transform duration-300 -rotate-12 hover:rotate-0" />
            )}
        </button>
    )
}
