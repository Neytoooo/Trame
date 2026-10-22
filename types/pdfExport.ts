export interface DevisPdfColumnConfig {
    showReference: boolean;      // Réf. / Code article
    showDescription: boolean;    // Description détaillée
    showUnit: boolean;           // Unité (m², ml, forfait, etc.)
    showQuantity: boolean;       // Quantité
    showUnitPrice: boolean;      // Prix unitaire HT
    showTotalHT: boolean;        // Total HT
    showTotals: boolean;         // Totaux financiers (Total HT Brut, TVA, Total TTC)
    showLinePhotos?: boolean;
}

export interface DevisPdfExportPreset {
    id: string;
    name: string;
    description: string;
    config: DevisPdfColumnConfig;
}

export const DEFAULT_PDF_PRESETS: Record<string, DevisPdfExportPreset> = {
    ARCHITECTE_MOE: {
        id: 'ARCHITECTE_MOE',
        name: 'Architecte / MOE (Complet)',
        description: 'Toutes les colonnes détaillées avec prix unitaires et références',
        config: {
            showReference: true,
            showDescription: true,
            showUnit: true,
            showQuantity: true,
            showUnitPrice: true,
            showTotalHT: true,
            showTotals: true,
        }
    },
    CLIENT_PARTICULIER: {
        id: 'CLIENT_PARTICULIER',
        name: 'Client Particulier',
        description: 'Synthétique sans prix unitaire ni référence technique',
        config: {
            showReference: false,
            showDescription: true,
            showUnit: true,
            showQuantity: true,
            showUnitPrice: false,
            showTotalHT: true,
            showTotals: true,
        }
    },
    EQUIPE_CHANTIER: {
        id: 'EQUIPE_CHANTIER',
        name: 'Équipe Chantier / Pose',
        description: 'Métré et quantités d\'exécution sans mention financière',
        config: {
            showReference: true,
            showDescription: true,
            showUnit: true,
            showQuantity: true,
            showUnitPrice: false,
            showTotalHT: false,
            showTotals: false,
        }
    }
}
