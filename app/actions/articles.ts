'use server'

import { getCurrentCompanyId } from '@/lib/company'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createArticle(formData: FormData) {
    const supabase = await createClient()

    // 1. Vérifier l'utilisateur
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Non autorisé" }

    // 2. Récupérer les données du formulaire
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const unit = formData.get('unit') as string
    const price_ht = parseFloat(formData.get('price_ht') as string)
    let cost_ht = parseFloat(formData.get('cost_ht') as string)
    const stock = parseInt(formData.get('stock') as string) || 0
    const min_stock = parseInt(formData.get('min_stock') as string) || 0
    const supplier = formData.get('supplier') as string || null
    const reference = formData.get('reference') as string || null
    const tva = parseFloat(formData.get('tva') as string) || 20

    const composantsStr = formData.get('composants') as string
    const composants = composantsStr ? JSON.parse(composantsStr) : []

    // 3. Si c'est un ouvrage (a des composants), on peut recalculer le coût de revient exact (Optionnel mais recommandé)
    if (composants.length > 0) {
        try {
            // On récupère les IDs des composants
            const componentIds = composants.map((c: any) => c.child_article_id)
            const { data: dbArticles } = await supabase.from('articles').select('id, cost_ht').in('id', componentIds)

            if (dbArticles) {
                // On recalcule la somme: (quantité * coût_enfant)
                cost_ht = composants.reduce((acc: number, item: any) => {
                    const article = dbArticles.find(a => a.id === item.child_article_id)
                    return acc + (item.quantity * (article?.cost_ht || 0))
                }, 0)
            }
        } catch (e) {
            console.error("Erreur calcul coût ouvrage", e)
        }
    }

    // 4. Insertion en base de l'article parent avec rattachement entreprise
    const companyId = await getCurrentCompanyId(supabase)
    const insertPayload: any = {
        name,
        category,
        unit,
        price_ht,
        cost_ht,
        stock,
        min_stock,
        supplier,
        reference,
        tva,
        company_id: companyId,
        created_by: user.id
    }

    let { data: newArticle, error } = await supabase.from('articles').insert(insertPayload).select().single()

    if (error && (error.code === 'PGRST204' || error.message?.includes('company_id'))) {
        const { company_id, ...fallbackPayload } = insertPayload
        const retry = await supabase.from('articles').insert(fallbackPayload).select().single()
        newArticle = retry.data
        error = retry.error
    }

    if (error) {
        console.error(error)
        return { error: "Erreur lors de la création" }
    }

    // 5. Si composants, insertion dans la table de liaison
    if (composants.length > 0 && newArticle) {
        const composantsToInsert = composants.map((c: any) => ({
            parent_article_id: newArticle.id,
            child_article_id: c.child_article_id,
            quantity: c.quantity
        }))

        const { error: compError } = await supabase.from('article_composants').insert(composantsToInsert)
        if (compError) console.error("Erreur insertion composants", compError)
    }

    // 6. Rafraîchir la page pour afficher le nouvel article
    revalidatePath('/dashboard/articles')
    return { success: true }
}

export async function updateArticleAction(id: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Non autorisé" }

    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const unit = formData.get('unit') as string
    const price_ht = parseFloat(formData.get('price_ht') as string) || 0
    const cost_ht = parseFloat(formData.get('cost_ht') as string) || 0
    const stock = parseInt(formData.get('stock') as string) || 0
    const min_stock = parseInt(formData.get('min_stock') as string) || 0
    const supplier = formData.get('supplier') as string || null
    const reference = formData.get('reference') as string || null
    const tva = parseFloat(formData.get('tva') as string) || 20

    const { error } = await supabase.from('articles').update({
        name,
        category,
        unit,
        price_ht,
        cost_ht,
        stock,
        min_stock,
        supplier,
        reference,
        tva
    }).eq('id', id)

    if (error) {
        console.error("Erreur mise à jour article:", error)
        return { error: "Erreur lors de la mise à jour" }
    }

    revalidatePath('/dashboard/articles')
    return { success: true }
}

