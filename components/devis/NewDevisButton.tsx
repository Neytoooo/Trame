'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import PillButton from '@/components/ui/PillButton'
import NewDevisModal from './NewDevisModal'

interface ChantierOption {
    id: string
    name: string
    clientName?: string
}

interface ClientOption {
    id: string
    name: string
}

interface Props {
    chantiers: ChantierOption[]
    clients?: ClientOption[]
}

export default function NewDevisButton({ chantiers, clients = [] }: Props) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <PillButton
                onClick={() => setIsOpen(true)}
                icon={<Plus size={14} />}
            >
                Nouveau Devis
            </PillButton>

            <NewDevisModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                chantiers={chantiers}
                clients={clients}
            />
        </>
    )
}
