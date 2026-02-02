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
                className={`w-full flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-gray-300 transition-all hover:bg-white/10 ${isOpen ? 'border-purple-500/50 ring-1 ring-purple-500/50' : ''}`}
                type="button"
            >
                <div className="flex items-center gap-2 truncate">
                    {icon}
                    <span className={value === 'all' ? "text-gray-400" : "text-white font-medium"}>
                        {selectedLabel}
                    </span>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full rounded-xl border border-white/10 bg-[#1E1E2E] p-1 shadow-xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value)
                                    setIsOpen(false)
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${value === option.value
                                        ? 'bg-purple-600/20 text-purple-400 font-medium'
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
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
