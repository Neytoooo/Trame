import React from 'react'

interface TradeBadgeProps {
    trade?: string | null
    className?: string
}

/**
 * Palette chromatique harmonisée pour les Familles et Métiers BTP.
 * Toutes les teintes partagent la même saturation douce (10% fond, 20% bordure)
 * pour s'intégrer harmonieusement avec le fond sombre (#131B2A / #0E1524) et le thème clair.
 */
export function getTradeColor(tradeName?: string | null): string {
    const t = (tradeName || '').toUpperCase()

    // 1. Ravalement / Façade (Teinte Ocre / Ambre doux)
    if (t.includes('RAVALEMENT') || t.includes('FAÇADE') || t.includes('FACADE')) {
        return 'bg-amber-500/10 text-amber-700 border-amber-300/40 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
    }

    // 2. Échafaudage & Sécurité (Teinte Indigo structurel)
    if (t.includes('ÉCHAFAUDAGE') || t.includes('ECHAFAUDAGE') || t.includes('ECHAFAUD')) {
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-300/40 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20'
    }

    // 3. Préparation & Démarches administratives (Teinte Slate / Pro discret)
    if (t.includes('PRÉPARATION') || t.includes('PREPARATION') || t.includes('ADMIN')) {
        return 'bg-slate-500/10 text-slate-700 border-slate-300/40 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20'
    }

    // 4. Couverture & Zinguerie (Teinte Bleu Zinc / Ardoise)
    if (t.includes('COUVERTURE') || t.includes('ZINGUERIE') || t.includes('TOITURE')) {
        return 'bg-sky-500/10 text-sky-700 border-sky-300/40 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20'
    }

    // 5. Menuiserie & Fermetures (Teinte Teal atelier de précision)
    if (t.includes('MENUISERIE') || t.includes('FENÊTRE') || t.includes('FENETRE')) {
        return 'bg-teal-500/10 text-teal-700 border-teal-300/40 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20'
    }

    // 6. Peinture & Finitions (Teinte Violet nuancier)
    if (t.includes('PEINTURE') || t.includes('FINITION')) {
        return 'bg-violet-500/10 text-violet-700 border-violet-300/40 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20'
    }

    // 7. Maçonnerie & Gros Œuvre (Teinte Terracotta douce)
    if (t.includes('MAÇONNERIE') || t.includes('MACONNERIE') || t.includes('GROS OEUVRE') || t.includes('BETON')) {
        return 'bg-orange-500/10 text-orange-700 border-orange-300/40 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20'
    }

    // 8. Plomberie & Chauffage / CVC (Teinte Cyan fluide)
    if (t.includes('PLOMBERIE') || t.includes('CHAUFFAGE') || t.includes('CVC') || t.includes('SANITAIRE')) {
        return 'bg-cyan-500/10 text-cyan-700 border-cyan-300/40 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20'
    }

    // 9. Électricité (Teinte Jaune or énergie)
    if (t.includes('ÉLECTRICITÉ') || t.includes('ELECTRICITE') || t.includes('ELEC')) {
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-300/40 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-500/20'
    }

    // 10. Fournitures & Matériaux
    if (t.includes('FOURNITURE') || t.includes('MATERIAUX')) {
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300/40 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
    }

    // 11. Main d'œuvre
    if (t.includes('MAIN_DOEUVRE') || t.includes('MAIN D\'OEUVRE')) {
        return 'bg-violet-500/10 text-violet-700 border-violet-300/40 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20'
    }

    // 12. Engin & Matériel de levage
    if (t.includes('ENGIN') || t.includes('MATERIEL')) {
        return 'bg-orange-500/10 text-orange-700 border-orange-300/40 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20'
    }

    // Fallback élégant (Slate neutre)
    return 'bg-slate-500/10 text-slate-700 border-slate-300/40 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20'
}

export default function TradeBadge({ trade, className = '' }: TradeBadgeProps) {
    if (!trade) return null

    const colorClasses = getTradeColor(trade)

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap tracking-wide select-none ${colorClasses} ${className}`}
            title={trade}
        >
            {trade}
        </span>
    )
}