export async function deleteArticleAction(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Non autorisé" }

    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (error) {
        console.error("Erreur suppression article:", error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/articles')
    return { success: true }
}

export async function searchArticles(query: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('articles')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10)
    return data || []
}

export type ImportArticleItem = {
    name: string
    category?: string
    unit?: string
    price_ht?: number
    cost_ht?: number
    reference?: string | null
    tva?: number
    stock?: number
    min_stock?: number
    supplier?: string | null
    hasConflict?: boolean
    existingId?: string
    conflictStrategy?: 'replace' | 'rename' | 'skip'
}

export async function getExistingArticlesForImportAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('articles')
        .select('id, name, reference, unit, price_ht, cost_ht')
        .order('name', { ascending: true })

    return data || []
}

export async function importArticlesWithConflictsAction(items: ImportArticleItem[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Non connecté" }

    let insertedCount = 0
    let updatedCount = 0
    let skippedCount = 0

    const toInsert: any[] = []

    for (const item of items) {
        if (item.hasConflict) {
            if (item.conflictStrategy === 'skip') {
                skippedCount++
                continue
            } else if (item.conflictStrategy === 'replace' && item.existingId) {
                const updatePayload: any = {
                    category: item.category || 'fourniture',
                    unit: item.unit || 'u',
                    price_ht: item.price_ht || 0,
                    cost_ht: item.cost_ht || 0,
                    tva: item.tva || 20,
                    stock: item.stock || 0,
                    min_stock: item.min_stock || 0
                }
                if (item.reference) updatePayload.reference = item.reference
                if (item.supplier) updatePayload.supplier = item.supplier

                const { error: updErr } = await supabase
                    .from('articles')
                    .update(updatePayload)
                    .eq('id', item.existingId)

                if (!updErr) {
                    updatedCount++
                } else {
                    console.error("Erreur mise à jour article:", updErr)
                }
                continue
            }
        }

        // Insertion (article nouveau ou renommé)
        toInsert.push({
            created_by: user.id,
            name: item.name,
            category: item.category || 'fourniture',
            unit: item.unit || 'u',
            price_ht: item.price_ht || 0,
            cost_ht: item.cost_ht || 0,
            reference: item.reference || null,
            tva: item.tva || 20,
            stock: item.stock || 0,
            min_stock: item.min_stock || 0,
            supplier: item.supplier || null
        })
    }

    if (toInsert.length > 0) {
        const { error: insErr } = await supabase.from('articles').insert(toInsert)
        if (insErr) {
            console.error("Erreur import articles:", insErr)
            return { error: "Erreur lors de l'insertion des articles en base de données" }
        }
        insertedCount = toInsert.length
    }

    revalidatePath('/dashboard/articles')
    return {
        success: true,
        count: insertedCount + updatedCount,
        insertedCount,
        updatedCount,
        skippedCount
    }
}

// Rétrocompatibilité
export async function importArticlesAction(articles: any[]) {
    return importArticlesWithConflictsAction(articles)
}

import { BTP_PRESTATIONS_CATALOG } from '@/lib/btpCatalog'

export async function restoreBtpCatalogNonDestructiveAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Vous devez être connecté." }

    // 1. Récupérer TOUS les articles existants en base pour cet utilisateur
    const { data: existingArticles, error: fetchErr } = await supabase
        .from('articles')
        .select('name, reference')

    if (fetchErr) {
        console.error("Erreur récupération articles existants:", fetchErr)
    }

    const existingNames = new Set((existingArticles || []).map(a => a.name?.trim().toLowerCase()))
    const existingRefs = new Set((existingArticles || []).map(a => a.reference?.trim().toLowerCase()).filter(Boolean))

    // 2. Ne sélectionner QUE les articles du catalogue standard BTP qui ne sont pas déjà en base
    const missingArticles = BTP_PRESTATIONS_CATALOG.filter(a => {
        const primaryName = a.name.trim().toLowerCase()
        const fullName = `${a.name}\n${a.complement}`.trim().toLowerCase()
        const hyphenName = `${a.name} - ${a.complement}`.trim().toLowerCase()
        const ref = (a.reference || '').trim().toLowerCase()

        if (existingNames.has(primaryName) || existingNames.has(fullName) || existingNames.has(hyphenName)) {
            return false
        }
        if (ref && existingRefs.has(ref)) {
            return false
        }
        return true
    })

    if (missingArticles.length === 0) {
        return {
            success: true,
            restoredCount: 0,
            message: "Toutes les prestations du catalogue BTP sont déjà présentes."
        }
    }

    // 3. Insérer uniquement les articles manquants SANS toucher aux articles personnalisés de l'utilisateur
    const preparedData = missingArticles.map(a => ({
        created_by: user.id,
        name: `${a.name}\n${a.complement}`,
        category: a.category,
        unit: a.unit,
        price_ht: a.price_ht,
        cost_ht: a.cost_ht,
        reference: a.reference,
        tva: a.tva,
        stock: a.stock || 50,
        min_stock: a.min_stock || 10,
        supplier: `${a.metier} - ${a.famille}`
    }))

    const { error: insErr } = await supabase.from('articles').insert(preparedData)

    if (insErr) {
        console.error("Erreur restauration catalogue BTP:", insErr)
        return { error: "Erreur lors de l'enregistrement des articles manquants." }
    }

    revalidatePath('/dashboard/articles')
    return {
        success: true,
        restoredCount: preparedData.length,
        message: `${preparedData.length} prestations standards du catalogue BTP ont été réintégrées avec succès.`
    }
}

