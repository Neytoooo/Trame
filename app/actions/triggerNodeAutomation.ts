'use server'

import { createClient } from '@/utils/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function triggerNodeAutomation(sourceNodeId: string, chantierId: string) {
    const supabase = await createClient()

    try {
        console.log(`🤖 Triggering automation for Node ${sourceNodeId} (Chantier: ${chantierId})`)

        // 1. Fetch Graph Data & Chantier Info
        const [nodesRes, edgesRes, chantierRes] = await Promise.all([
            supabase.from('chantier_nodes').select('*').eq('chantier_id', chantierId),
            supabase.from('chantier_edges').select('*').eq('chantier_id', chantierId),
            supabase.from('chantiers').select('*, clients(*)').eq('id', chantierId).single()
        ])

        if (nodesRes.error || edgesRes.error || chantierRes.error) {
            console.error("DB Error:", nodesRes.error || edgesRes.error || chantierRes.error)
            return { success: false, message: "Erreur DB" }
        }

        const nodes = nodesRes.data || []
        const edges = edgesRes.data || []
        const chantier = chantierRes.data

        // 2. Find Successor Nodes
        // Find edges where source is the validated node
        const connectedEdges = edges.filter(e => e.source === sourceNodeId)
        const targetNodeIds = connectedEdges.map(e => e.target)
        const targetNodes = nodes.filter(n => targetNodeIds.includes(n.id))

        if (targetNodes.length === 0) {
            console.log("No connected nodes found.")
            return { success: true, message: "Aucune suite" }
        }

        let totalMessages: string[] = []

        // Recursive Function to process chain
        const processNode = async (node: any): Promise<boolean> => {
            console.log(`Processing Node ${node.id} (${node.action_type})`)
            let actionDone = false
            let message = ""

            // EMAIL ACTION
            if (node.action_type === 'email') {
                // Priority: Node Custom Email > Client Email > Contact Email
                const nodeData = node.data || {}
                const recipientEmail = nodeData.custom_email || chantier.clients?.email || chantier.email_contact
                const emailSubject = nodeData.custom_subject || `Avancement de votre chantier : ${chantier.name}`

                if (recipientEmail) {
                    const { error: emailError } = await resend.emails.send({
                        from: 'Trame <onboarding@resend.dev>',
                        to: [recipientEmail],
                        subject: emailSubject,
                        html: `
                            <h1>Nouvelle étape validée !</h1>
                            <p>Le chantier <strong>${chantier.name}</strong> avance.</p>
                            <p>Nous passons maintenant à l'étape : <strong>${node.label}</strong>.</p>
                            <br/>
                            <p>Cordialement,<br/>L'équipe Trame</p>
                        `,
                    })

                    if (!emailError) {
                        actionDone = true
                        message = `Email envoyé à ${recipientEmail}`
                    } else {
                        console.error("Email Error:", emailError)
                        message = "Erreur envoi email"
                    }
                } else {
                    message = "Email introuvable"
                }
            }

            // CALENDAR ACTION
            if (node.action_type === 'calendar') {
                const nodeData = node.data || {}
                console.log(`📅 Processing Calendar Node ${node.id}:`, JSON.stringify(nodeData, null, 2))

                const title = nodeData.event_title || `RDV Chantier : ${chantier.name}`
                const description = nodeData.event_description || "Point d'avancement."
                const location = nodeData.event_location || "Sur place"
                const date = nodeData.event_date // YYYY-MM-DD
                const time = nodeData.event_time || "10:00" // HH:MM

                const clientEmail = chantier.clients?.email || chantier.email_contact

                if (clientEmail && date) {
                    const startDateTime = `${date.replace(/-/g, '')}T${time.replace(/:/g, '')}00`
                    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Trame//App//EN
BEGIN:VEVENT
UID:${Date.now()}@trame.app
DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '')}
DTSTART:${startDateTime}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
DURATION:PT1H
END:VEVENT
END:VCALENDAR`

                    const gCalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}&dates=${startDateTime}/${startDateTime}`

                    const { error: calError } = await resend.emails.send({
                        from: 'Trame <onboarding@resend.dev>',
                        to: [clientEmail],
                        subject: `Invitation : ${title}`,
                        html: `<h1>Invitation Rendez-vous</h1><p><strong>${title}</strong></p><p>📅 ${date} à ${time}</p><p>📍 ${location}</p><p>${description}</p><br/><p><a href="${gCalLink}">Ajouter à Google Agenda</a></p>`,
                        attachments: [{ filename: 'invitation.ics', content: icsContent }],
                    })

                    if (!calError) {
                        actionDone = true
                        message = `Invitation envoyée à ${clientEmail}`
                    } else {
                        console.error("Calendar Error:", calError)
                        message = "Erreur invitation"
                    }
                } else {
                    message = !date ? "⚠️ Date manquante pour le RDV" : "⚠️ Email client introuvable"
                }
            }

            // MATERIAL ORDER ACTION
            if (node.action_type === 'material_order') {
                console.log("📦 Processing Material Order...")

                // 1. Find the Relevant Quote (Not Draft)
                const { data: quotes } = await supabase
                    .from('devis')
                    .select('*, devis_items(*, articles(id, name, stock))')
                    .eq('chantier_id', chantierId)
                    .neq('status', 'brouillon')
                    .order('created_at', { ascending: false }) // Get latest
                    .limit(1)

                const quote = quotes?.[0]

                if (quote && quote.devis_items && quote.devis_items.length > 0) {
                    let orderReport: string[] = []

                    for (const item of quote.devis_items) {
                        if (item.article_id && item.articles) {
                            const currentStock = item.articles.stock || 0
                            const requiredQty = item.quantity

                            if (currentStock < requiredQty) {
                                const missing = requiredQty - currentStock
                                // Simulate Order & Refill
                                const newStock = currentStock + missing // Or just set to requiredQty? "Ajouter au stock" implies adding. 
                                // Actually, if I have 5, need 10. Missing 5. I order 5. New stock = 10? 
                                // Then I use them for the project. 
                                // Usually we reserve them. 
                                // User said: "aller commander et ajouter au stock".
                                // So let's add the missing amount to the stock so it becomes sufficient.
                                const targetStock = currentStock + missing

                                await supabase
                                    .from('articles')
                                    .update({ stock: targetStock })
                                    .eq('id', item.article_id)

                                orderReport.push(`Commandé ${missing}x ${item.articles.name}`)
                            }
                        }
                    }

                    if (orderReport.length > 0) {
                        message = `Commande auto : ${orderReport.join(', ')}`
                        actionDone = true
                    } else {
                        message = "Stock suffisant (Toutes les fournitures sont disponibles)"
                        actionDone = true
                    }
                } else {
                    message = "Aucun devis validé pour vérifier le stock."
                    actionDone = true // We validate the step even if nothing happens, to not block the flow? Or maybe false? 
                    // User flow implies this step handles ordering. If nothing to order, it's done.
                }
            }


            if (actionDone) {
                totalMessages.push(message)
                // Mark as Done
                await supabase.from('chantier_nodes').update({ status: 'done' }).eq('id', node.id)

                // RECURSION: Trigger successors of THIS node
                const nextEdges = edges.filter(e => e.source === node.id)
                const nextNodeIds = nextEdges.map(e => e.target)
                const nextNodes = nodes.filter(n => nextNodeIds.includes(n.id))

                if (nextNodes.length > 0) {
                    console.log(`⏳ Waiting 5s before triggering ${nextNodes.length} successor(s)...`)
                    await new Promise(resolve => setTimeout(resolve, 5000))

                    for (const nextNode of nextNodes) {
                        // Only process logic/action nodes, avoid infinite loops if cycle (simple check: validation moves forward)
                        // Currently we assume actions always move forward.
                        await processNode(nextNode)
                    }
                }
            } else if (message) {
                totalMessages.push(message)
            }

            return actionDone
        }

        // Initial Call - Wait 5s before starting the chain for "Mise en place" -> "Email"
        if (targetNodes.length > 0) {
            console.log(`⏳ Initial Delay: Waiting 5s before starting automation...`)
            await new Promise(resolve => setTimeout(resolve, 5000))

            for (const node of targetNodes) {
                await processNode(node)
            }
        }

        if (totalMessages.length > 0) {
            return { success: true, message: `Automatisation : ${totalMessages.join(', ')}` }
        }

        return { success: true, message: "Fin de chaîne." }

    } catch (error) {
        console.error("Automation Error:", error)
        return { success: false, message: "Erreur interne" }
    }
}
