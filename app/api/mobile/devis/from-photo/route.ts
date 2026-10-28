import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { BTP_PRESTATIONS_CATALOG } from '@/lib/btpCatalog'
import { createAndSyncMobileDevis, MobileDevisItem } from '@/lib/mobileDevisStore'

interface ExtractedItem {
    description: string
    quantity: number
    unit: string
    unit_price?: number
    tva?: number
}

interface ExtractedDevisData {
    client_name?: string
    client_phone?: string
    client_address?: string
    project_name?: string
    notes?: string
    items: ExtractedItem[]
}

export async function POST(request: Request) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({
            success: false,
            error: 'Clé API Gemini non configurée sur le serveur KOTA'
        }, { status: 500 })
    }

    try {
        const body = await request.json()
        const { imageBase64, mimeType = 'image/jpeg', textNotes = '' } = body

        if (!imageBase64 && !textNotes) {
            return NextResponse.json({
                success: false,
                error: 'Veuillez fournir une image de notes ou du texte'
            }, { status: 400 })
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        
        // Modèles disponibles avec bascule automatique
        const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest']
        let responseText = ''
        let lastError: any = null

        // Extrait du catalogue BTP pour calibrer l'IA
        const catalogSummary = BTP_PRESTATIONS_CATALOG.slice(0, 30).map(c => 
            `- ${c.name} (Unité: ${c.unit}, Prix HT indicatif: ${c.price_ht}€, TVA: ${c.tva}%)`
        ).join('\n')

        const prompt = `
Tu es un métreur et chiffreur expert pour une entreprise du bâtiment et travaux publics (BTP).
Ta mission est d'analyser cette PHOTO de notes manuscrites, de relevé de cotes ou de carnet de chantier pris sur le terrain par un artisan.

Règles d'analyse :
1. Lis attentivement les notes manuscrites ou imprimées sur l'image (et les notes textuelles complémentaires si fournies).
2. Détecte le NOM DU CLIENT (s'il n'y en a pas, utilise "Client Chantier").
3. Détecte l'ADRESSE ou coordonnées si mentionnées.
4. Détecte le NOM DU PROJET / CHANTIER (ex: "Rénovation Peinture Appartement", "Ravalement de Façade", "Pose Carrelage Cuisine").
5. Détecte chaque TÂCHE, OUVRAGE, MATÉRIAU ou FOURNITURE avec :
   - "description" : désignation professionnelle claire et précise
   - "quantity" : métré ou quantité numérique (par ex: 25 pour 25m², 1 pour un forfait)
   - "unit" : unité de mesure BTP ("m²", "ml", "u", "h", "Forfait", "Ens")
   - "unit_price" : prix unitaire HT estimé réaliste en euros (si présent sur la photo, utilise-le, sinon estime un prix moyen marché BTP réaliste)
   - "tva" : taux de TVA applicable (10 pour rénovation habitation, 20 pour neuf/fourniture)

Catalogue indicatif pour calibrer les prix et intitulés :
${catalogSummary}

Complément d'information texte de l'artisan (si fourni) : "${textNotes}"

Format de retour JSON STRICT attendu :
{
  "client_name": "string",
  "client_phone": "string ou null",
  "client_address": "string ou null",
  "project_name": "string",
  "notes": "string résumant les spécificités relevées",
  "items": [
    {
      "description": "string",
      "quantity": 10,
      "unit": "m²",
      "unit_price": 45.0,
      "tva": 10
    }
  ]
}
`

        const contents: any[] = []
        if (imageBase64) {
            const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
            contents.push({
                inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType
                }
            })
        }
        contents.push(prompt)

        for (const modelName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        responseMimeType: 'application/json',
                        temperature: 0.2
                    }
                })
                const result = await model.generateContent(contents)
                responseText = result.response.text()
                if (responseText) break
            } catch (err: any) {
                lastError = err
                console.warn(`Modèle ${modelName} échoué dans /from-photo, bascule...`, err.message)
            }
        }

        if (!responseText) {
            throw lastError || new Error("L'IA n'a pas pu traiter l'image")
        }

        let parsedData: ExtractedDevisData
        try {
            parsedData = JSON.parse(responseText)
        } catch {
            return NextResponse.json({
                success: false,
                error: "L'IA n'a pas pu structurer l'analyse de l'image.",
                raw: responseText
            }, { status: 422 })
        }

        // Création et synchronisation du devis dans KOTA (Supabase + Store local persistant + Notification)
        const itemsToInsert: MobileDevisItem[] = (parsedData.items || []).map(item => ({
            description: item.description || 'Prestation BTP',
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'u',
            unit_price: Number(item.unit_price) || 0,
            tva: Number(item.tva) || 10
        }))

        const syncResult = await createAndSyncMobileDevis({
            clientName: parsedData.client_name || 'Client Mobile',
            clientPhone: parsedData.client_phone || undefined,
            clientAddress: parsedData.client_address || undefined,
            projectName: parsedData.project_name || 'Chantier Mobile',
            notes: parsedData.notes,
            items: itemsToInsert
        })

        return NextResponse.json({
            success: true,
            message: 'Devis créé avec succès et synchronisé sur KOTA Web !',
            devis: {
                id: syncResult.devis.id,
                reference: syncResult.devis.reference,
                projectName: syncResult.devis.name.replace(/^Devis\s+/, ''),
                clientName: syncResult.devis.chantiers?.clients?.name || 'Client',
                totalHT: syncResult.devis.total_ht,
                itemsCount: syncResult.devis.items.length,
                webEditUrl: `/dashboard/devis/${syncResult.devis.id}/edit`
            },
            notification: syncResult.notification,
            extracted: parsedData
        })
    } catch (error: any) {
        console.error('Erreur API mobile devis photo:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Erreur interne du serveur'
        }, { status: 500 })
    }
}
