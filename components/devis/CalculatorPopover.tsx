'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, X, Calculator } from 'lucide-react'

type CalcLine = {
    id: string
    label: string
    expression: string
    result: number
}

// Simple expression evaluator
function evaluateExpression(expr: string): number {
    try {
        // Sanitize input: allow only numbers, operators, parens, dots, spaces
        const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '')
        if (!sanitized) return 0
        // eslint-disable-next-line no-new-func
        return new Function(`return (${sanitized})`)()
    } catch {
        return 0
    }
}

export default function CalculatorPopover({
    initialLines,
    isOpen,
    onClose,
    onApply
}: {
    initialLines: CalcLine[],
    isOpen: boolean,
    onClose: () => void,
    onApply: (total: number, lines: CalcLine[]) => void
}) {
    const [lines, setLines] = useState<CalcLine[]>(initialLines.length > 0 ? initialLines : [
        { id: '1', label: '', expression: '', result: 0 }
    ])

    // Update lines when initialLines changes (re-opening modal)
    useEffect(() => {
        if (isOpen && initialLines.length > 0) {
            setLines(initialLines)
        } else if (isOpen && initialLines.length === 0) {
            setLines([{ id: crypto.randomUUID(), label: '', expression: '', result: 0 }])
        }
    }, [isOpen, initialLines])

    const updateLine = (id: string, field: keyof CalcLine, value: string) => {
        setLines(prev => prev.map(line => {
            if (line.id === id) {
                const updated = { ...line, [field]: value }
                if (field === 'expression') {
                    updated.result = evaluateExpression(value)
                }
                return updated
            }
            return line
        }))
    }

    const addLine = () => {
        setLines([...lines, { id: crypto.randomUUID(), label: '', expression: '', result: 0 }])
    }

    const removeLine = (id: string) => {
        setLines(lines.filter(l => l.id !== id))
    }

    const total = lines.reduce((acc, line) => acc + (line.result || 0), 0)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1a1f2e] p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Calculator className="text-purple-400" size={20} />
                        Minute de métré
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto mb-6 pr-2">
                    {lines.map((line, index) => (
                        <div key={line.id} className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder={`Détail ${index + 1}`}
                                value={line.label}
                                onChange={(e) => updateLine(line.id, 'label', e.target.value)}
                                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                            />
                            <input
                                type="text"
                                placeholder="3 * 2.5"
                                value={line.expression}
                                onChange={(e) => updateLine(line.id, 'expression', e.target.value)}
                                className="w-24 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 text-center"
                            />
                            <div className="w-20 text-right font-mono text-emerald-400">
                                = {Number(line.result).toFixed(2)}
                            </div>
                            <button
                                onClick={() => removeLine(line.id)}
                                className="text-gray-600 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addLine}
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium mt-2"
                    >
                        <Plus size={16} /> Ajouter une ligne
                    </button>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="text-white font-medium">
                        Total Quantité : <span className="text-xl font-bold text-emerald-400 ml-2">{total.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-gray-400 hover:bg-white/5 transition-colors text-sm font-medium"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={() => onApply(total, lines)}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl shadow-lg shadow-purple-500/20 text-sm font-semibold transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Check size={16} />
                            Appliquer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
