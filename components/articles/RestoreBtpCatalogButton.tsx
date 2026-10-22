'use client'

import { useState } from 'react'
import { RotateCcw, Loader2, Sparkles, Check } from 'lucide-react'
import { restoreBtpCatalogNonDestructiveAction } from '@/app/actions/articles'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import PillButton from '@/components/ui/PillButton'

export default function RestoreBtpCatalogButton() {
    const confirm = useConfirm()
    const [loading, setLoading] = useState(false)

    const handleRestore = async () => {
        const ok = await confirm({
            title: "Réintégrer le catalogue BTP standard ?",
            message: "Cette action va réinsérer l'ensemble des 30+ prestations de base du BTP (Ravalement, Échafaudage, Maçonnerie, Peinture, etc.).\n\n✅ Tous vos articles personnalisés et récemment importés seront strictement préservés sans être écrasés ni modifiés.",
            confirmText: "Oui, réintégrer le catalogue",
            cancelText: "Non, annuler",
            variant: "info"
        })
        if (!ok) return

        setLoading(true)
        try {
            const res = await restoreBtpCatalogNonDestructiveAction()
            if (res.success) {
                alert(res.message || "Catalogue BTP standard réintégré avec succès !")
                window.location.reload()
            } else {
                alert("Erreur : " + (res.error || "Impossible de réintégrer le catalogue"))
            }
        } catch (e: any) {
            alert("Erreur de connexion : " + (e.message || "Erreur serveur"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <PillButton
            onClick={handleRestore}
            disabled={loading}
            variant="secondary"
            icon={loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
            title="Réintégrer les prestations standards du BTP sans toucher à vos données actuelles"
        >
            {loading ? "Restauration..." : "Catalogue BTP"}
        </PillButton>
    )
}
