'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendFactureEmail(facture: any, email: string, pdfBase64?: string) {
    if (!process.env.RESEND_API_KEY) {
        console.log("⚠️ Simulation d'envoi d'email (Pas de clé API RESEND_API_KEY)")
        console.log(`À: ${email}`)
        console.log(`Sujet: Facture ${facture.reference}`)
        if (pdfBase64) console.log(`[Pièce jointe PDF incluse: ${Math.round(pdfBase64.length / 1024)} KB]`)
        return { success: true, simulated: true }
    }

    try {
        const attachments = pdfBase64 ? [{
            content: Buffer.from(pdfBase64.split(',')[1] || pdfBase64, 'base64'),
            filename: `Facture-${facture.reference}.pdf`
        }] : []

        const { data, error } = await resend.emails.send({
            from: 'Trame <onboarding@resend.dev>', // Changer par ton domaine vérifié plus tard
            to: [email],
            subject: `Votre facture ${facture.reference} est disponible`,
            html: `
                <h1>Bonjour,</h1>
                <p>Veuillez trouver ci-joint votre facture <strong>${facture.reference}</strong> datée du ${new Date(facture.date_emission).toLocaleDateString()}.</p>
                
                <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 18px;"><strong>Montant à régler : ${facture.total_ttc?.toFixed(2)} €</strong></p>
                    <p style="margin: 5px 0 0 0; color: #666;">Date d'échéance : ${facture.date_echeance ? new Date(facture.date_echeance).toLocaleDateString() : 'À réception'}</p>
                </div>

                <p>Merci de votre confiance.</p>
                <p>Cordialement,<br/>L'équipe Trame</p>
            `,
            attachments
        })

        if (error) {
            console.error(error)
            return { error: error.message }
        }

        return { success: true, data }
    } catch (error) {
        console.error(error)
        return { error: "Erreur serveur lors de l'envoi" }
    }
}
