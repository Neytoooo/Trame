import { GoogleGenerativeAI } from '@google/generative-ai'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ExtractedDevisData, CreatedDevisSummary } from '../types/devis'
import { getGeminiApiKey, getKotaApiUrl } from '../config/env'

const STORAGE_DEVIS_KEY = '@kota_created_devis'

/**
 * Sauvegarde locale sur le smartphone pour consultation dans l'historique mobile
 */
async function saveDevisToLocalHistory(summary: CreatedDevisSummary) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_DEVIS_KEY)
    const list: CreatedDevisSummary[] = raw ? JSON.parse(raw) : []
    const updated = [summary, ...list.filter((d) => d.id !== summary.id && d.reference !== summary.reference)].slice(0, 30)
    await AsyncStorage.setItem(STORAGE_DEVIS_KEY, JSON.stringify(updated))
  } catch {
    // Non-bloquant
  }
}

/**
 * Analyse une photo de notes manuscrites via Gemini Vision
 * et génère automatiquement le devis dans la base KOTA Web avec notification.
 */
export async function analyzePhotoAndCreateDevis(
  base64Image: string,
  mimeType: string = 'image/jpeg',
  additionalNotes: string = ''
): Promise<{
  success: boolean
  devis?: CreatedDevisSummary
  extracted?: ExtractedDevisData
  error?: string
}> {
  const kotaApiUrl = await getKotaApiUrl()

  // 1. Tenter l'analyse directe par l'API KOTA Web
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    const response = await fetch(`${kotaApiUrl}/api/mobile/devis/from-photo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
      body: JSON.stringify({
        imageBase64: base64Image,
        mimeType,
        textNotes: additionalNotes,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.devis) {
        await saveDevisToLocalHistory(data.devis)
        return {
          success: true,
          devis: data.devis,
          extracted: data.extracted,
        }
      }
    }
  } catch (apiErr: any) {
    console.log('Serveur KOTA non joignable immédiatement, analyse via Gemini direct sur le téléphone:', apiErr.message)
  }

  // 2. Bascule autonome sur le téléphone : Gemini 3.5 Flash Vision
  try {
    const apiKey = await getGeminiApiKey()
    const genAI = new GoogleGenerativeAI(apiKey)

    const prompt = `
Tu es un chiffreur et métreur professionnel pour artisans du bâtiment (BTP).
Analyse cette PHOTO de notes manuscrites, métré de chantier ou devis papier (ou les notes textuelles fournies).

Objectifs :
1. Déchiffre le NOM DU CLIENT (ex: "M. Dupont", "M. Lefebvre" ou "Client Chantier").
2. Déchiffre le NOM DU CHANTIER / PROJET (ex: "Ravalement de façade", "Rénovation Salon").
3. Déchiffre l'ADRESSE si mentionnée.
4. Déchiffre les LIGNES DE TRAVAUX, FOURNITURES, SURFACES ET QUANTITÉS avec :
   - "description": libellé clair du travail à exécuter
   - "quantity": quantité numérique relevée (ex: 165)
   - "unit": unité BTP adaptée ("m²", "ml", "u", "h", "Forfait", "Ens")
   - "unit_price": prix unitaire HT estimé réaliste en euros (ex: 45)
   - "tva": taux de TVA (10 pour rénovation, 20 pour neuf)

Notes supplémentaires éventuelles de l'artisan : "${additionalNotes}"

Réponds STRICTEMENT sous ce format JSON :
{
  "client_name": "Nom du client",
  "client_phone": null,
  "client_address": null,
  "project_name": "Nom du chantier",
  "notes": "Synthèse des relevés",
  "items": [
    {
      "description": "Préparation des fonds et ponçage",
      "quantity": 30,
      "unit": "m²",
      "unit_price": 18,
      "tva": 10
    }
  ]
}
`

    const cleanBase64 = base64Image ? base64Image.replace(/^data:image\/[a-z]+;base64,/, '') : ''
    const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest']
    let text = ''
    let lastError: any = null

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        })

        const contentParts: any[] = []
        if (cleanBase64) {
          contentParts.push({
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          })
        }
        contentParts.push(prompt)

        const result = await model.generateContent(contentParts)
        text = result.response.text()
        if (text) break
      } catch (err: any) {
        lastError = err
        console.warn(`Modèle ${modelName} indisponible, essai suivant...`, err.message)
      }
    }

    if (!text) {
      throw lastError || new Error("L'IA n'a pas pu traiter l'image.")
    }

    const parsed: ExtractedDevisData = JSON.parse(text)
    const ref = `DEV-MOB-${Date.now().toString().slice(-5)}`
    let totalHT = 0
    parsed.items.forEach((item) => {
      totalHT += (Number(item.quantity) || 1) * (Number(item.unit_price) || 0)
    })
    totalHT = Math.round(totalHT * 100) / 100

    let finalSummary: CreatedDevisSummary = {
      id: `dev-mob-${Date.now()}`,
      reference: ref,
      projectName: parsed.project_name || 'Chantier Mobile',
      clientName: parsed.client_name || 'Client Mobile',
      totalHT,
      itemsCount: parsed.items.length,
      webEditUrl: `/dashboard/devis/dev-mob-${Date.now()}/edit`,
    }

    // 3. Envoi du devis extrait vers l'API KOTA Web pour insertion en base et déclenchement de la notification
    try {
      const syncController = new AbortController()
      const syncTimeout = setTimeout(() => syncController.abort(), 15000)

      const saveRes = await fetch(`${kotaApiUrl}/api/mobile/devis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({
          clientName: parsed.client_name,
          clientPhone: parsed.client_phone,
          clientAddress: parsed.client_address,
          projectName: parsed.project_name,
          notes: parsed.notes,
          items: parsed.items,
        }),
        signal: syncController.signal,
      })

      clearTimeout(syncTimeout)

      if (saveRes.ok) {
        const savedData = await saveRes.json()
        if (savedData.success && savedData.devis) {
          finalSummary = savedData.devis
        }
      }
    } catch (syncErr: any) {
      console.warn('Sync /api/mobile/devis différée (sauvegarde locale maintenue):', syncErr.message)
    }

    await saveDevisToLocalHistory(finalSummary)

    return {
      success: true,
      devis: finalSummary,
      extracted: parsed,
    }
  } catch (directErr: any) {
    console.error('Erreur Gemini direct:', directErr)
    return {
      success: false,
      error: directErr.message || 'Impossible d\'analyser la photo.',
    }
  }
}
