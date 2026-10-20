'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import AiDevisModal from './AiDevisModal'
import PillButton from '@/components/ui/PillButton'

export default function AiDevisButton() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <PillButton
                onClick={() => setIsOpen(true)}
                variant="ai"
                icon={<Sparkles size={14} />}
            >
                Générer via IA
            </PillButton>

            {isOpen && <AiDevisModal onClose={() => setIsOpen(false)} />}
        </>
    )
}
