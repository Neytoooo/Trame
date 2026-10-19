export interface BtpArticle {
    id?: string
    reference: string
    name: string
    complement: string
    metier: string
    famille: string
    category: 'ouvrage' | 'fourniture' | 'main_doeuvre' | 'engin'
    unit: string
    price_ht: number
    cost_ht: number
    tva: number
    supplier?: string
    stock?: number
    min_stock?: number
}

export const BTP_PRESTATIONS_CATALOG: BtpArticle[] = [
    {
        reference: 'PEI994',
        name: "Réalisation d'un constat d'huissier avant travaux",
        complement: "État des lieux contradictoire avec rapport photographique complet avant démarrage chantier",
        metier: 'PRÉPARATION',
        famille: 'ADMINISTRATIF',
        category: 'ouvrage',
        unit: 'Ens',
        price_ht: 2400.00,
        cost_ht: 1800.00,
        tva: 10
    },
    {
        reference: 'PEI990',
        name: "Démarches administratives auprès des services de voirie",
        complement: "Instruction du dossier AOT (Autorisation d'Occupation Temporaire) et arrêtés de circulation",
        metier: 'PRÉPARATION',
        famille: 'ADMINISTRATIF',
        category: 'main_doeuvre',
        unit: 'Forfait',
        price_ht: 350.00,
        cost_ht: 120.00,
        tva: 10
    },
    {
        reference: 'RAVBASEVIE',
        name: "Location et mise en place d'une base vie 4-5 personnes",
        complement: "Baraque démontable vestiaire et réfectoire (durée 1 mois) compris double raccordement eau/électricité",
        metier: 'RAVALEMENT',
        famille: 'INSTALLATION DE CHANTIER',
        category: 'fourniture',
        unit: 'Forfait',
        price_ht: 1200.00,
        cost_ht: 750.00,
        tva: 10
    },
    {
        reference: 'RAV994',
        name: "Montage et entretien d'un WC chimique de chantier",
        complement: "Montage d'un WC chimique autonome pour la durée des travaux compris entretien hebdomadaire et repli",
        metier: 'RAVALEMENT',
        famille: 'INSTALLATION DE CHANTIER',
        category: 'fourniture',
        unit: 'Forfait',
        price_ht: 750.00,
        cost_ht: 380.00,
        tva: 10
    },
    {
        reference: 'RAVECHA',
        name: "Mise en place d'un échafaudage tubulaire sur pieds",
        complement: "Montage, démontage et replis en fin de chantier, conforme aux normes EN 12810 / EN 12811",
        metier: 'RAVALEMENT',
        famille: 'ÉCHAFAUDAGE',
        category: 'ouvrage',
        unit: 'Ens',
        price_ht: 660.00,
        cost_ht: 320.00,
        tva: 10
    },
    {
        reference: 'RAVECHAROUL',
        name: "Montage d'un échafaudage roulant acier hauteur 6m",
        complement: "Échafaudage roulant avec planchers à trappe et plinthes de sécurité",
        metier: 'RAVALEMENT',
        famille: 'ÉCHAFAUDAGE',
        category: 'engin',
        unit: 'm²',
        price_ht: 30.00,
        cost_ht: 14.00,
        tva: 10
    },
    {
        reference: 'RAVFILET',
        name: "Mise en place d'un filet de protection pare-gravats",
        complement: "Filet PEHD micro-mailles avec attaches rapides fixé sur l'échafaudage",
        metier: 'RAVALEMENT',
        famille: 'ÉCHAFAUDAGE',
        category: 'fourniture',
        unit: 'm²',
        price_ht: 3.00,
        cost_ht: 1.15,
        tva: 10
    },
    {
        reference: 'RAVD2',
        name: "Mise en oeuvre de revêtement décoratif classe D2 sur façade",
        complement: "Application en 2 couches de peinture acrylique microporeuse sur fond bloqué et fixé",
        metier: 'RAVALEMENT',
        famille: 'RAV - FACADE',
        category: 'ouvrage',
        unit: 'm²',
        price_ht: 26.43,
        cost_ht: 13.50,
        tva: 10
    },
    {
        reference: 'RAVD3',
        name: "Mise en oeuvre d'un revêtement semi-épais D3 structuré",
        complement: "Sur façade extérieure avec 2 couches de finition structurée et pontage des microfissures",
        metier: 'RAVALEMENT',
        famille: 'RAV - FACADE',
        category: 'ouvrage',
        unit: 'm²',
        price_ht: 31.37,
        cost_ht: 16.80,
        tva: 10
    },
    {
        reference: 'RAVI2',
        name: "Revêtement d'imperméabilité classe I1 à I4 armé",
        complement: "Système d'imperméabilité avec trame de verre marouflée dans la sous-couche élastomère",
        metier: 'RAVALEMENT',
        famille: 'RAV - FACADE',
        category: 'ouvrage',
        unit: 'm²',
        price_ht: 54.61,
        cost_ht: 28.00,
        tva: 10
    },
    {
        reference: 'RAVGEL',
        name: "Nettoyage par application d'un gel nettoyant de façade",
        complement: "Application de SOLUROC LICEF 400 à 500g/m² et rinçage soigné haute pression contrôlée",
        metier: 'RAVALEMENT',
        famille: 'NETTOYAGE',
        category: 'main_doeuvre',
        unit: 'm²',
        price_ht: 13.04,
        cost_ht: 5.60,
        tva: 10
    },
    {
        reference: 'RAVGOM',
        name: "Réalisation d'un hydrogommage sur parements pierre",
        complement: "Projection à basse pression de micro-granulats écologiques avec nébulisation d'eau",
        metier: 'RAVALEMENT',
        famille: 'NETTOYAGE',
        category: 'ouvrage',
        unit: 'm²',
        price_ht: 40.00,
        cost_ht: 22.00,
        tva: 10
    },
    {
        reference: 'RAVDECAP',
        name: "Décapage des anciennes peintures avec décapant gélifié",
        complement: "Décapant de façade gélifié type SCALPEX NW sans solvant chloré, rinçage à l'eau chaude",
        metier: 'RAVALEMENT',
        famille: 'TRAVAUX PRÉPARATOIRES',
        category: 'main_doeuvre',
        unit: 'm²',
        price_ht: 22.13,
        cost_ht: 11.00,
        tva: 10
    },
    {
        reference: 'RAVAPPUI',
        name: "Fourniture et pose d'appuis de fenêtre thermoformés ALU",
        complement: "Alu thermolaqué 15/10ème avec embouts d'étanchéité et isolant acoustique sous-jacent",
        metier: 'MENUISERIE',
        famille: 'FAÇADE',
        category: 'ouvrage',
        unit: 'ml',
        price_ht: 127.12,
        cost_ht: 65.00,
        tva: 10
    },
    {
        reference: 'RAVCOUV',
        name: "Fourniture et pose de couvertine ALU 15/10ème sur acrotère",
        complement: "Aluminium prélaqué plié sur mesure avec éclisses de dilatation et fixations invisibles",
        metier: 'COUVERTURE',
        famille: 'ZINGUERIE',
        category: 'ouvrage',
        unit: 'ml',
        price_ht: 19.91,
        cost_ht: 9.80,
        tva: 10
    },
    {
        reference: 'RAVDESCENTE',
        name: "Remplacement des descentes d'eaux pluviales en zinc",
        complement: "Tuyau demi-rond Ø 80/100 mm en zinc naturel avec dauphin fonte et colliers scellés",
        metier: 'COUVERTURE',
        famille: 'ZINGUERIE',
        category: 'ouvrage',
        unit: 'ml',
        price_ht: 135.00,
        cost_ht: 70.00,
        tva: 10
    }
]
