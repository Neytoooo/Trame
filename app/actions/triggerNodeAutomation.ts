'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Initialize Admin Client (Bypasses RLS for System Notifications)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = supabaseServiceKey ? createSupabaseClient(supabaseUrl, supabaseServiceKey) : null

export async function triggerNodeAutomation(sourceNodeId: string, chantierId: string) {
    const supabase = await createClient()

    console.log(`🤖 Automation Triggered by Node: ${sourceNodeId} (Chantier: ${chantierId})`)

    // 1. Fetch Graph & Context
    const [nodesRes, edgesRes, chantierRes] = await Promise.all([
        supabase.from('chantier_nodes').select('*').eq('chantier_id', chantierId),
        supabase.from('chantier_edges').select('*').eq('chantier_id', chantierId),
        supabase.from('chantiers').select('*, clients(*), created_by').eq('id', chantierId).single()
    ])

    if (nodesRes.error || edgesRes.error || chantierRes.error) {
        console.error("DB Error:", nodesRes.error || edgesRes.error || chantierRes.error)
        return { success: false, message: "Erreur Base de Données" }
    }

    const nodes = nodesRes.data || []
    const edges = edgesRes.data || []
    const chantier = chantierRes.data

    // 2. Identify Next Steps (Successors)
    const nextEdges = edges.filter(e => e.source === sourceNodeId)
    const targetNodeIds = nextEdges.map(e => e.target)
    const targetNodes = nodes.filter(n => targetNodeIds.includes(n.id))

    if (targetNodes.length === 0) {
        return { success: true, message: "Fin de chaîne (Aucune étape suivante)" }
    }

    console.log(`➡️ Found ${targetNodes.length} successors to process: ${targetNodes.map(n => n.label).join(', ')}`)

    // 3. Process Each Successor
    // We wait a bit to simulate "Processing" distinct from the previous action
    await new Promise(resolve => setTimeout(resolve, 2000)) // 2s delay for "Animation" feel

    for (const node of targetNodes) {
        await processSingleNode(node, chantier, supabase, supabaseAdmin, nodes, edges)
    }

    return { success: true, message: "Automatisation exécutée" }
}

// ------------------------------------------------------------------
// Core Logic: Process a Single Node
// ------------------------------------------------------------------
async function processSingleNode(node: any, chantier: any, supabase: any, supabaseAdmin: any, allNodes: any[], allEdges: any[]) {
    console.log(`⚙️ Processing Step: ${node.label} [${node.action_type}]`)

    let status: 'done' | 'waiting' | 'error' = 'done' // Default assumption
    let logMessage = ""

    // --- SWITCH ACTION TYPE ---
    switch (node.action_type) {
        case 'email':
            const emailResult = await handleEmailAction(node, chantier, resend)
            if (!emailResult.success) {
                status = 'error'
                logMessage = `Erreur Email: ${emailResult.error}`
            } else {
                logMessage = `Email envoyé: ${emailResult.recipient}`
            }
            break

        case 'calendar':
            const calResult = await handleCalendarAction(node, chantier, resend)
            if (!calResult.success) {
                status = 'error'
                logMessage = `Erreur Calendrier: ${calResult.error}`
            } else {
                logMessage = `Invitation envoyée: ${calResult.recipient}`
            }
            break

        case 'material_order':
            // Checks stock. If OK -> Done. If Missing -> Waiting (with Notification).
            const stockResult = await handleMaterialOrder(node, chantier, supabase, supabaseAdmin)
            status = stockResult.status as 'done' | 'waiting' | 'error'
            logMessage = stockResult.message
            break

        case 'generate_quote':
        case 'create_quote':
        case 'devis':
            // MANUAL VALIDATION REQUIRED
            // We set it to 'waiting' so the user knows they must act.
            // We DO NOT recurse.
            status = 'waiting'
            logMessage = "En attente de création/validation du devis"
            break

        case 'payment':
        case 'facture':
            // MANUAL VALIDATION REQUIRED
            status = 'waiting'
            logMessage = "En attente de paiement/facturation"
            break

        default:
            // Generic steps (e.g. "Work in progress") might need manual validation
            // OR if it's just an info step, we auto-validate.
            // For safety, generic "Step" usually implies work -> Waiting.
            // Unless labeled "Auto". Let's assume 'waiting' for safety unless it's a known auto type.
            // But user said: "validation d'une étape peut être automatique... soit humaine".
            // If unknown, let's look at the label. If label contains "Auto", we pass.
            // Better: 'general' nodes are Manual by default in this system logic.
            status = 'waiting'
            logMessage = "En attente de validation manuelle"
            break
    }

    // --- UPDATE DB & RECURSE ---
    console.log(`   Result: ${status} | ${logMessage}`)

    // 1. Update Node Status
    await supabase.from('chantier_nodes').update({
        status: status,
        // Optionally store the log message in data
    }).eq('id', node.id)

    // 2. Log History
    if (logMessage) {
        // (Optional: Insert into chantier_logs if table exists, skipping for now to keep it simple)
    }

    // 3. RECURSION (If Done)
    // "Une fois validé... il laisse s'executer les autres etapes"
    if (status === 'done') {
        console.log(`   ✅ Step ${node.label} VALIDATED. Triggering successors...`)

        // Find NEW successors for THIS node and trigger them
        const nextEdges = allEdges.filter(e => e.source === node.id)
        const nextNodeIds = nextEdges.map(e => e.target)
        const nextNodes = allNodes.filter(n => nextNodeIds.includes(n.id))

        if (nextNodes.length > 0) {
            // Wait slightly before chaining
            await new Promise(resolve => setTimeout(resolve, 1000))
            for (const nextNode of nextNodes) {
                await processSingleNode(nextNode, chantier, supabase, supabaseAdmin, allNodes, allEdges)
            }
        }
    } else {
        console.log(`   ⏸️ Step ${node.label} is ${status.toUpperCase()}. Automation Paused here.`)
    }
}

