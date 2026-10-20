'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
    label: string
    value: string
}

interface CustomSelectProps {
    value: string
    onChange: (value: string) => void
    options: Option[]
    placeholder?: string
    icon?: React.ReactNode
    className?: string
}

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Select...",
    icon,
    className = ""
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder

    return (
        <div className={`relative min-w-[160px] ${className}`} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between rounded-xl bg-white border border-slate-200/90 px-4 py-2 text-sm text-slate-900 transition-all hover:bg-slate-50 dark:bg-[#131B2A] dark:border-slate-800 dark:text-slate-200 dark:hover:bg-[#1A2438] ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-500 dark:border-indigo-500/50 dark:ring-indigo-500/50' : ''}`}
                type="button"
            >
                <div className="flex items-center gap-2 truncate">
                    {icon}
                    <span className={value === 'all' ? "text-slate-500 dark:text-slate-400" : "text-slate-900 font-medium dark:text-white"}>
                        {selectedLabel}
                    </span>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 dark:border-slate-800 dark:bg-[#131B2A] dark:shadow-black/60">
                    <div className="max-h-[240px] overflow-y-auto no-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value)
                                    setIsOpen(false)
                                    }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors text-left ${value === option.value
                                    ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-600/20 dark:text-indigo-400'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#1A2438] dark:hover:text-white'
                                    }`}
                            >
                                <span className="truncate">{option.label}</span>
                                {value === option.value && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