export async function seedBtpCatalogAction() {
    return restoreBtpCatalogNonDestructiveAction()
}

export async function fetchArticlesAction(offset: number, search: string) {
    const supabase = await createClient()
    const limit = 10

    let query = supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (search) {
        query = query.or(`name.ilike.%${search}%,reference.ilike.%${search}%,supplier.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching articles:', error)
    }

    // Si la table est encore vide et offset == 0, fournir les articles du catalogue pro comme aperçu
    if ((!data || data.length === 0) && offset === 0) {
        const filtered = search
            ? BTP_PRESTATIONS_CATALOG.filter(a =>
                a.name.toLowerCase().includes(search.toLowerCase()) ||
                a.reference.toLowerCase().includes(search.toLowerCase()) ||
                a.metier.toLowerCase().includes(search.toLowerCase()) ||
                a.famille.toLowerCase().includes(search.toLowerCase())
            )
            : BTP_PRESTATIONS_CATALOG

        return filtered.map((a, idx) => ({
            id: `btp_demo_${idx}`,
            name: `${a.name}\n${a.complement}`,
            category: a.category,
            unit: a.unit,
            price_ht: a.price_ht,
            cost_ht: a.cost_ht,
            reference: a.reference,
            tva: a.tva,
            stock: 50,
            min_stock: 10,
            supplier: `${a.metier} - ${a.famille}`,
            is_catalog_template: true
        }))
    }

    return data || []
}

export async function saveQuoteLinesToArticlesAction(lines: {
    lineId: string
    name: string
    unit: string
    price_ht: number
    cost_ht?: number
    category?: string
    reference?: string
    tva?: number
}[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Vous devez être connecté." }
    if (!lines || lines.length === 0) return { success: true, mappings: [] }

    const payload = lines.map(l => ({
        created_by: user.id,
        name: l.name.trim(),
        unit: l.unit?.trim() || 'u',
        price_ht: l.price_ht || 0,
        cost_ht: l.cost_ht || 0,
        category: l.category || 'ouvrage',
        reference: l.reference || null,
        tva: l.tva || 20,
        stock: 0,
        min_stock: 0
    }))

    const { data, error } = await supabase
        .from('articles')
        .insert(payload)
        .select('id, name')

    if (error) {
        console.error("Erreur enregistrement prestations dans articles:", error)
        return { error: "Erreur lors de l'enregistrement dans la bibliothèque." }
    }

    // Associer les IDs d'articles créés aux lineId d'origine
    const mappings: { lineId: string, articleId: string }[] = []
    if (data && data.length > 0) {
        lines.forEach((l, index) => {
            if (data[index]) {
                mappings.push({
                    lineId: l.lineId,
                    articleId: data[index].id
                })
            }
        })
    }

    revalidatePath('/dashboard/articles')
    return {
        success: true,
        count: data?.length || 0,
        mappings
    }
}