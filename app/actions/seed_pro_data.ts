'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { BTP_PRESTATIONS_CATALOG } from '@/lib/btpCatalog'

export async function seedProBtpDataAction() {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        return {
            success: false,
            error: "Vous devez être connecté à KOTA pour initialiser les données."
        }
    }

    const userId = user.id

    try {
        // 1. CLEANUP (ne touche plus à la table articles pour préserver les imports utilisateurs)
        await supabase.from('factures_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('factures').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('devis_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('devis').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('chantier_edges').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('chantier_nodes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('chantier_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('chantiers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        // 2. SEED NON-DESTRUCTIF DU CATALOGUE BTP (n'insère que les articles manquants)
        const { data: existingArts } = await supabase.from('articles').select('name, reference')
        const existingNames = new Set((existingArts || []).map(a => a.name?.trim().toLowerCase()))
        const existingRefs = new Set((existingArts || []).map(a => a.reference?.trim().toLowerCase()).filter(Boolean))

        const missingArticles = BTP_PRESTATIONS_CATALOG.filter(a => {
            const n1 = a.name.trim().toLowerCase()
            const n2 = `${a.name}${a.complement ? ' - ' + a.complement : ''}`.trim().toLowerCase()
            const ref = (a.reference || '').trim().toLowerCase()
            return !existingNames.has(n1) && !existingNames.has(n2) && (!ref || !existingRefs.has(ref))
        })

        if (missingArticles.length > 0) {
            const articlesPayload = missingArticles.map(a => ({
                name: `${a.name}${a.complement ? ' - ' + a.complement : ''}`,
                category: a.category,
                unit: a.unit,
                price_ht: a.price_ht,
                cost_ht: a.cost_ht,
                reference: a.reference,
                tva: a.tva,
                stock: 50,
                min_stock: 10,
                supplier: `${a.metier} - ${a.famille}`,
                created_by: userId
            }))

            const { error: artErr } = await supabase.from('articles').insert(articlesPayload)
            if (artErr) console.warn("Erreur insertion catalogue articles:", artErr)
        }

        // 3. CREATE 3 CLIENTS (all with user email mattiskhn@gmail.com)
        const clientsPayload = [
            {
                name: "Syndic LAMY - Agence Poissy Gare",
                type: "professionnel",
                email: "mattiskhn@gmail.com",
                billing_email: "mattiskhn@gmail.com",
                phone_fixe: "01 30 74 25 66",
                phone_mobile: "06 45 88 12 90",
                address_line1: "35 Quater Boulevard Gambetta",
                city: "Poissy",
                zip_code: "78300",
                siret: "38942581900124",
                tva_number: "FR82389425819",
                iban: "FR7630002005500000123456789",
                created_by: userId
            },
            {
                name: "Cabinet BARBEY Immobilier & Copropriétés",
                type: "professionnel",
                email: "mattiskhn@gmail.com",
                billing_email: "mattiskhn@gmail.com",
                phone_fixe: "01 43 98 12 00",
                phone_mobile: "06 18 22 49 71",
                address_line1: "76 Avenue de Paris",
                city: "Saint-Mandé",
                zip_code: "94160",
                siret: "41289032100045",
                tva_number: "FR44412890321",
                iban: "FR7610058000010000987654321",
                created_by: userId
            },
            {
                name: "FONCIA Rives de Seine - Gestion Copropriétés",
                type: "professionnel",
                email: "mattiskhn@gmail.com",
                billing_email: "mattiskhn@gmail.com",
                phone_fixe: "01 39 72 88 00",
                phone_mobile: "06 70 94 33 15",
                address_line1: "14 Rue Maurice Berteaux",
                city: "Conflans-Sainte-Honorine",
                zip_code: "78700",
                siret: "31872095400382",
                tva_number: "FR59318720954",
                iban: "FR7630003021400000554433221",
                created_by: userId
            }
        ]

        const { data: insertedClients, error: clientsErr } = await supabase
            .from('clients')
            .insert(clientsPayload)
            .select()

        if (clientsErr || !insertedClients || insertedClients.length < 3) {
            console.error("Erreur insertion clients:", clientsErr)
            return { success: false, error: "Erreur lors de la création des 3 clients: " + clientsErr?.message }
        }

        const [client1, client2, client3] = insertedClients

        // 4. CREATE 3 CHANTIERS (1 per client with valid status constraint)
        const chantiersPayload = [
            {
                name: "Résidence Les Jasmins - Ravalement Simple des 5 Bâtiments",
                client_id: client1.id,
                status: "en_cours",
                address_line1: "32 Rue Paul Cézanne, 78300 Poissy",
                date_debut: "2026-10-15",
                created_by: userId
            },
            {
                name: "76 Avenue de Paris - Échafaudage & Rénovation Façade D2/D3",
                client_id: client2.id,
                status: "etude",
                address_line1: "76 Avenue de Paris, 94160 Saint-Mandé",
                date_debut: "2026-11-02",
                created_by: userId
            },
            {
                name: "Résidence Plein Air - Imperméabilité I2 & Zinguerie Acrotères",
                client_id: client3.id,
                status: "en_cours",
                address_line1: "14 Rue de Conflans, 78700 Conflans-Sainte-Honorine",
                date_debut: "2026-09-01",
                created_by: userId
            }
        ]

        const { data: insertedChantiers, error: chantiersErr } = await supabase
            .from('chantiers')
            .insert(chantiersPayload)
            .select()

        if (chantiersErr || !insertedChantiers || insertedChantiers.length < 3) {
            console.error("Erreur insertion chantiers:", chantiersErr)
            return { success: false, error: "Erreur lors de la création des chantiers: " + chantiersErr?.message }
        }

        const [chantier1, chantier2, chantier3] = insertedChantiers

        // 5. CREATE 3 DEVIS WITH EXACT PRO BTP DATA (FROM BATIECOM BLUE SELECT)
        // Devis 1: Chantier 1 (Identique aux Photos 1, 4 & 5)
        const { data: devis1, error: devis1Err } = await supabase
            .from('devis')
            .insert({
                chantier_id: chantier1.id,
                reference: "D26100199",
                name: "RAVALEMENT SIMPLE DES 5 BATIMENTS",
                status: "en_attente",
                notes: "Offre n° D26100199 du 15/10/2026 - Validité : 60 jours.\nMétier : RAVALEMENT - Type de mission : RAVALEMENT-COPRO.\nPayeur : Syndic LAMY Poissy (C/° Lamy Poissy Gare - 35 Quater Boulevard Gambetta 78300 Poissy - Tél: 01 30 74 25 66).\nLieu d'exécution : 32 rue Paul Cézanne, 78300 Poissy.\nConditions de règlement : Acompte de 40% à la commande (soit 91 708.36 € TTC), situations mensuelles à l'avancement métré, solde 10% à la réception sans réserves.\nTechnico-commercial : VINUESA Alexandre/COP - Technicien : VINUESA Alexandre.",
                created_by: userId
            })
            .select()
            .single()

        if (devis1Err || !devis1) {
            throw new Error("Erreur devis 1: " + devis1Err?.message)
        }

        const itemsDevis1 = [
            // Section 0
            {
                devis_id: devis1.id,
                item_type: "section",
                description: "0. INSTALLATION DE CHANTIER",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis1.id,
                item_type: "sub_section",
                description: "Démarches diverses :",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis1.id,
                item_type: "item",
                description: "Démarches administratives auprès des services de voirie",
                quantity: 1.00,
                unit: "Forfait",
                unit_price: 350.00,
                cost_price: 120.00,
                tva: 10,
                details: {
                    reference: "PEI994",
                    complement: "Instruction du dossier AOT (Autorisation d'Occupation Temporaire) et arrêtés de circulation municipaux",
                    cost_mat: 0,
                    cost_mo: 120,
                    cost_fg_pct: 12,
                    margin_pct: 60,
                    commercial: "VINUESA Alexandre/COP",
                    technicien: "VINUESA Alexandre"
                }
            },
            {
                devis_id: devis1.id,
                item_type: "sub_section",
                description: "Constat d'huissier :",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis1.id,
                item_type: "item",
                description: "Réalisation d'un constat d'huissier",
                quantity: 1.00,
                unit: "Ens",
                unit_price: 2400.00,
                cost_price: 1800.00,
                tva: 10,
                details: {
                    reference: "PEI994",
                    complement: "État des lieux contradictoire avec rapport photographique complet avant démarrage du chantier",
                    cost_mat: 0,
                    cost_mo: 1800,
                    cost_fg_pct: 10,
                    margin_pct: 20,
                    commercial: "VINUESA Alexandre/COP",
                    technicien: "VINUESA Alexandre",
                    copy_to_schedule: true
                }
            },
            {
                devis_id: devis1.id,
                item_type: "sub_section",
                description: "Cantonnement de chantier :",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis1.id,
                item_type: "item",
                description: "Mise en place d'une baraque de chantier démontable formant un vestiaire et un réfectoire pour la durée des travaux compris double",
                quantity: 1.00,
                unit: "Forfait",
                unit_price: 8235.00,
                cost_price: 4500.00,
                tva: 10,
                details: {
                    reference: "PEI990",
                    complement: "Baraque de chantier démontable avec double raccordement eau/électricité et mobilier conforme inspection du travail",
                    cost_mat: 2500,
                    cost_mo: 2000,
                    cost_fg_pct: 12,
                    margin_pct: 40,
                    commercial: "VINUESA Alexandre/COP",
                    technicien: "VINUESA Alexandre"
                }
            },
            {
                devis_id: devis1.id,
                item_type: "sub_section",
                description: "WC chimique :",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis1.id,
                item_type: "item",
                description: "Montage d'un WC chimique pour la durée du chantier compris entretien hebdomadaire et démontage en fin de chantier",
                quantity: 1.00,
                unit: "Forfait",
                unit_price: 2745.00,
                cost_price: 1400.00,
                tva: 10,
                details: {
                    reference: "RAV994",
                    complement: "WC autonome avec réapprovisionnement produits d'hygiène et vidange sanitaire chaque semaine",
                    cost_mat: 800,
                    cost_mo: 600,
                    margin_pct: 45
                }
            },
            {
                devis_id: devis1.id,
                item_type: "sub_section",
                description: "Tableau électrique :",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis1.id,
                item_type: "item",
                description: "Installation d'un tableau électrique de chantier différentiel 30mA avec prises étanches IP55",
                quantity: 1.00,
                unit: "Forfait",
                unit_price: 4100.00,
                cost_price: 2200.00,
                tva: 10,
                details: {
                    reference: "PEI994",
                    complement: "Armoire de distribution conforme aux normes UTE C15-100 avec arrêt d'urgence coup de poing",
                    cost_mat: 1200,
                    cost_mo: 1000,
                    margin_pct: 42
                }
            },
            {
                devis_id: devis1.id,
                item_type: "sub_section",
                description: "Branchement d'eau provisoire :",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis1.id,
                item_type: "item",
                description: "Installation provisoire d'un point d'eau de chantier avec disconnecteur et vanne d'arrêt",
                quantity: 1.00,
                unit: "Forfait",
                unit_price: 1850.00,
                cost_price: 900.00,
                tva: 10,
                details: {
                    reference: "PEI994",
                    complement: "Raccordement réseau eau potable avec compteur divisionnaire et protection contre le gel",
                    cost_mat: 450,
                    cost_mo: 450,
                    margin_pct: 45
                }
            },
            {
                devis_id: devis1.id,
                item_type: "sub_section",
                description: "Échafaudages tubulaires sur pieds :",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis1.id,
                item_type: "item",
                description: "Mise en place d'un échafaudage tubulaire sur pieds, montage, démontage et repli en fin de chantier (5 bâtiments)",
                quantity: 3850.00,
                unit: "m²",
                unit_price: 30.00,
                cost_price: 16.50,
                tva: 10,
                details: {
                    reference: "RAVECHA",
                    complement: "Conforme aux normes EN 12810 / EN 12811, classe 4, compris vérification APAVE et location 4 mois",
                    cost_mat: 6.5,
                    cost_mo: 10.0,
                    margin_pct: 41
                }
            },
            {
                devis_id: devis1.id,
                item_type: "item",
                description: "Mise en place d'un filet de protection pare-gravats et bâchage ventilé sur l'ensemble de l'échafaudage",
                quantity: 3850.00,
                unit: "m²",
                unit_price: 3.00,
                cost_price: 1.15,
                tva: 10,
                details: {
                    reference: "RAVFILET",
                    complement: "Filet micro-mailles PEHD résistant aux UV avec attaches de fixation rapide",
                    cost_mat: 0.85,
                    cost_mo: 0.30,
                    margin_pct: 55
                }
            },

            // Section 1
            {
                devis_id: devis1.id,
                item_type: "section",
                description: "1. TRAVAUX PRÉPARATOIRES & NETTOYAGE DES FAÇADES",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis1.id,
                item_type: "item",
                description: "Nettoyage par application d'un gel nettoyant SOLUROC LICEF (400 à 500g/m²) et rinçage haute pression eau chaude 140b",
                quantity: 3850.00,
                unit: "m²",
                unit_price: 8.20,
                cost_price: 3.80,
                tva: 10,
                details: {
                    reference: "RAVGEL",
                    complement: "Décontamination cryptogamique complète et élimination des salissures atmosphériques grasses",
                    cost_mat: 1.2,
                    cost_mo: 2.6,
                    margin_pct: 48
                }
            },
            {
                devis_id: devis1.id,
                item_type: "item",
                description: "Piquage des enduits dégradés, brossage, purge des fers, passivation anticorrosion et reprofilage au mortier résine R3",
                quantity: 280.00,
                unit: "m²",
                unit_price: 35.91,
                cost_price: 18.50,
                tva: 10,
                details: {
                    reference: "RAVAPPUI",
                    complement: "Passivation fers à béton au convertisseur de rouille époxy et ragréage fibré classe R3 avec armature textile",
                    cost_mat: 7.5,
                    cost_mo: 11.0,
                    margin_pct: 44
                }
            },

            // Section 2
            {
                devis_id: devis1.id,
                item_type: "section",
                description: "2. FINITIONS, PEINTURE & REVÊTEMENT TECHNIQUE D3",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis1.id,
                item_type: "item",
                description: "Réalisation d'une peinture décorative classe D3 comprenant une couche d'impression fixatrice et 2 couches de finition siloxane talochée",
                quantity: 200.00,
                unit: "m²",
                unit_price: 26.43,
                cost_price: 13.50,
                tva: 10,
                details: {
                    reference: "RAVD3",
                    complement: "Revêtement semi-épais D3 structuré microporeux à effet perlant garanti 10 ans",
                    cost_mat: 6.5,
                    cost_mo: 7.0,
                    margin_pct: 45
                }
            },
            {
                devis_id: devis1.id,
                item_type: "item",
                description: "Brossage, grattage, primaire antirouille phosphatant et 2 couches de laque polyuréthane satinée sur garde-corps métalliques",
                quantity: 132.00,
                unit: "ml",
                unit_price: 34.47,
                cost_price: 17.00,
                tva: 10,
                details: {
                    reference: "RAVBOIS",
                    complement: "Traitement anticorrosion complet des barreaudages et mains courantes teinte RAL 7016 Gris Anthracite",
                    cost_mat: 6.0,
                    cost_mo: 11.0,
                    margin_pct: 46
                }
            },
            {
                devis_id: devis1.id,
                item_type: "item",
                description: "Fourniture et pose de couvertine ALU 15/10ème plié sur acrotères avec pattes de fixation inox et joints néoprène",
                quantity: 190.647,
                unit: "ml",
                unit_price: 54.61,
                cost_price: 28.00,
                tva: 10,
                details: {
                    reference: "RAVCOUV",
                    complement: "Protection acrotères avec système de dilatation et retombée extérieure 60 mm",
                    cost_mat: 16.0,
                    cost_mo: 12.0,
                    margin_pct: 45
                }
            }
        ]

        await supabase.from('devis_items').insert(itemsDevis1)

        // Exact match with user's Photo 1:
        // HT: 208 601.95 €
        // TVA: 20 668.95 €
        // TTC: 229 270.90 €
        const devis1HT = 208601.95
        const devis1TTC = 229270.90
        await supabase.from('devis').update({ total_ht: devis1HT, total_ttc: devis1TTC }).eq('id', devis1.id)

        // Devis 2: Chantier 2 (D26100236 - Saint-Mandé)
        const { data: devis2, error: devis2Err } = await supabase
            .from('devis')
            .insert({
                chantier_id: chantier2.id,
                reference: "D26100236",
                name: "RAVALEMENT FAÇADE PIERRE DE TAILLE & ENDUIT D2",
                status: "en_attente",
                notes: "Offre n° D26100236 - Soumise pour vote en Assemblée Générale ordinaire du Cabinet BARBEY.\nChantier : 76 Avenue de Paris, 94160 Saint-Mandé.\nMission : PIERRE-DE-TAILLE - Métier : RAVALEMENT.\nConditions : Acompte 30% après vote en AG, solde à réception.\nTechnico-commercial : VINUESA Alexandre/COP - Technicien : VINUESA Alexandre.",
                created_by: userId
            })
            .select()
            .single()

        if (devis2Err || !devis2) {
            throw new Error("Erreur devis 2: " + devis2Err?.message)
        }

        const itemsDevis2 = [
            {
                devis_id: devis2.id,
                item_type: "section",
                description: "0. VOIRIE ET ÉCHAFAUDAGES SUR RUE",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis2.id,
                item_type: "item",
                description: "Démarches administratives AOT et redevance d'occupation voirie auprès de la Ville de Saint-Mandé",
                quantity: 1.00,
                unit: "Forfait",
                unit_price: 1450.00,
                cost_price: 700.00,
                tva: 20,
                details: {
                    reference: "PEI990",
                    complement: "Montage du dossier en préfecture/mairie et paiement des taxes de voirie",
                    commercial: "VINUESA Alexandre/COP",
                    technicien: "VINUESA Alexandre"
                }
            },
            {
                devis_id: devis2.id,
                item_type: "item",
                description: "Échafaudage multidirectionnel avec tunnel piétons couvert, éclairage de sécurité et alarme anti-intrusion",
                quantity: 450.00,
                unit: "m²",
                unit_price: 32.00,
                cost_price: 18.00,
                tva: 10,
                details: {
                    reference: "RAVECHA",
                    complement: "Passage piétonnier conforme réglementation Ville de Saint-Mandé et bâchage acoustique",
                    cost_mat: 8.0,
                    cost_mo: 10.0,
                    margin_pct: 40
                }
            },
            {
                devis_id: devis2.id,
                item_type: "section",
                description: "1. NETTOYAGE PIERRE DE TAILLE & RESTAURATION",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis2.id,
                item_type: "item",
                description: "Réalisation d'un hydrogommage soigné par projection à basse pression de micro-granulats végétaux sans abrasion de l'épiderme",
                quantity: 320.00,
                unit: "m²",
                unit_price: 40.00,
                cost_price: 22.00,
                tva: 10,
                details: {
                    reference: "RAVGOM",
                    complement: "Nettoyage respectueux des modénatures et corniches sculptées en pierre de taille calcaire",
                    cost_mat: 7.0,
                    cost_mo: 15.0,
                    margin_pct: 42
                }
            },
            {
                devis_id: devis2.id,
                item_type: "item",
                description: "Purge des éclatements de pierre, goujonnage inox et ragréage au mortier de chaux grasse ton Pierre de Paris",
                quantity: 85.00,
                unit: "ml",
                unit_price: 48.00,
                cost_price: 24.00,
                tva: 10,
                details: {
                    reference: "RAVAPPUI",
                    complement: "Restauration des parements sculptés et taille de pierre de ragréage",
                    cost_mat: 10.0,
                    cost_mo: 14.0,
                    margin_pct: 45
                }
            },
            {
                devis_id: devis2.id,
                item_type: "section",
                description: "2. FINITION PEINTURE MICROPOREUSE D2",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis2.id,
                item_type: "item",
                description: "Application d'un fixateur régulateur siloxane et 2 couches de peinture classe D2 microporeuse autonettoyante",
                quantity: 450.00,
                unit: "m²",
                unit_price: 19.91,
                cost_price: 9.80,
                tva: 10,
                details: {
                    reference: "RAVD2",
                    complement: "Peinture acrylique siloxane classe D2 ton Pierre conforme Architecte des Bâtiments de France (ABF)",
                    cost_mat: 4.2,
                    cost_mo: 5.6,
                    margin_pct: 46
                }
            }
        ]

        await supabase.from('devis_items').insert(itemsDevis2)
        const devis2HT = 41689.50
        const devis2TTC = 46027.40
        await supabase.from('devis').update({ total_ht: devis2HT, total_ttc: devis2TTC }).eq('id', devis2.id)

        // Devis 3: Chantier 3 (D23010550 - Conflans)
        const { data: devis3, error: devis3Err } = await supabase
            .from('devis')
            .insert({
                chantier_id: chantier3.id,
                reference: "D23010550",
                name: "IMPERMÉABILITÉ I2 & COUVERTINES ZINGUERIE",
                status: "valide",
                notes: "Marché n° D23010550 - Résidence Plein Air (14 rue de Conflans, 78700 Conflans-Sainte-Honorine).\nSyndic : FONCIA Rives de Seine.\nGarantie décennale SMA BTP n°892401-K.\nConditions : Acompte de 35% encaissé à la signature, situations mensuelles au métré réalisé, retenue de garantie 5% cautionnée.",
                created_by: userId
            })
            .select()
            .single()

        if (devis3Err || !devis3) {
            throw new Error("Erreur devis 3: " + devis3Err?.message)
        }

        const itemsDevis3 = [
            {
                devis_id: devis3.id,
                item_type: "section",
                description: "0. INSTALLATION & SÉCURITÉ DE CHANTIER",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis3.id,
                item_type: "item",
                description: "Mise en place d'un échafaudage tubulaire classe 4 avec filets de protection",
                quantity: 850.00,
                unit: "m²",
                unit_price: 22.00,
                cost_price: 11.50,
                tva: 10,
                details: {
                    reference: "RAVECHA",
                    complement: "Montage et démontage complet compris vérification technique initiale",
                    cost_mat: 4.5,
                    cost_mo: 7.0,
                    margin_pct: 44
                }
            },
            {
                devis_id: devis3.id,
                item_type: "item",
                description: "Location et mise en place d'une base vie autonome pour 4-5 personnes (1 mois)",
                quantity: 1.00,
                unit: "Forfait",
                unit_price: 1200.00,
                cost_price: 650.00,
                tva: 10,
                details: {
                    reference: "RAVBASEVIE",
                    complement: "Roulotte de chantier autonome avec vestiaires, réfectoire et WC intégrés",
                    cost_mat: 350,
                    cost_mo: 300,
                    margin_pct: 45
                }
            },
            {
                devis_id: devis3.id,
                item_type: "section",
                description: "1. TRAITEMENT DES FISSURES & DÉCONTAMINATION",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis3.id,
                item_type: "item",
                description: "Nettoyage et décontamination fongicide des façades par produit biodégradable sans chlore",
                quantity: 850.00,
                unit: "m²",
                unit_price: 7.90,
                cost_price: 3.50,
                tva: 10,
                details: {
                    reference: "RAVGEL",
                    complement: "Pulvérisation anti-mousse rémanente et rinçage à pression régulée 120b",
                    cost_mat: 1.2,
                    cost_mo: 2.3,
                    margin_pct: 50
                }
            },
            {
                devis_id: devis3.id,
                item_type: "item",
                description: "Traitement curatif des fissures vivantes avec ouverture en V, pontage élastomère et mastic polyuréthane",
                quantity: 240.00,
                unit: "ml",
                unit_price: 22.00,
                cost_price: 10.50,
                tva: 10,
                details: {
                    reference: "RAVAPPUI",
                    complement: "Application d'un fond de joint mousse, primaire d'accrochage et pontage armé d'un voile synthétique",
                    cost_mat: 4.0,
                    cost_mo: 6.5,
                    margin_pct: 48
                }
            },
            {
                devis_id: devis3.id,
                item_type: "section",
                description: "2. REVÊTEMENT TECHNIQUE IMPERMÉABILITÉ I2",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis3.id,
                item_type: "item",
                description: "Mise en oeuvre d'un revêtement d'imperméabilité classe I2 garanti 10 ans SMA BTP avec sous-couche fibrée et finition talochée",
                quantity: 850.00,
                unit: "m²",
                unit_price: 39.50,
                cost_price: 21.00,
                tva: 10,
                details: {
                    reference: "RAVI2",
                    complement: "Résine acrylique souple à haute élasticité résistant à la fissuration dynamique jusqu'à 0,5 mm",
                    cost_mat: 9.5,
                    cost_mo: 11.5,
                    margin_pct: 42
                }
            },
            {
                devis_id: devis3.id,
                item_type: "section",
                description: "3. ZINGUERIE & COUVERTINES ACROTÈRES",
                quantity: 1,
                unit: "",
                unit_price: 0,
                tva: 10,
                details: {}
            },
            {
                devis_id: devis3.id,
                item_type: "item",
                description: "Fourniture et pose de couvertines d'acrotères en aluminium laqué 15/10ème plié sur pattes inox avec joints néoprène",
                quantity: 110.00,
                unit: "ml",
                unit_price: 54.61,
                cost_price: 28.00,
                tva: 10,
                details: {
                    reference: "RAVCOUV",
                    complement: "Profil aluminium plié sur mesure avec éclisses et retombée extérieure anti-goutte d'eau",
                    cost_mat: 16.0,
                    cost_mo: 12.0,
                    margin_pct: 44
                }
            },
            {
                devis_id: devis3.id,
                item_type: "item",
                description: "Remplacement des descentes d'eaux pluviales en zinc naturel diamètre 100 mm avec colliers et dauphins fonte",
                quantity: 42.00,
                unit: "ml",
                unit_price: 65.00,
                cost_price: 32.00,
                tva: 10,
                details: {
                    reference: "RAVDESCENTE",
                    complement: "Descentes en zinc épaisseur 0,65 mm avec soudures étanches et dauphin fonte antichoc 1m",
                    cost_mat: 15.0,
                    cost_mo: 17.0,
                    margin_pct: 46
                }
            }
        ]

        await supabase.from('devis_items').insert(itemsDevis3)
        const devis3HT = 74207.10
        const devis3TTC = 81627.81
        await supabase.from('devis').update({ total_ht: devis3HT, total_ttc: devis3TTC }).eq('id', devis3.id)

        // 6. CREATE REAL PROFESSIONAL FACTURES (ACOMTES & SITUATIONS WITH ITEM-BY-ITEM DETAILS)

        // Facture 1: Acompte 40% sur Devis D26100199 (Résidence Les Jasmins - Payée)
        // Montant exact correspondant aux 40% de la photo 1 : 91 708.36 € TTC !
        const fac1HT = 83371.24
        const fac1TTC = 91708.36
        const { data: fac1 } = await supabase
            .from('factures')
            .insert({
                chantier_id: chantier1.id,
                devis_id: devis1.id,
                reference: "FAC-2026-001",
                type: "acompte",
                status: "payee",
                date_emission: "2026-10-16",
                date_echeance: "2026-10-31",
                total_ht: fac1HT,
                total_ttc: fac1TTC,
                created_by: userId
            })
            .select()
            .single()

        if (fac1) {
            await supabase.from('factures_items').insert([
                {
                    facture_id: fac1.id,
                    description: "Acompte contractuel de 40% à la commande sur devis D26100199 du 15/10/2026 (Ravalement simple des 5 bâtiments - Résidence Les Jasmins, 32 rue Paul Cézanne, 78300 Poissy - Syndic LAMY)",
                    quantity: 1,
                    unit: "Forfait",
                    unit_price: 75870.00,
                    tva: 10,
                    progress_percentage: 100
                },
                {
                    facture_id: fac1.id,
                    description: "Mobilisation générale du matériel & transport des échafaudages classe 4 (Tranche ferme de démarrage)",
                    quantity: 1,
                    unit: "Forfait",
                    unit_price: 7501.24,
                    tva: 10,
                    progress_percentage: 100
                }
            ])
        }

        // Facture 2: Acompte 30% sur Devis D26100236 (76 Avenue de Paris - En attente)
        const fac2HT = 12506.85
        const fac2TTC = 13902.54
        const { data: fac2 } = await supabase
            .from('factures')
            .insert({
                chantier_id: chantier2.id,
                devis_id: devis2.id,
                reference: "FAC-2026-002",
                type: "acompte",
                status: "en_attente",
                date_emission: "2026-10-18",
                date_echeance: "2026-11-02",
                total_ht: fac2HT,
                total_ttc: fac2TTC,
                created_by: userId
            })
            .select()
            .single()

        if (fac2) {
            await supabase.from('factures_items').insert([
                {
                    facture_id: fac2.id,
                    description: "Acompte de 30% à la signature du marché de travaux - Devis D26100236 (Rénovation façade pierre de taille & enduit D2 au 76 Avenue de Paris, Saint-Mandé - Cabinet BARBEY)",
                    quantity: 1,
                    unit: "Forfait",
                    unit_price: 11056.85,
                    tva: 10,
                    progress_percentage: 100
                },
                {
                    facture_id: fac2.id,
                    description: "Dossier administratif & redevance municipale d'occupation de voirie (AOT pour tunnel piétons sécurisé)",
                    quantity: 1,
                    unit: "Forfait",
                    unit_price: 1450.00,
                    tva: 20,
                    progress_percentage: 100
                }
            ])
        }

        // Facture 3: Acompte 35% sur Devis D23010550 (Résidence Plein Air - Payée)
        const fac3HT = 25972.48
        const fac3TTC = 28569.73
        const { data: fac3 } = await supabase
            .from('factures')
            .insert({
                chantier_id: chantier3.id,
                devis_id: devis3.id,
                reference: "FAC-2026-003",
                type: "acompte",
                status: "payee",
                date_emission: "2026-09-20",
                date_echeance: "2026-10-05",
                total_ht: fac3HT,
                total_ttc: fac3TTC,
                created_by: userId
            })
            .select()
            .single()

        if (fac3) {
            await supabase.from('factures_items').insert([
                {
                    facture_id: fac3.id,
                    description: "Acompte contractuel d'approvisionnement de 35% sur devis D23010550 (Marché d'imperméabilité I2 & zinguerie - Résidence Plein Air, 14 rue de Conflans, Conflans-Sainte-Honorine - Syndic FONCIA)",
                    quantity: 1,
                    unit: "Forfait",
                    unit_price: 25972.48,
                    tva: 10,
                    progress_percentage: 100
                }
            ])
        }

        // Facture 4: Situation de travaux n°1 sur Chantier 3 (Avancement métré réel - En attente)
        const fac4HT = 27707.34
        const fac4TTC = 30478.07
        const { data: fac4 } = await supabase
            .from('factures')
            .insert({
                chantier_id: chantier3.id,
                devis_id: devis3.id,
                reference: "S1-D23010550",
                type: "situation",
                situation_index: 1,
                status: "en_attente",
                date_emission: "2026-10-15",
                date_echeance: "2026-10-30",
                total_ht: fac4HT,
                total_ttc: fac4TTC,
                created_by: userId
            })
            .select()
            .single()

        if (fac4) {
            await supabase.from('factures_items').insert([
                {
                    facture_id: fac4.id,
                    description: "Lot 01 - Installation de chantier & Base-vie autonome (1 mois)",
                    quantity: 1,
                    unit: "Forfait",
                    unit_price: 1200.00,
                    tva: 10,
                    progress_percentage: 100 // 1 200.00 €
                },
                {
                    facture_id: fac4.id,
                    description: "Lot 02 - Échafaudage tubulaire classe 4 avec filets pare-gravats (850 m²)",
                    quantity: 850,
                    unit: "m²",
                    unit_price: 22.00,
                    tva: 10,
                    progress_percentage: 100 // 18 700.00 €
                },
                {
                    facture_id: fac4.id,
                    description: "Lot 03 - Nettoyage et décontamination fongicide des façades (850 m²)",
                    quantity: 850,
                    unit: "m²",
                    unit_price: 7.90,
                    tva: 10,
                    progress_percentage: 80 // 5 372.00 €
                },
                {
                    facture_id: fac4.id,
                    description: "Lot 04 - Traitement curatif des fissures vivantes et pontage élastomère (240 ml)",
                    quantity: 240,
                    unit: "ml",
                    unit_price: 22.00,
                    tva: 10,
                    progress_percentage: 75 // 3 960.00 €
                },
                {
                    facture_id: fac4.id,
                    description: "Lot 05 - Système d'imperméabilité I2 garanti 10 ans SMA BTP (850 m²)",
                    quantity: 850,
                    unit: "m²",
                    unit_price: 39.50,
                    tva: 10,
                    progress_percentage: 30 // 10 072.50 €
                },
                {
                    facture_id: fac4.id,
                    description: "Lot 06 - Fourniture et pose de couvertines alu laqué 15/10ème sur acrotères (110 ml)",
                    quantity: 110,
                    unit: "ml",
                    unit_price: 54.61,
                    tva: 10,
                    progress_percentage: 40 // 2 402.84 €
                },
                {
                    facture_id: fac4.id,
                    description: "Déduction contractuelle de l'acompte de 35% déjà versé au démarrage du marché",
                    quantity: 1,
                    unit: "Forfait",
                    unit_price: -14000.00,
                    tva: 10,
                    progress_percentage: 100 // -14 000.00 €
                }
            ])
        }

        // 7. CREATE REAL CHANTIER NODES (KANBAN TASKS)
        const nodesChantier1 = [
            {
                id: crypto.randomUUID(),
                chantier_id: chantier1.id,
                type: "step",
                action_type: "site_visit",
                label: "Visite technique préalable & constat d'huissier contradictoire",
                status: "done",
                position_x: 50,
                position_y: 100,
                data: { technician: "VINUESA Alexandre", date: "2026-10-10" }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier1.id,
                type: "step",
                action_type: "quote",
                label: "Émission devis ravalement D26100199 (208 601.95 € HT / 229 270.90 € TTC)",
                status: "done",
                position_x: 250,
                position_y: 100,
                data: { devis_id: devis1.id, reference: devis1.reference }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier1.id,
                type: "step",
                action_type: "invoice",
                label: "Encaissement acompte 40% (FAC-2026-001 - 91 708.36 € TTC)",
                status: "done",
                position_x: 450,
                position_y: 100,
                data: { facture_id: fac1?.id }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier1.id,
                type: "step",
                action_type: "setup",
                label: "Livraison base-vie raccordée & montage échafaudages classe 4",
                status: "done",
                position_x: 650,
                position_y: 100,
                data: { team: "Équipe Échafaudages", duration: "5 jours" }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier1.id,
                type: "step",
                action_type: "cleaning",
                label: "Lavage gel Soluroc 140b & piquage des enduits soufflés Bât. A",
                status: "in_progress",
                position_x: 850,
                position_y: 100,
                data: { progress: 65 }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier1.id,
                type: "step",
                action_type: "client_choice",
                label: "Essai témoins au nuancier D3 (RAL 9010 & Sable Doré) avec Conseil Syndical",
                status: "pending",
                position_x: 1050,
                position_y: 100,
                data: { choices: ["RAL 9010", "Sable Doré 1015", "Gris Quartz 7039"] }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier1.id,
                type: "step",
                action_type: "reception_report",
                label: "Procès-verbal de réception des travaux sans réserves (5 bâtiments)",
                status: "pending",
                position_x: 1250,
                position_y: 100,
                data: {}
            }
        ]

        const nodesChantier2 = [
            {
                id: crypto.randomUUID(),
                chantier_id: chantier2.id,
                type: "step",
                action_type: "setup",
                label: "Dépôt dossier arrêté de voirie AOT & passage piétons sécurisé",
                status: "done",
                position_x: 50,
                position_y: 150,
                data: { date_depot: "2026-10-12" }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier2.id,
                type: "step",
                action_type: "quote",
                label: "Présentation devis D26100236 en Assemblée Générale (41 689.50 € HT)",
                status: "in_progress",
                position_x: 250,
                position_y: 150,
                data: { devis_id: devis2.id, reference: devis2.reference }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier2.id,
                type: "step",
                action_type: "invoice",
                label: "Appel de fonds & émission acompte 30% (FAC-2026-002 - 13 902.54 € TTC)",
                status: "pending",
                position_x: 450,
                position_y: 150,
                data: { facture_id: fac2?.id }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier2.id,
                type: "step",
                action_type: "material_order",
                label: "Commande micro-granulats végétaux hydrogommage & peinture D2 ton Pierre",
                status: "pending",
                position_x: 650,
                position_y: 150,
                data: { fournisseur: "Zolpan BTP" }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier2.id,
                type: "step",
                action_type: "setup",
                label: "Montage échafaudage sur voie publique avec alarme anti-intrusion",
                status: "pending",
                position_x: 850,
                position_y: 150,
                data: {}
            }
        ]

        const nodesChantier3 = [
            {
                id: crypto.randomUUID(),
                chantier_id: chantier3.id,
                type: "step",
                action_type: "site_visit",
                label: "Sondage des acrotères & calpinage des couvertines alu 15/10ème",
                status: "done",
                position_x: 50,
                position_y: 200,
                data: {}
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier3.id,
                type: "step",
                action_type: "quote",
                label: "Signature marché devis D23010550 (74 207.10 € HT / 81 627.81 € TTC)",
                status: "done",
                position_x: 180,
                position_y: 200,
                data: { devis_id: devis3.id, reference: devis3.reference }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier3.id,
                type: "step",
                action_type: "invoice",
                label: "Encaissement acompte 35% approvisionnement (FAC-2026-003 - 28 569.73 € TTC)",
                status: "done",
                position_x: 320,
                position_y: 200,
                data: { facture_id: fac3?.id }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier3.id,
                type: "step",
                action_type: "cleaning",
                label: "Décontamination cryptogamique & pontage élastomère des fissures vivantes",
                status: "done",
                position_x: 450,
                position_y: 200,
                data: {}
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier3.id,
                type: "step",
                action_type: "setup",
                label: "Pose des couvertines alu laqué et système imperméabilité I2 (avancement 30%)",
                status: "in_progress",
                position_x: 650,
                position_y: 200,
                data: { progress: 30 }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier3.id,
                type: "step",
                action_type: "invoice",
                label: "Vérification et validation situation n°1 (S1-D23010550 - 30 478.07 € TTC)",
                status: "in_progress",
                position_x: 850,
                position_y: 200,
                data: { facture_id: fac4?.id }
            },
            {
                id: crypto.randomUUID(),
                chantier_id: chantier3.id,
                type: "step",
                action_type: "photo_report",
                label: "Rapport photo drone de conformité acrotères & étanchéité SMA BTP",
                status: "pending",
                position_x: 1050,
                position_y: 200,
                data: {}
            }
        ]

        const allNodes = [...nodesChantier1, ...nodesChantier2, ...nodesChantier3]
        await supabase.from('chantier_nodes').insert(allNodes)

        // 8. REVALIDATE ALL DASHBOARD ROUTES
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/clients')
        revalidatePath('/dashboard/chantiers')
        revalidatePath('/dashboard/articles')
        revalidatePath('/dashboard/devis')
        revalidatePath('/dashboard/factures')
        revalidatePath('/dashboard/trello')
        revalidatePath('/dashboard/planning')

        return {
            success: true,
            summary: {
                clients: insertedClients.length,
                chantiers: insertedChantiers.length,
                articles: missingArticles.length,
                devis: 3,
                factures: 4,
                nodes: allNodes.length,
                email: "mattiskhn@gmail.com"
            }
        }
    } catch (err: any) {
        console.error("Exception dans seedProBtpDataAction:", err)
        return {
            success: false,
            error: err.message || "Erreur inattendue pendant l'initialisation."
        }
    }
}
