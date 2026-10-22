import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * CRON / WEBHOOK : SCANNER DE RELANCE DEVIS POST-RDV
 * Règle de déclenchement :
 * - RDV client préalable au statut 'effectué' / 'validé'
 * - Aucun devis lié au RDV ni créé sur le chantier depuis la date du RDV
 * - Délai paramétré dépassé (ex: 24h, 48h)
 * - Relance non encore envoyée (relance_active = true et relance_sent_at IS NULL)
 */
export async function GET(req: Request) {
    // 1. Sécurité : Vérification du CRON_SECRET si configuré
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Non autorisé', { status: 401 })
    }

    const supabase = await createClient()

    try {
        // 2. Exécution du scanner via la fonction RPC SQL
        const { data: overdueList, error } = await supabase.rpc('check_rdv_pending_devis_relances')

        if (error) {
            // Fallback applicatif si la fonction RPC n'a pas encore été migrée sur Supabase
            console.warn("RPC check_rdv_pending_devis_relances non trouvée, exécution du fallback JavaScript:", error.message)
            return await runFallbackScanner(supabase)
        }

        // 3. Envoi des emails d'alerte aux commerciaux / artisans
        let emailsSent = 0
        if (overdueList && overdueList.length > 0) {
            for (const item of overdueList) {
                if (!item.user_id) continue

                // Récupération de l'email du collaborateur assigné
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email, full_name')
                    .eq('id', item.user_id)
                    .single()

                const targetEmail = profile?.email
                if (targetEmail && process.env.RESEND_API_KEY) {
                    try {
                        await resend.emails.send({
                            from: 'Trame Alertes <alertes@trame-btp.fr>',
                            to: [targetEmail],
                            subject: `⚠️ Relance : Devis à établir suite à votre RDV avec ${item.client_name}`,
                            html: `
                                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                    <h2 style="color: #0F172A;">Rappel de rédaction de devis BTP</h2>
                                    <p>Bonjour ${profile.full_name || ''},</p>
                                    <p>Votre rendez-vous client avec <strong>${item.client_name}</strong> a été validé il y a plus de <strong>${item.delay_hours}h</strong>.</p>
                                    <div style="background-color: #F8FAFC; border-left: 4px solid #4F46E5; padding: 12px 16px; margin: 16px 0;">
                                        <p style="margin: 0; font-size: 14px; color: #334155;">
                                            Aucun devis n'a encore été créé ou associé à cette intervention.<br/>
                                            Pour maintenir un taux de transformation optimal, pensez à transmettre votre proposition commerciale sans tarder.
                                        </p>
                                    </div>
                                    <p style="margin-top: 24px;">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/chantiers/${item.chantier_id}" 
                                           style="background-color: #4F46E5; color: white; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                                            Créer le devis du chantier
                                        </a>
                                    </p>
                                    <p style="font-size: 12px; color: #94A3B8; margin-top: 30px;">
                                        Cette notification s'éteindra automatiquement dès qu'un brouillon de devis aura été initié.
                                    </p>
                                </div>
                            `
                        })
                        emailsSent++
                    } catch (emailErr) {
                        console.error("Erreur envoi email relance devis:", emailErr)
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            overdueRdvCount: overdueList?.length || 0,
            emailsSent
        })

    } catch (err: any) {
        console.error("Erreur générale scanner relance devis:", err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

/**
 * Scanner de secours JS (si la migration SQL n'est pas encore appliquée)
 */
async function runFallbackScanner(supabase: any) {
    const { data: settings } = await supabase.from('company_settings').select('delai_relance_devis_heures').maybeSingle()
    const delayHours = settings?.delai_relance_devis_heures || 48
    const cutoffDate = new Date(Date.now() - delayHours * 3600 * 1000).toISOString()

    const { data: rdvList, error: rdvError } = await supabase
        .from('rendez_vous')
        .select(`
            id,
            user_id,
            chantier_id,
            date_end,
            clients ( id, name )
        `)
        .eq('status', 'effectue')
        .is('devis_id', null)
        .eq('relance_active', true)
        .is('relance_sent_at', null)
        .lte('date_end', cutoffDate)

    if (rdvError || !rdvList || rdvList.length === 0) {
        return NextResponse.json({ success: true, overdueRdvCount: 0, fallback: true })
    }

    // Traitement et notifications
    let count = 0
    for (const rdv of rdvList) {
        // Vérifier si un devis existe déjà sur le chantier
        const { data: existingDevis } = await supabase
            .from('devis')
            .select('id')
            .eq('chantier_id', rdv.chantier_id)
            .limit(1)

        if (existingDevis && existingDevis.length > 0) {
            // Lier le devis existant
            await supabase
                .from('rendez_vous')
                .update({ devis_id: existingDevis[0].id, relance_active: false })
                .eq('id', rdv.id)
            continue
        }

        // Insérer notification
        if (rdv.user_id) {
            const clientName = (rdv.clients as any)?.name || 'Client'
            await supabase.from('notifications').insert({
                user_id: rdv.user_id,
                type: 'relance_devis_post_rdv',
                title: 'Devis à rédiger suite au RDV',
                message: `Le RDV avec ${clientName} a été validé. Pensez à créer et transmettre le devis.`,
                status: 'unread',
                data: { rdv_id: rdv.id, chantier_id: rdv.chantier_id, client_name: clientName }
            })

            await supabase
                .from('rendez_vous')
                .update({ relance_sent_at: new Date().toISOString() })
                .eq('id', rdv.id)

            count++
        }
    }

    return NextResponse.json({ success: true, overdueRdvCount: count, fallback: true })
}