// ------------------------------------------------------------------
// Action Handlers
// ------------------------------------------------------------------

async function handleEmailAction(node: any, chantier: any, resendInstance: Resend) {
    const nodeData = node.data || {}
    const recipientEmail = nodeData.custom_email || chantier.clients?.email || chantier.email_contact
    const emailSubject = nodeData.custom_subject || `Avancement : ${chantier.name}`

    if (!recipientEmail) return { success: false, error: "Email destinataire manquant" }

    const { error } = await resendInstance.emails.send({
        from: 'Trame <onboarding@resend.dev>',
        to: [recipientEmail],
        subject: emailSubject,
        html: `<h1>Nouvelle étape : ${node.label}</h1><p>Le chantier avance !</p>`,
    })

    return { success: !error, error: error?.message, recipient: recipientEmail }
}

async function handleCalendarAction(node: any, chantier: any, resendInstance: Resend) {
    const nodeData = node.data || {}
    const clientEmail = chantier.clients?.email || chantier.email_contact
    if (!clientEmail) return { success: false, error: "Email client manquant" }

    const title = nodeData.event_title || `RDV Chantier`
    const description = "Point d'avancement automatique."
    const location = "Sur place"

    // Simple Email for now (ICS logic omitted for brevity in cleanup, can re-add if needed but keeping it clean)
    const { error } = await resendInstance.emails.send({
        from: 'Trame <onboarding@resend.dev>',
        to: [clientEmail],
        subject: `Invitation : ${title}`,
        html: `<p>Vous êtes invité à : <strong>${title}</strong></p><p>${description}</p>`,
    })

    return { success: !error, error: error?.message, recipient: clientEmail }
}

async function handleMaterialOrder(node: any, chantier: any, supabase: any, supabaseAdmin: any) {
    console.log("   📦 Checking Stock for Material Order...")

    // 1. Get Latest Quote (regardless of status, except maybe deleted?)
    const { data: quotes } = await supabase
        .from('devis')
        .select('*, devis_items(*, articles(id, name, stock, unit))')
        .eq('chantier_id', chantier.id)
        // .neq('status', 'brouillon') // <--- REMOVED: We want to check stock even on the latest draft
        .order('created_at', { ascending: false })
        .limit(1)

    const quote = quotes?.[0]
    if (!quote) {
        console.log("   ⚠️ No quote found for this chantier. Skipping stock check.")
        return { status: 'done', message: "Aucun devis trouvé. Passage auto." }
    }

    console.log(`   📦 Quote found: ID=${quote.id} | Ref=${quote.reference} | Status=${quote.status} | Items=${quote.devis_items?.length}`)

    let missingItems: any[] = []

    for (const item of (quote.devis_items || [])) {
        console.log(`      - Item: ${item.description} | ArticleID: ${item.article_id}`)

        if (item.articles) {
            const current = item.articles.stock || 0
            const required = item.quantity || 0
            console.log(`        Stats: Stock=${current} | Required=${required} | Missing=${current < required}`)

            if (current < required) {
                missingItems.push({
                    article: item.articles,
                    missing: required - current
                })
            }
        } else {
            console.log(`        ⚠️ No linked article found (or RLS hidden)`)
        }
    }

    if (missingItems.length === 0) {
        console.log("   ✅ All items have sufficient stock.")
        return { status: 'done', message: "Stock suffisant. Commande validée auto." }
    }

    // MISSING ITEMS -> BLOCK & NOTIFY
    console.log(`   ⚠️ Stock Insufficient (${missingItems.length} items).`)

    const clientToUse = supabaseAdmin || supabase
    const targetUserId = chantier.created_by

    for (const m of missingItems) {
        await clientToUse.from('notifications').insert({
            user_id: targetUserId,
            type: 'order_confirmation',
            title: `Rupture de Stock : ${m.article.name}`,
            message: `Manque ${m.missing} ${m.article.unit} pour le chantier ${chantier.name}.`,
            status: 'unread',
            data: { chantierId: chantier.id, articleId: m.article.id, quantity: m.missing }
        })
    }

    return {
        status: 'waiting',
        message: "Stock insuffisant. En attente de validation dans Annonces."
    }
}
