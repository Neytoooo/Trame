'use client'

import { Search, Filter, X, Calendar } from 'lucide-react'
import CustomSelect from '@/components/ui/CustomSelect'

interface FilterOption {
    label: string
    value: string
}

interface FilterBarProps {
    onSearchChange: (value: string) => void
    onStatusChange: (value: string) => void
    onDateRangeChange: (value: string) => void
    statusOptions: FilterOption[]
    searchValue: string
    statusValue: string
    dateRangeValue: string
    placeholder?: string
    children?: React.ReactNode
}

export default function FilterBar({
    onSearchChange,
    onStatusChange,
    onDateRangeChange,
    statusOptions,
    searchValue,
    statusValue,
    dateRangeValue,
    placeholder = "Rechercher...",
    children
}: FilterBarProps) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search Input */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-white placeholder-gray-500 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                />
                {searchValue && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Filters Group */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Status Filter */}
                <CustomSelect
                    value={statusValue}
                    onChange={onStatusChange}
                    options={[
                        { label: 'Tous les statuts', value: 'all' },
                        ...statusOptions
                    ]}
                    icon={<Filter size={14} className="text-gray-500" />}
                />

                {/* Date Filter */}
                <CustomSelect
                    value={dateRangeValue}
                    onChange={onDateRangeChange}
                    options={[
                        { label: 'Toutes les dates', value: 'all' },
                        { label: 'Ce mois-ci', value: 'this_month' },
                        { label: 'Le mois dernier', value: 'last_month' },
                        { label: '3 derniers mois', value: 'last_3_months' },
                        { label: 'Cette année', value: 'this_year' }
                    ]}
                    icon={<Calendar size={14} className="text-gray-500" />}
                />
            </div>

            {/* Extra Actions (Children) */}
            <div className="md:ml-auto">
                {children}
            </div>
        </div>
    )
}
