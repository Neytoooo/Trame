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
                className={`w-full flex items-center justify-between rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm text-gray-900 transition-all hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10 ${isOpen ? 'border-purple-500 ring-1 ring-purple-500 dark:border-purple-500/50 dark:ring-purple-500/50' : ''}`}
                type="button"
            >
                <div className="flex items-center gap-2 truncate">
                    {icon}
                    <span className={value === 'all' ? "text-gray-500 dark:text-gray-400" : "text-gray-900 font-medium dark:text-white"}>
                        {selectedLabel}
                    </span>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full rounded-xl border border-gray-200 bg-white p-1 shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100 dark:border-white/10 dark:bg-[#1E1E2E] dark:shadow-black/50">
                    <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value)
                                    setIsOpen(false)
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${value === option.value
                                    ? 'bg-purple-100 text-purple-700 font-medium dark:bg-purple-600/20 dark:text-purple-400'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white'
                                    }`}
                            >
                                <span className="truncate">{option.label}</span>
                                {value === option.value && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
