export interface TeamMember {
    id: string
    nom: string
    prenom: string
    role: string
    email: string
    telephone: string
    initials: string
    accentColor: 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose' | 'violet'
    statut: 'Actif' | 'En chantier' | 'En déplacement' | 'Congés'
    
    // 1. Argent rapporté (factures payées)
    caEncaisse: number
    
    // 2. Argent en attente (devis en attente)
    devisEnAttente: number
    
    // 3. Stats devis & factures
    nbDevis: number
    nbFactures: number
    tauxConversion: number // en %
    panierMoyen: number
    
    // 4. Chantiers & Clients gérés
    nbChantiers: number
    nbClients: number
    
    // Données détaillées
    chantiersList: Array<{ id: string; nom: string; ville?: string; statut: string; montant: number }>
    clientsList: Array<{ id: string; nom: string; ville?: string }>
    derniersDevis: Array<{ ref: string; client: string; montant: number; statut: string }>
    dernieresFactures: Array<{ ref: string; client: string; montant: number; statut: string }>
}

export interface CompanyTotals {
    totalCaEncaisse: number
    totalDevisEnAttente: number
    totalDevis: number
    totalFactures: number
    totalChantiers: number
    totalClients: number
    tauxConversionGlobal: number
    panierMoyenGlobal: number
    nombreCollaborateurs: number
}

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
    {
        id: 'user-alexandre',
        nom: 'Vinuesa',
        prenom: 'Alexandre',
        role: 'Directeur d\'Exploitation & Travaux',
        email: 'alexandre.v@trame-btp.fr',
        telephone: '+33 6 12 34 56 78',
        initials: 'AV',
        accentColor: 'indigo',
        statut: 'Actif',
        caEncaisse: 168450,
        devisEnAttente: 94200,
        nbDevis: 24,
        nbFactures: 18,
        tauxConversion: 75,
        panierMoyen: 9358,
        nbChantiers: 8,
        nbClients: 15,
        chantiersList: [
            { id: 'ch-1', nom: 'Rénovation Résidence Les Pins', ville: 'Poissy', statut: 'en_cours', montant: 64500 },
            { id: 'ch-2', nom: 'Extension Maison Contemporaine', ville: 'Saint-Mandé', statut: 'en_cours', montant: 48200 },
            { id: 'ch-3', nom: 'Aménagement Bureaux Tertiaires', ville: 'Paris 8e', statut: 'etude', montant: 55750 }
        ],
        clientsList: [
            { id: 'cl-1', nom: 'SCI Les Pins Immobilier', ville: 'Poissy' },
            { id: 'cl-2', nom: 'M. et Mme Leroy', ville: 'Saint-Mandé' },
            { id: 'cl-3', nom: 'SARL Alpha Conseil', ville: 'Paris' }
        ],
        derniersDevis: [
            { ref: 'DEV-2026-089', client: 'SCI Les Pins', montant: 34200, statut: 'en_attente' },
            { ref: 'DEV-2026-084', client: 'M. et Mme Leroy', montant: 60000, statut: 'signe' }
        ],
        dernieresFactures: [
            { ref: 'FAC-2026-042', client: 'SCI Les Pins', montant: 25000, statut: 'payee' },
            { ref: 'FAC-2026-039', client: 'SARL Alpha', montant: 18500, statut: 'payee' }
        ]
    },
    {
        id: 'member-sophie',
        nom: 'Martinez',
        prenom: 'Sophie',
        role: 'Chargée d\'Affaires - Rénovation & Particuliers',
        email: 'sophie.m@trame-btp.fr',
        telephone: '+33 6 23 45 67 89',
        initials: 'SM',
        accentColor: 'emerald',
        statut: 'Actif',
        caEncaisse: 142500,
        devisEnAttente: 68400,
        nbDevis: 19,
        nbFactures: 15,
        tauxConversion: 79,
        panierMoyen: 9500,
        nbChantiers: 6,
        nbClients: 11,
        chantiersList: [
            { id: 'ch-4', nom: 'Surélévation Villa Belleville', ville: 'Conflans', statut: 'en_cours', montant: 72000 },
            { id: 'ch-5', nom: 'Réfection Toiture et Zinguerie', ville: 'Versailles', statut: 'en_cours', montant: 38500 },
            { id: 'ch-6', nom: 'Création Studio Indépendant', ville: 'Saint-Germain', statut: 'etude', montant: 32000 }
        ],
        clientsList: [
            { id: 'cl-4', nom: 'Mme Claire Bonnet', ville: 'Conflans' },
            { id: 'cl-5', nom: 'Syndic Résidence du Parc', ville: 'Versailles' },
            { id: 'cl-6', nom: 'M. David Mercier', ville: 'Saint-Germain' }
        ],
        derniersDevis: [
            { ref: 'DEV-2026-091', client: 'Mme Claire Bonnet', montant: 42000, statut: 'en_attente' },
            { ref: 'DEV-2026-079', client: 'Syndic du Parc', montant: 26400, statut: 'signe' }
        ],
        dernieresFactures: [
            { ref: 'FAC-2026-044', client: 'Mme Claire Bonnet', montant: 36000, statut: 'payee' },
            { ref: 'FAC-2026-037', client: 'M. Mercier', montant: 19200, statut: 'payee' }
        ]
    },
    {
        id: 'member-pierre',
        nom: 'Durand',
        prenom: 'Pierre',
        role: 'Chef de Chantier - Gros Œuvre & Structure',
        email: 'pierre.d@trame-btp.fr',
        telephone: '+33 6 34 56 78 90',
        initials: 'PD',
        accentColor: 'amber',
        statut: 'En chantier',
        caEncaisse: 118200,
        devisEnAttente: 45200,
        nbDevis: 14,
        nbFactures: 11,
        tauxConversion: 78,
        panierMoyen: 10745,
        nbChantiers: 5,
        nbClients: 8,
        chantiersList: [
            { id: 'ch-7', nom: 'Fondations et Dalle Hangar', ville: 'Cergy', statut: 'en_cours', montant: 58000 },
            { id: 'ch-8', nom: 'Ouverture Mur Porteur & IPN', ville: 'Boulogne', statut: 'termine', montant: 24200 }
        ],
        clientsList: [
            { id: 'cl-7', nom: 'SAS Logistique Nord', ville: 'Cergy' },
            { id: 'cl-8', nom: 'SCI Val de Seine', ville: 'Boulogne' }
        ],
        derniersDevis: [
            { ref: 'DEV-2026-088', client: 'SAS Logistique', montant: 45200, statut: 'en_attente' }
        ],
        dernieresFactures: [
            { ref: 'FAC-2026-041', client: 'SCI Val de Seine', montant: 24200, statut: 'payee' },
            { ref: 'FAC-2026-035', client: 'SAS Logistique', montant: 34000, statut: 'payee' }
        ]
    },
    {
        id: 'member-marc',
        nom: 'Lefebvre',
        prenom: 'Marc',
        role: 'Chargé d\'Affaires - Électricité & Génie Climatique',
        email: 'marc.l@trame-btp.fr',
        telephone: '+33 6 45 67 89 01',
        initials: 'ML',
        accentColor: 'sky',
        statut: 'Actif',
        caEncaisse: 96400,
        devisEnAttente: 82100,
        nbDevis: 22,
        nbFactures: 13,
        tauxConversion: 59,
        panierMoyen: 7415,
        nbChantiers: 7,
        nbClients: 14,
        chantiersList: [
            { id: 'ch-9', nom: 'Installation PAC & Plancher Chauffant', ville: 'Nanterre', statut: 'en_cours', montant: 36000 },
            { id: 'ch-10', nom: 'Mise en conformité NF C 15-100', ville: 'Rueil', statut: 'etude', montant: 46100 }
        ],
        clientsList: [
            { id: 'cl-9', nom: 'Cabinet Médical Pasteur', ville: 'Nanterre' },
            { id: 'cl-10', nom: 'Copro 14 rue Voltaire', ville: 'Rueil' }
        ],
        derniersDevis: [
            { ref: 'DEV-2026-092', client: 'Copro Voltaire', montant: 46100, statut: 'en_attente' },
            { ref: 'DEV-2026-090', client: 'Cabinet Pasteur', montant: 36000, statut: 'en_attente' }
        ],
        dernieresFactures: [
            { ref: 'FAC-2026-040', client: 'Cabinet Pasteur', montant: 22000, statut: 'payee' },
            { ref: 'FAC-2026-031', client: 'SCI Voltaire', montant: 18400, statut: 'payee' }
        ]
    },
    {
        id: 'member-thomas',
        nom: 'Bernard',
        prenom: 'Thomas',
        role: 'Conducteur de Travaux - Second Œuvre & Finition',
        email: 'thomas.b@trame-btp.fr',
        telephone: '+33 6 56 78 90 12',
        initials: 'TB',
        accentColor: 'rose',
        statut: 'En déplacement',
        caEncaisse: 87900,
        devisEnAttente: 34800,
        nbDevis: 12,
        nbFactures: 9,
        tauxConversion: 75,
        panierMoyen: 9766,
        nbChantiers: 4,
        nbClients: 7,
        chantiersList: [
            { id: 'ch-11', nom: 'Peinture & Parquet Immeuble Haussmannien', ville: 'Paris 17e', statut: 'en_cours', montant: 51000 },
            { id: 'ch-12', nom: 'Agencement Cuisine & Verrière', ville: 'Neuilly', statut: 'termine', montant: 36900 }
        ],
        clientsList: [
            { id: 'cl-11', nom: 'Mme Isabelle Moreau', ville: 'Paris 17e' },
            { id: 'cl-12', nom: 'M. Patrick Cohen', ville: 'Neuilly' }
        ],
        derniersDevis: [
            { ref: 'DEV-2026-085', client: 'Mme Moreau', montant: 34800, statut: 'en_attente' }
        ],
        dernieresFactures: [
            { ref: 'FAC-2026-038', client: 'M. Cohen', montant: 36900, statut: 'payee' }
        ]
    }
]

export function computeCompanyTotals(members: TeamMember[]): CompanyTotals {
    const totalCaEncaisse = members.reduce((sum, m) => sum + (m.caEncaisse || 0), 0)
    const totalDevisEnAttente = members.reduce((sum, m) => sum + (m.devisEnAttente || 0), 0)
    const totalDevis = members.reduce((sum, m) => sum + (m.nbDevis || 0), 0)
    const totalFactures = members.reduce((sum, m) => sum + (m.nbFactures || 0), 0)
    const totalChantiers = members.reduce((sum, m) => sum + (m.nbChantiers || 0), 0)
    const totalClients = members.reduce((sum, m) => sum + (m.nbClients || 0), 0)
    
    const tauxConversionGlobal = totalDevis > 0 ? Math.round((totalFactures / totalDevis) * 100) : 0
    const panierMoyenGlobal = totalFactures > 0 ? Math.round(totalCaEncaisse / totalFactures) : 0

    return {
        totalCaEncaisse,
        totalDevisEnAttente,
        totalDevis,
        totalFactures,
        totalChantiers,
        totalClients,
        tauxConversionGlobal,
        panierMoyenGlobal,
        nombreCollaborateurs: members.length
    }
}
