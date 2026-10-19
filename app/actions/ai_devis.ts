'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function generateDevisFromEmail(emailText: string) {
    if (!process.env.GEMINI_API_KEY) {
        return { error: "Clé API Gemini manquante. Veuillez la configurer dans .env.local" }
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: "Non connecté" }

        // 1. Récupérer un résumé du catalogue d'articles de l'artisan
        const { data: articles } = await supabase
            .from('articles')
            .select('id, name, unit, category')
            .order('name')
        
        const catalogList = (articles || []).map(a => `- [ID:${a.id}] ${a.name} (Unité: ${a.unit}, Catégorie: ${a.category})`).join('\n')

        // 2. Préparer le prompt pour l'IA
        const prompt = `
Tu es un assistant pour un artisan du bâtiment. L'artisan a reçu cet email d'un client potentiel.
Ton rôle est de lire l'email et de générer un brouillon de devis en te basant **UNIQUEMENT** sur les articles disponibles dans le catalogue de l'artisan.

=== CATALOGUE DE L'ARTISAN ===
${catalogList.length > 0 ? catalogList : 'Le catalogue est vide.'}
==============================

=== EMAIL DU CLIENT ===
${emailText}
========================

Instructions:
1. Identifie le nom du client (ou devine-le via la signature, sinon "Client Inconnu").
2. Identifie le nom du chantier (ex: "Peinture Salon").
3. Liste les articles nécessaires en piochant **exclusivement** les ID parmi le catalogue fourni. Estime les quantités si elles sont données ou déductibles (ex: si "salon de 20m2", mets 20).
4. Retourne UNIQUEMENT une réponse au format JSON valide (sans markdown, ni backticks).

Format JSON attendu :
{
  "client_name": "Nom du client",
  "project_name": "Titre du chantier",
  "items": [
    {
      "article_id": "L'ID de l'article dans le catalogue (chiffre ou uuid)",
      "quantity": 10
    }
  ]
}
`

        // 3. Appel à Gemini (modèle flash, très rapide et moins cher pour du parsing)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } })
        
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        
        let parsedResult
        try {
            parsedResult = JSON.parse(responseText)
        } catch (e) {
            console.error("Erreur parsing JSON de l'IA:", responseText)
            return { error: "L'IA n'a pas renvoyé un format valide." }
        }

        // 4. Création des entités en base
        // A. Créer un client (ou trouver s'il existe déjà)
        let clientId = null
        const { data: existingClients } = await supabase
            .from('clients')
            .select('id')
            .ilike('name', `%${parsedResult.client_name}%`)
            .limit(1)

        if (existingClients && existingClients.length > 0) {
            clientId = existingClients[0].id
        } else {
            const { data: newClient } = await supabase
                .from('clients')
                .insert({
                    name: parsedResult.client_name || 'Client IA',
                    type: 'particulier',
                    created_by: user.id
                })
                .select()
                .single()
            clientId = newClient?.id
        }

        // B. Créer un Chantier
        const { data: newChantier, error: chantierError } = await supabase
            .from('chantiers')
            .insert({
                name: parsedResult.project_name || 'Nouveau Chantier IA',
                client_id: clientId,
                status: 'etude',
                created_by: user.id
            })
            .select()
            .single()
        
        if (chantierError) return { error: "Erreur création chantier" }

        // C. Créer un Devis brouillon
        const { data: newDevis, error: devisError } = await supabase
            .from('devis')
            .insert({
                chantier_id: newChantier.id,
                status: 'brouillon',
                reference: `D-IA-${Date.now().toString().slice(-4)}`,
                created_by: user.id,
                notes: 'Devis généré par IA depuis un email.'
            })
            .select()
            .single()
        
        if (devisError) return { error: "Erreur création devis" }

        // D. Insérer les items
        if (parsedResult.items && parsedResult.items.length > 0) {
            // Récupérer les détails des articles pour copier le prix et l'unité
            const articleIds = parsedResult.items.map((i: any) => i.article_id).filter(Boolean)
            
            if (articleIds.length > 0) {
                const { data: matchedArticles } = await supabase
                    .from('articles')
                    .select('*')
                    .in('id', articleIds)

                if (matchedArticles) {
                    const devisItemsToInsert = parsedResult.items.map((aiItem: any) => {
                        const article = matchedArticles.find(a => a.id.toString() === aiItem.article_id.toString())
                        if (!article) return null
                        
                        return {
                            devis_id: newDevis.id,
                            article_id: article.id,
                            description: article.name,
                            quantity: aiItem.quantity || 1,
                            unit: article.unit,
                            unit_price: article.price_ht,
                            cost_price: article.cost_ht,
                            tva: article.tva || 20,
                            item_type: 'item'
                        }
                    }).filter(Boolean)

                    if (devisItemsToInsert.length > 0) {
                        await supabase.from('devis_items').insert(devisItemsToInsert)
                        
                        // Calcul des totaux basique pour le brouillon
                        let totalHT = 0
                        let totalTTC = 0
                        devisItemsToInsert.forEach((item: any) => {
                            const ht = item.quantity * item.unit_price
                            totalHT += ht
                            totalTTC += ht * (1 + item.tva / 100)
                        })
                        
                        await supabase.from('devis').update({
                            total_ht: totalHT,
                            total_ttc: totalTTC
                        }).eq('id', newDevis.id)
                    }
                }
            }
        }

        revalidatePath('/dashboard/devis')
        return { success: true, devisId: newDevis.id }

    } catch (error: any) {
        console.error("Erreur generateDevisFromEmail:", error)
        return { error: error.message || "Erreur interne" }
    }
}
