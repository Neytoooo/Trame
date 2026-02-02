import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generateFacturePDF = (facture: any, companySettings: any = null, returnBase64 = false) => {
    const doc = new jsPDF()

    // --- EN-TÊTE ---
    doc.setFontSize(20)
    doc.text(`FACTURE ${facture.reference || ''}`, 14, 22)

    doc.setFontSize(10)
    doc.setTextColor(100)
    const date = new Date(facture.date_emission).toLocaleDateString('fr-FR')
    doc.text(`Date : ${date}`, 14, 30)

    // Status
    const status = facture.status === 'payee' ? 'PAYÉE' : (facture.status === 'retard' ? 'EN RETARD' : 'EN ATTENTE')
    doc.text(`Statut : ${status}`, 14, 35)

    // --- INFO ENTREPRISE (Gauche) ---
    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.setTextColor(0)
    if (companySettings) {
        // Logo Handling
        if (companySettings.logo_url) {
            try {
                // Fetch image (as base64 or addImage supports url in some environments, but in Node/Browser consistency matters)
                // Actually jspdf addImage supports URL if CORS allows. 
                // Let's assume URL works or we need to fetch it.
                // Best robust way: addImage with URL (async?) -> actually generateFacturePDF is synchronous-like usually but we might need async for image fetching.
                // Wait, generateFacturePDF is currently synchronous in signature.
                // We should make it async or use a pre-fetched base64.
                // For now, let's try strict addImage with URL and see. If it fails due to CORS/Auth, we might need a change.
                // BUT: standard jspdf in browser can load img.
                // Let's constrain the logo size.
                doc.addImage(companySettings.logo_url, 'PNG', 14, 40, 20, 20) // x, y, w, h

                // Shift text down ? No, let's put it next to it or replace name?
                // Plan: Logo Top-Left. Name below or next.
                // Current Layout: Name at Y=50.
                // Let's move company text to Y=65 if logo exists, or keep logo at Y=40..60 and text at X=40?
                // Let's put text to the right of logo.
                doc.text(companySettings.name || 'Mon Entreprise', 40, 50)
                doc.setFontSize(9)
                doc.setTextColor(100)
                doc.text(companySettings.address || '', 40, 55)
                doc.text(`Tél: ${companySettings.phone || ''}`, 40, 63)
                doc.text(`Email: ${companySettings.email || ''}`, 40, 67)
                doc.text(`SIRET: ${companySettings.siret || ''}`, 40, 71)
            } catch (e) {
                // Fallback if logo fails
                console.error("Logo Error", e)
                doc.text(companySettings.name || 'Mon Entreprise', 14, 50)
                // ... same as before
            }
        } else {
            doc.text(companySettings.name || 'Mon Entreprise', 14, 50)
            doc.setFontSize(9)
            doc.setTextColor(100)
            doc.text(companySettings.address || '', 14, 55)
            doc.text(`Tél: ${companySettings.phone || ''}`, 14, 63)
            doc.text(`Email: ${companySettings.email || ''}`, 14, 67)
            doc.text(`SIRET: ${companySettings.siret || ''}`, 14, 71)
        }
    } else {
        doc.text('Mon Entreprise', 14, 50)
        doc.setFontSize(9)
        doc.setTextColor(100)
        doc.text('Configurez vos infos dans Paramètres', 14, 55)
    }

    // --- INFO CLIENT (Droite) ---
    const client = facture.chantiers?.clients
    if (client) {
        doc.setFontSize(10)
        doc.setTextColor(0)
        doc.text(client.name || 'Client', 140, 50)
        doc.setFontSize(9)
        doc.setTextColor(100)
        doc.text(client.address_line1 || '', 140, 55)
        doc.text(`${client.zip_code || ''} ${client.city || ''}`, 140, 59)
        doc.text(client.email || '', 140, 63)
    }

    // --- TABLEAU DES ARTICLES ---
    const columns = ["Description", "Qté", "Unité", "PU HT", "TVA", "Total HT"]
    const rows = facture.factures_items?.map((item: any) => [
        item.description,
        item.quantity,
        item.unit,
        `${item.unit_price} €`,
        `${item.tva}%`,
        `${(item.quantity * item.unit_price).toFixed(2)} €`
    ]) || []

    // @ts-ignore
    autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 80,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
    })

    // --- TOTAUX (CALCUL FALLBACK SI MANQUANT) ---
    let totalHT = facture.total_ht
    let totalTTC = facture.total_ttc

    if (!totalHT || !totalTTC) {
        // Recalcul simple si la BDD est vide
        totalHT = facture.factures_items?.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0) || 0
        const tvaCalc = facture.factures_items?.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price * ((item.tva || 20) / 100)), 0) || 0
        totalTTC = totalHT + tvaCalc
    }

    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10

    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text(`Total HT :`, 130, finalY)
    doc.text(`${(totalHT || 0).toFixed(2)} €`, 190, finalY, { align: 'right' })

    doc.text(`TVA :`, 130, finalY + 6)
    const tvaAmount = (totalTTC || 0) - (totalHT || 0)
    doc.text(`${tvaAmount.toFixed(2)} €`, 190, finalY + 6, { align: 'right' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Net à payer :`, 130, finalY + 14)
    doc.text(`${(totalTTC || 0).toFixed(2)} €`, 190, finalY + 14, { align: 'right' })

    // Pied de page
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150)
    const footer = companySettings?.footer_text || "En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée."
    const splitFooter = doc.splitTextToSize(footer, 180)
    doc.text(splitFooter, 105, 280, { align: 'center' })

    // Retour Base64 ou Téléchargement
    if (returnBase64) {
        return doc.output('datauristring')
    } else {
        doc.save(`Facture-${facture.reference}.pdf`)
    }
}
