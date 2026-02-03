"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500">
                <Sun size={18} />
            </button>
        )
    }

    const isDark = resolvedTheme === "dark"

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white transition-all"
            title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
        >
            {isDark ? (
                <Moon size={18} />
            ) : (
                <Sun size={18} />
            )}
        </button>
    )
}
