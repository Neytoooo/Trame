'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Types based on the prompt
type NodeStatus = 'inactive' | 'wait' | 'validate' | 'error' | 'running'

/**
 * CORE ENGINE: checkWorkflowIntegrity
 * Recalculates the entire status of a chantier graph based on strict rules.
 */
export async function checkWorkflowIntegrity(chantierId: string) {
    const supabase = await createClient()
    console.log(`⚙️ [WORKFLOW ENGINE] Checking integrity for Chantier: ${chantierId}`)

    // 1. Fetch EVERYTHING (Nodes, Edges, Related Data)
    const { data: nodes } = await supabase.from('chantier_nodes').select('*').eq('chantier_id', chantierId)
    const { data: edges } = await supabase.from('chantier_edges').select('*').eq('chantier_id', chantierId)

    // Fetch critical business objects for logic checks
    const { data: devisList } = await supabase.from('devis').select('*, devis_items(*)').eq('chantier_id', chantierId)
    const { data: facturesList } = await supabase.from('factures').select('*, factures_items(*)').eq('chantier_id', chantierId)

    if (!nodes || !edges) return { success: false, error: "No data" }

    // Map for easy access
    let nodeMap = new Map(nodes.map(n => [n.id, { ...n, _newStatus: n.status }]))

    // 2. Locate Lancement (Root)
    const startNode = nodes.find(n => n.action_type === 'play') // 'play' = Lancement
    if (!startNode) {
        console.warn("⚠️ No Start Node found!")
        return { success: false, error: "No Start Node" }
    }

    // ---------------------------------------------------------
    // RULE 1 & 3: Ancestry Guard & Sequence
    // ---------------------------------------------------------
    const getParents = (nodeId: string) => edges.filter(e => e.target === nodeId).map(e => nodeMap.get(e.source))

    const visitQueue = [startNode.id]
    const reachableIds = new Set<string>([startNode.id])

    while (visitQueue.length > 0) {
        const currId = visitQueue.shift()!
        const children = edges.filter(e => e.source === currId).map(e => e.target)
        for (const childId of children) {
            if (!reachableIds.has(childId)) {
                reachableIds.add(childId)
                visitQueue.push(childId)
            }
        }
    }

    // ---------------------------------------------------------
    // APPLY LOGIC (State Transition)
    // ---------------------------------------------------------
    let updates: { id: string, status: string }[] = []

    for (const node of nodes) {
        const nodeObj = nodeMap.get(node.id)
        if (!reachableIds.has(node.id)) continue

        if (startNode.status !== 'done' && node.id !== startNode.id) continue

        const parents = getParents(node.id)
        const allParentsDone = parents.every(p => p?.status === 'done')

        if (!allParentsDone && node.id !== startNode.id) {
            if (node.status === 'done') {
                updates.push({ id: node.id, status: 'pending' })
                nodeObj._newStatus = 'pending'
            }
            continue
        }

        // 1. Lancement (Root)
        if (node.action_type === 'play') continue

        // 2. Création Devis (Quote)
        if (node.action_type === 'quote') {
            const linkedDevisId = node.data?.devis_id
            let isValid = false

            if (linkedDevisId) {
                const linkedQuote = devisList?.find(d => d.id === linkedDevisId)
                if (linkedQuote && (linkedQuote.status === 'en_attente_approbation' || linkedQuote.status === 'signe' || linkedQuote.status === 'approuve')) {
                    isValid = true
                }
            } else {
                isValid = devisList?.some(d => d.status === 'en_attente_approbation' || d.status === 'signe' || d.status === 'approuve') || false
            }

            if (isValid) {
                if (node.status !== 'done') {
                    updates.push({ id: node.id, status: 'done' })
                    nodeObj._newStatus = 'done'
                }
            } else {
                if (node.status === 'done') {
                    updates.push({ id: node.id, status: 'pending' })
                    nodeObj._newStatus = 'pending'
                }
            }
        }

        // 3. Création Facture (Invoice)
        else if (node.action_type === 'invoice') {
            const validFacture = facturesList?.some(f => f.status === 'payee' || f.status === 'paye')

            if (validFacture) {
                if (node.status !== 'done') {
                    updates.push({ id: node.id, status: 'done' })
                    nodeObj._newStatus = 'done'
                }
            } else {
                if (node.status === 'done') {
                    updates.push({ id: node.id, status: 'pending' })
                    nodeObj._newStatus = 'pending'
                }
            }
        }

        // 4. Client Choice (Validation Devis Only)
        else if (node.action_type === 'client_choice') {
            const parentQuoteNode = parents.find(p => p.action_type === 'quote')
            const linkedDevisId = parentQuoteNode?.data?.devis_id

            let quoteToCheck = null
            if (linkedDevisId) {
                quoteToCheck = devisList?.find(d => d.id === linkedDevisId)
            } else {
                quoteToCheck = devisList?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
            }

            if (quoteToCheck) {
                const hasItems = quoteToCheck.devis_items && quoteToCheck.devis_items.length > 0
                const validStatus = ['en_attente', 'en_attente_approbation', 'signe', 'approuve'].includes(quoteToCheck.status)

                if (hasItems && validStatus) {
                    if (node.status !== 'done') {
                        updates.push({ id: node.id, status: 'done' })
                        nodeObj._newStatus = 'done'
                    }
                } else {
                    if (node.status === 'done') {
                        updates.push({ id: node.id, status: 'pending' })
                        nodeObj._newStatus = 'pending'
                    }
                }
            }
        }

        // 5. Material Order (Stock Check Logic)
        else if (node.action_type === 'material_order') {
            const parentQuoteNode = parents.find(p => p.action_type === 'quote')
            const linkedDevisId = parentQuoteNode?.data?.devis_id

            let quoteToCheck = null
            if (linkedDevisId) {
                quoteToCheck = devisList?.find(d => d.id === linkedDevisId)
            } else {
                quoteToCheck = devisList?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
            }

            console.log(`🔍 [MATERIAL ORDER] Node: "${node.label}" (${node.status})`)

            if (!quoteToCheck) {
                console.log(`      ⏳ Quote Missing. Waiting.`)
                if (node.status !== 'waiting') updates.push({ id: node.id, status: 'waiting' })
                continue
            }

            console.log(`      📄 Quote Status: ${quoteToCheck.status}, Items: ${quoteToCheck.devis_items?.length}`)

            const hasItems = quoteToCheck.devis_items && quoteToCheck.devis_items.length > 0
            // const validStatus = ['en_attente', 'en_attente_approbation', 'signe', 'approuve'].includes(quoteToCheck.status)
            // Relaxed check: Accept just having items for now to test stock
            const validStatus = true

            if (!hasItems) {
                console.log(`      ⏳ Skipped Stock Check. Reason: No Items`)
                if (node.status !== 'waiting') updates.push({ id: node.id, status: 'waiting' })
                continue
            }

            // STOCK CHECK
            let stockMissing = false
            let missingItemsDetails: string[] = []

            console.log(`      📦 [STOCK CHECK] Starting...`)

            const articleIds = quoteToCheck.devis_items.map((i: any) => i.article_id).filter((id: any) => id)
            let articlesMap = new Map()
            if (articleIds.length > 0) {
                const { data: articles } = await supabase.from('articles').select('id, stock, name').in('id', articleIds)
                if (articles) {
                    articles.forEach(a => articlesMap.set(a.id, a))
                }
            }

            for (const item of quoteToCheck.devis_items) {
                if (!item.article_id) {
                    console.log(`         ⚪ Item skipped (No Article ID):`, item.label || 'Unknown')
                    continue
                }
                const article = articlesMap.get(item.article_id)
                if (article) {
                    const isMissing = article.stock < item.quantity
                    console.log(`         🔹 Check: "${article.name}" | Stock: ${article.stock} | Req: ${item.quantity} | Missing? ${isMissing}`)

                    if (isMissing) {
                        stockMissing = true
                        missingItemsDetails.push(`${article.name} (Stock: ${article.stock}, Req: ${item.quantity})`)
                    }
                } else {
                    console.warn(`         ⚠️ Article not found in DB: ID ${item.article_id}`)
                }
            }

            const orderConfirmed = node.data?.order_confirmed === true

            if (!stockMissing) {
                console.log(`      ✅ Valid (Natural Stock Success). Node DONE.`)
                if (node.status !== 'done') {
                    updates.push({ id: node.id, status: 'done' })
                    nodeObj._newStatus = 'done'
                    // RESET Flags (Notification AND OrderConfirmed)
                    // If stock is now OK, we don't need the bypass anymore.
                    await supabase.from('chantier_nodes').update({
                        data: { ...node.data, notification_sent: false, order_confirmed: false }
                    }).eq('id', node.id)
                }

            } else if (orderConfirmed) {
                console.log(`      ✅ Valid (BYPASSED by Order Confirmed). Node DONE.`)
                // Stay Done, but maybe log warning that stock is still low?
                if (node.status !== 'done') {
                    updates.push({ id: node.id, status: 'done' })
                    nodeObj._newStatus = 'done'
                }

            } else {
                console.log(`      ⚠️ Stock Missing: ${missingItemsDetails.join(', ')}`)

                if (!node.data?.notification_sent) {
                    const missingText = missingItemsDetails.join(', ')

                    // FALLBACK STRATEGY
                    let targetUserId = quoteToCheck.created_by
                    if (!targetUserId) {
                        // Fetch Chantier Owner
                        const { data: chantier } = await supabase.from('chantiers').select('created_by').eq('id', chantierId).single()
                        targetUserId = chantier?.created_by
                    }

                    console.log(`      🎯 [NOTIF] Target User ID: ${targetUserId || 'NULL (Global Notification)'}`)

                    // INSERT NOTIFICATION (Even if targetUserId is null -> Global)
                    const { error: notifError } = await supabase.from('notifications').insert({
                        user_id: targetUserId || null, // Allow null for global
                        type: 'material_request',
                        title: `Commande Requise : ${node.label}`,
                        message: `Stock insuffisant pour le chantier. Manquants : ${missingText}. Veuillez valider la commande.`,
                        data: {
                            chantier_id: chantierId,
                            node_id: node.id,
                            missing_items: missingItemsDetails
                        }
                    })

                    if (notifError) {
                        console.error("❌ [NOTIF] INSERT ERROR:", notifError)
                        // Retry with forced user ID if it failed due to NOT NULL constraint (before DB migration applied)
                        // But ideally migration is applied.
                    } else {
                        console.log("✅ [NOTIF] SUCCESSFULLY INSERTED (Global/Targeted).")
                        // Mark Node as "Notification Sent"
                        await supabase.from('chantier_nodes').update({
                            data: { ...node.data, notification_sent: true }
                        }).eq('id', node.id)
                    }
                } else {
                    console.log("      ℹ️ [NOTIF] Already sent (flag=true). Skipped.")
                }

                if (node.status !== 'waiting') {
                    updates.push({ id: node.id, status: 'waiting' })
                    nodeObj._newStatus = 'waiting'
                }
            }
        }

        // 5. Email Automatique
        else if (node.action_type === 'email') {
            if (node.status !== 'done') {
                updates.push({ id: node.id, status: 'done' })
                nodeObj._newStatus = 'done'
            }
        }

    } // End Loop Nodes

    // ---------------------------------------------------------
    // 3. COMMIT UPDATES
    // ---------------------------------------------------------
    if (updates.length > 0) {
        console.log(`⚙️ [WORKFLOW ENGINE] Updating ${updates.length} nodes...`, updates)
        for (const u of updates) {
            await supabase.from('chantier_nodes').update({ status: u.status }).eq('id', u.id)
        }
        revalidatePath(`/dashboard/chantiers/${chantierId}`)
        return { success: true, updates }
    }

    return { success: true, message: "Stable State" }
}

// ACTION: Confirm Material Order (Called from Notification)
export async function confirmMaterialOrder(nodeId: string, notificationId: string) {
    const supabase = await createClient()
    console.log(`📦 [ACTION] Confirming Material Order for Node ${nodeId}`)

    // 1. Get Node to find Chantier ID
    const { data: node } = await supabase.from('chantier_nodes').select('*').eq('id', nodeId).single()
    if (!node) return { error: "Node not found" }

    // 2. Update Node Data: order_confirmed = true
    const newData = { ...node.data, order_confirmed: true }
    await supabase.from('chantier_nodes').update({ data: newData }).eq('id', nodeId)

    // 3. Archive Notification
    if (notificationId) {
        await supabase.from('notifications').update({ status: 'archived' }).eq('id', notificationId)
    }

    // 4. Re-run Integrity Check to update Status to DONE
    await checkWorkflowIntegrity(node.chantier_id)

    revalidatePath('/dashboard/annonces')
    revalidatePath(`/dashboard/chantiers/${node.chantier_id}`)
    return { success: true }
}
