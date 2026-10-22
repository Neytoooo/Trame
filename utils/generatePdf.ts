import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DevisPdfColumnConfig, DEFAULT_PDF_PRESETS } from '@/types/pdfExport'

/**
 * Format currency helper - Utilise un espace ASCII standard (32)
 * pour éviter les incompatibilités de polices WinAnsi de jsPDF
 * qui transforment le narrow no-break space (\u202F) en slash '/'
 * ou provoquent des retours à la ligne intempestifs.
 */
const fmtCur = (val: number | string | undefined | null) => {
    const num = Number(val) || 0
    const parts = num.toFixed(2).split('.')
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return `${intPart},${parts[1]} €`
}

/**
 * Format date helper
 */
const fmtDate = (d?: string | Date) => {
    if (!d) return '-'
    try {
        return new Date(d).toLocaleDateString('fr-FR')
    } catch {
        return String(d)
    }
}

/**
 * GENERATE FACTURE PDF
 * Conforme aux standards professionnels BTP :
 * - Prise en charge automatique des chapitres/sections (lignes de titre)
 * - Support des factures de situation (Avancement %) et d'acompte
 * - Blocs distincts Chantier & Client Facturé
 * - Récapitulatif ventilé de la TVA (10%, 20%, 5.5%)
 * - Chargement automatique défensif des items depuis Supabase si non préchargés
 */
export const generateFacturePDF = async (
    factureInput: any,
    companySettingsInput: any = null,
    returnBase64 = false
) => {
    const doc = new jsPDF()
    const facture = { ...factureInput }

    // 1. Récupération défensive des lignes si absentes ou incomplètes
    if (!facture.factures_items || facture.factures_items.length === 0) {
        try {
            const { createClient } = await import('@/utils/supabase/client')
            const supabase = createClient()
            const { data: dbItems } = await supabase
                .from('factures_items')
                .select('*')
                .eq('facture_id', facture.id)
                .order('created_at', { ascending: true })

            if (dbItems && dbItems.length > 0) {
                facture.factures_items = dbItems
            }
        } catch (err) {
            console.warn("Impossible de récupérer les lignes depuis Supabase:", err)
        }
    }

    // 1b. Récupération défensive des infos entreprise
    let company = companySettingsInput
    if (!company) {
        try {
            const { createClient } = await import('@/utils/supabase/client')
            const supabase = createClient()
            const { data: dbCompany } = await supabase.from('company_settings').select('*').maybeSingle()
            if (dbCompany) company = dbCompany
        } catch {
            // fallback
        }
    }

    // Palette de couleurs BTP
    const primaryNavy = [15, 23, 42] as [number, number, number]     // #0F172A
    const slateDark = [30, 41, 59] as [number, number, number]       // #1E293B
    const slateMuted = [100, 116, 139] as [number, number, number]   // #64748B
    const bgLight = [248, 250, 252] as [number, number, number]      // #F8FAFC
    const borderCard = [226, 232, 240] as [number, number, number]   // #E2E8F0

    // Détermination du type de facture
    const isSituation = facture.type === 'situation'
    const isAcompte = facture.type === 'acompte'
    const docTitle = isSituation
        ? `SITUATION DE TRAVAUX N° ${facture.situation_index || 1}`
        : isAcompte
        ? `FACTURE D'ACOMPTE`
        : `FACTURE`

    // --- 1. EN-TÊTE PRINCIPAL (Entreprise à gauche, Facture info à droite) ---
    // A. Bloc Entreprise (Gauche)
    let leftY = 18
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...primaryNavy)
    doc.text(company?.name || 'ENTREPRISE BTP & RÉNOVATION', 14, leftY)

    leftY += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...slateMuted)

    if (company?.address) {
        doc.text(company.address, 14, leftY)
        leftY += 4
    }
    const phoneEmail = [
        company?.phone ? `Tél : ${company.phone}` : null,
        company?.email ? `Email : ${company.email}` : null
    ].filter(Boolean).join('  |  ')
    if (phoneEmail) {
        doc.text(phoneEmail, 14, leftY)
        leftY += 4
    }
    const legalIds = [
        company?.siret ? `SIRET : ${company.siret}` : null,
        company?.tva_number ? `TVA Intracom : ${company.tva_number}` : null
    ].filter(Boolean).join('  |  ')
    if (legalIds) {
        doc.text(legalIds, 14, leftY)
        leftY += 4
    }

    // B. Bloc Facture Titre & Références (Droite)
    const rightX = 120
    let rightY = 18

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(...primaryNavy)
    doc.text(docTitle, rightX, rightY)

    rightY += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...slateDark)
    doc.text(`N° ${facture.reference || 'PROVISOIRE'}`, rightX, rightY)

    rightY += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...slateMuted)
    doc.text(`Date d'émission : ${fmtDate(facture.date_emission || facture.created_at)}`, rightX, rightY)

    rightY += 4.5
    doc.text(`Date d'échéance : ${fmtDate(facture.date_echeance) || 'À réception'}`, rightX, rightY)

    rightY += 4.5
    const statusText = facture.status === 'payee' ? 'RÉGLÉE / PAYÉE' : (facture.status === 'retard' ? 'EN RETARD DE PAIEMENT' : 'EN ATTENTE DE RÈGLEMENT')
    doc.setFont('helvetica', 'bold')
    if (facture.status === 'payee') {
        doc.setTextColor(16, 149, 93) // Emerald
    } else if (facture.status === 'retard') {
        doc.setTextColor(225, 29, 72) // Rose/Red
    } else {
        doc.setTextColor(217, 119, 6) // Amber
    }
    doc.text(`Statut : ${statusText}`, rightX, rightY)

    // --- 2. ENCADRÉS CHANTIER & CLIENT FACTURÉ ---
    const boxY = Math.max(leftY, rightY) + 7
    const boxHeight = 28
    const boxWidth = 88

    // A. Cadre Chantier (Gauche)
    doc.setFillColor(...bgLight)
    doc.setDrawColor(...borderCard)
    doc.roundedRect(14, boxY, boxWidth, boxHeight, 3, 3, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...slateMuted)
    doc.text("CHANTIER & LIEU D'INTERVENTION", 18, boxY + 6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...primaryNavy)
    const chantierName = facture.chantiers?.name || 'Chantier Rénovation BTP'
    const splitChantier = doc.splitTextToSize(chantierName, boxWidth - 8)
    doc.text(splitChantier, 18, boxY + 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...slateMuted)
    doc.text("Suivi et facturation des prestations contractuelles", 18, boxY + 22)

    // B. Cadre Client Facturé (Droite)
    const clientX = 108
    doc.setFillColor(...bgLight)
    doc.setDrawColor(...borderCard)
    doc.roundedRect(clientX, boxY, boxWidth, boxHeight, 3, 3, 'FD')

    const client = facture.chantiers?.clients
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...slateMuted)
    doc.text("CLIENT FACTURÉ / MAÎTRE D'OUVRAGE", clientX + 4, boxY + 6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...primaryNavy)
    doc.text(client?.name || 'Client BTP', clientX + 4, boxY + 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...slateMuted)
    let clientSubY = boxY + 17
    if (client?.address_line1) {
        doc.text(client.address_line1, clientX + 4, clientSubY)
        clientSubY += 4
    }
    const clientCity = `${client?.zip_code || ''} ${client?.city || ''}`.trim()
    if (clientCity) {
        doc.text(clientCity, clientX + 4, clientSubY)
    }

    // --- 3. TABLEAU DES PRESTATIONS DU DEVIS / FACTURE ---
    const tableStartY = boxY + boxHeight + 8

    const tableColumns = isSituation
        ? ["Désignation des prestations", "Qté", "Unité", "PU HT", "Avanc.", "TVA", "Montant HT"]
        : ["Désignation des prestations", "Qté", "Unité", "PU HT", "TVA", "Montant HT"]

    const rawItems = facture.factures_items || []

    const tableRows = rawItems.map((item: any) => {
        const desc = (item.description || '').trim()
        const isSection = (item.unit_price === 0 && (!item.unit || item.unit === '')) ||
            item.item_type === 'section' ||
            /^[0-9]+\.\s+[A-ZÀ-Ÿ\s&]+$/.test(desc)

        // Ligne de chapitre / titre (pleine largeur)
        if (isSection) {
            return [{
                content: desc.toUpperCase(),
                colSpan: isSituation ? 7 : 6,
                styles: {
                    fontStyle: 'bold',
                    fillColor: [241, 245, 249], // #F1F5F9
                    textColor: [15, 23, 42],
                    fontSize: 8.5,
                    cellPadding: { top: 4, bottom: 4, left: 6, right: 6 }
                }
            }]
        }

        // Ligne de prestation chiffrée
        const progress = isSituation ? (item.progress_percentage ?? 100) : 100
        const lineHT = (item.quantity * item.unit_price) * (progress / 100)

        if (isSituation) {
            return [
                desc,
                item.quantity ? String(item.quantity) : '1',
                item.unit || 'u',
                fmtCur(item.unit_price),
                `${progress}%`,
                `${item.tva || 10}%`,
                fmtCur(lineHT)
            ]
        }

        return [
            desc,
            item.quantity ? String(item.quantity) : '1',
            item.unit || 'u',
            fmtCur(item.unit_price),
            `${item.tva || 10}%`,
            fmtCur(lineHT)
        ]
    })

    // AutoTable avec style professionnel BTP
    autoTable(doc, {
        head: [tableColumns],
        body: tableRows.length > 0 ? tableRows : [
            [{ content: "Aucune ligne de prestation enregistrée", colSpan: isSituation ? 7 : 6, styles: { halign: 'center', fontStyle: 'italic', textColor: [150, 150, 150] } }]
        ],
        startY: tableStartY,
        theme: 'grid',
        headStyles: {
            fillColor: [30, 41, 59], // Slate-800
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8.5,
            cellPadding: { top: 3, bottom: 3, left: 2, right: 2 }
        },
        styles: {
            fontSize: 8,
            cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 },
            textColor: [30, 41, 59],
            lineColor: [226, 232, 240],
            lineWidth: 0.1,
            valign: 'middle'
        },
        alternateRowStyles: {
            fillColor: [250, 250, 252]
        },
        columnStyles: isSituation ? {
            0: { cellWidth: 'auto' },
            1: { halign: 'center', cellWidth: 14 },
            2: { halign: 'center', cellWidth: 15 },
            3: { halign: 'right', cellWidth: 26 },
            4: { halign: 'center', cellWidth: 16 },
            5: { halign: 'right', cellWidth: 14 },
            6: { halign: 'right', cellWidth: 28, fontStyle: 'bold' }
        } : {
            0: { cellWidth: 'auto' },
            1: { halign: 'center', cellWidth: 16 },
            2: { halign: 'center', cellWidth: 16 },
            3: { halign: 'right', cellWidth: 26 },
            4: { halign: 'right', cellWidth: 16 },
            5: { halign: 'right', cellWidth: 28, fontStyle: 'bold' }
        }
    })

    // --- 4. TOTAUX & VENTILATION DE TVA ---
    // Calcul précis des totaux à partir des items
    let computedHT = 0
    const tvaBreakdown: Record<number, { base: number, amount: number }> = {}

    rawItems.forEach((it: any) => {
        const progress = isSituation ? (it.progress_percentage ?? 100) : 100
        const lHT = (it.quantity || 0) * (it.unit_price || 0) * (progress / 100)
        computedHT += lHT

        const rate = it.tva || 10
        if (!tvaBreakdown[rate]) {
            tvaBreakdown[rate] = { base: 0, amount: 0 }
        }
        tvaBreakdown[rate].base += lHT
        tvaBreakdown[rate].amount += lHT * (rate / 100)
    })

    const finalHT = facture.total_ht !== undefined && facture.total_ht !== null ? facture.total_ht : computedHT
    const totalTva = Object.values(tvaBreakdown).reduce((sum, v) => sum + v.amount, 0)
    const finalTTC = facture.total_ttc !== undefined && facture.total_ttc !== null ? facture.total_ttc : (finalHT + totalTva)

    // @ts-ignore
    let summaryY = doc.lastAutoTable.finalY + 8

    // Vérifier s'il reste assez de place sur la page pour le pavé de totaux
    if (summaryY > 230) {
        doc.addPage()
        summaryY = 20
    }

    // A. Bloc gauche : Règlement & Coordonnées bancaires
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...primaryNavy)
    doc.text("MODALITÉS DE RÈGLEMENT", 14, summaryY + 2)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...slateMuted)
    doc.text("Règlement par virement bancaire ou chèque à l'ordre de l'entreprise.", 14, summaryY + 7)

    if (company?.iban) {
        doc.text(`IBAN : ${company.iban}`, 14, summaryY + 12)
        if (company?.bic) {
            doc.text(`BIC : ${company.bic}`, 14, summaryY + 16)
        }
    }

    // B. Bloc droit : Totaux structurés
    const sumX = 118
    const sumW = 78

    doc.setFillColor(...bgLight)
    doc.setDrawColor(...borderCard)
    doc.roundedRect(sumX, summaryY, sumW, 38, 2.5, 2.5, 'FD')

    // Ligne Total HT
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...slateDark)
    doc.text("Total HT Brut :", sumX + 6, summaryY + 7)
    doc.setFont('helvetica', 'bold')
    doc.text(fmtCur(finalHT), sumX + sumW - 6, summaryY + 7, { align: 'right' })

    // Lignes TVA ventilée
    let tvaY = summaryY + 13
    const tvaRates = Object.keys(tvaBreakdown).map(Number)
    if (tvaRates.length > 0) {
        tvaRates.forEach(rate => {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8)
            doc.setTextColor(...slateMuted)
            doc.text(`TVA ${rate}% :`, sumX + 6, tvaY)
            doc.text(fmtCur(tvaBreakdown[rate].amount), sumX + sumW - 6, tvaY, { align: 'right' })
            tvaY += 4.5
        })
    } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...slateMuted)
        doc.text("TVA (10%) :", sumX + 6, tvaY)
        doc.text(fmtCur(finalTTC - finalHT), sumX + sumW - 6, tvaY, { align: 'right' })
        tvaY += 5
    }

    // Ligne NET À PAYER TTC
    const netBoxY = summaryY + 23
    doc.setFillColor(...slateDark)
    doc.roundedRect(sumX + 3, netBoxY, sumW - 6, 12, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(255, 255, 255)
    doc.text("NET À PAYER TTC :", sumX + 6, netBoxY + 7.5)
    doc.setFontSize(9.5)
    doc.text(fmtCur(finalTTC), sumX + sumW - 6, netBoxY + 7.5, { align: 'right' })

    // --- 5. PIED DE PAGE LÉGAL BTP ---
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...slateMuted)
    const legalFooter = company?.footer_text ||
        "Pénalités de retard : 3 fois le taux d'intérêt légal. Indemnité forfaitaire de 40 € pour frais de recouvrement en cas de retard (Art. L441-6 du Code de Commerce). Pas d'escompte pour règlement anticipé."
    const splitFooter = doc.splitTextToSize(legalFooter, 182)
    doc.text(splitFooter, 105, 283, { align: 'center' })

    // Retour Base64 ou Téléchargement
    if (returnBase64) {
        return doc.output('datauristring')
    } else {
        doc.save(`Facture-${facture.reference || 'BTP'}.pdf`)
    }
}

/**
 * GENERATE CUSTOM DEVIS PDF
 * Moteur d'exportation de devis BTP avec sélection dynamique de colonnes
 * et totaux fixes en pied de document (Sous-total HT, TVA, Total TTC).
 */
export const generateCustomDevisPDF = async (
    devisInput: any,
    configInput?: DevisPdfColumnConfig,
    companySettingsInput: any = null,
    returnBase64 = false
) => {
    const doc = new jsPDF()

    // Support des deux formats d'appel :
    // A) Objet enveloppé { devis, items, client, chantier, companySettings, columnConfig }
    // B) devisInput direct, configInput, companySettingsInput
    const isWrapped = Boolean(devisInput?.devis)
    const baseDevis = isWrapped ? devisInput.devis : devisInput
    const devis = { ...baseDevis }

    const config: DevisPdfColumnConfig = configInput || devisInput?.columnConfig || DEFAULT_PDF_PRESETS.ARCHITECTE_MOE.config
    let company = companySettingsInput || devisInput?.companySettings || null

    if (isWrapped) {
        if (devisInput.items && devisInput.items.length > 0) {
            devis.devis_items = devisInput.items
        }
        if (devisInput.chantier) {
            devis.chantiers = {
                ...devisInput.chantier,
                clients: devisInput.client || devisInput.chantier.clients
            }
        }
    }

    // 1. Récupération défensive des lignes si absentes
    if (!devis.devis_items || devis.devis_items.length === 0) {
        try {
            const { createClient } = await import('@/utils/supabase/client')
            const supabase = createClient()
            const { data: dbItems } = await supabase
                .from('devis_items')
                .select('*')
                .eq('devis_id', devis.id)
                .order('position', { ascending: true })

            if (dbItems && dbItems.length > 0) {
                devis.devis_items = dbItems
            }
        } catch (err) {
            console.warn("Impossible de récupérer les lignes du devis:", err)
        }
    }

    // Palette BTP
    const primaryNavy = [15, 23, 42] as [number, number, number]
    const slateDark = [30, 41, 59] as [number, number, number]
    const slateMuted = [100, 116, 139] as [number, number, number]
    const bgLight = [248, 250, 252] as [number, number, number]
    const borderCard = [226, 232, 240] as [number, number, number]

    if (!company) {
        try {
            const { createClient } = await import('@/utils/supabase/client')
            const supabase = createClient()
            const { data: dbCompany } = await supabase.from('company_settings').select('*').maybeSingle()
            if (dbCompany) company = dbCompany
        } catch {
            // fallback
        }
    }

    // En-tête
    let leftY = 18
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...primaryNavy)
    doc.text(company?.name || 'ENTREPRISE BTP & RÉNOVATION', 14, leftY)

    leftY += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...slateMuted)

    if (company?.address) {
        doc.text(company.address, 14, leftY)
        leftY += 4
    }
    const phoneEmail = [
        company?.phone ? `Tél : ${company.phone}` : null,
        company?.email ? `Email : ${company.email}` : null
    ].filter(Boolean).join('  |  ')
    if (phoneEmail) {
        doc.text(phoneEmail, 14, leftY)
        leftY += 4
    }

    // Droite : Devis
    const rightX = 120
    let rightY = 18

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(...primaryNavy)
    doc.text("DEVIS PRO BTP", rightX, rightY)

    rightY += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...slateDark)
    doc.text(`N° ${devis.reference || 'PROVISOIRE'}`, rightX, rightY)

    rightY += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...slateMuted)
    doc.text(`Date : ${fmtDate(devis.date_emission || devis.created_at)}`, rightX, rightY)

    rightY += 4.5
    doc.text(`Validité de l'offre : 30 jours`, rightX, rightY)

    // Cadres Chantier & Client
    const boxY = Math.max(leftY, rightY) + 7
    const boxHeight = 28
    const boxWidth = 88

    doc.setFillColor(...bgLight)
    doc.setDrawColor(...borderCard)
    doc.roundedRect(14, boxY, boxWidth, boxHeight, 3, 3, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...slateMuted)
    doc.text("CHANTIER & LIEU D'INTERVENTION", 18, boxY + 6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...primaryNavy)
    const chantierName = devis.chantiers?.name || devis.name || 'Projet BTP'
    doc.text(doc.splitTextToSize(chantierName, boxWidth - 8), 18, boxY + 12)

    // Client
    const clientX = 108
    doc.setFillColor(...bgLight)
    doc.setDrawColor(...borderCard)
    doc.roundedRect(clientX, boxY, boxWidth, boxHeight, 3, 3, 'FD')

    const client = devis.chantiers?.clients
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...slateMuted)
    doc.text("CLIENT / MAÎTRE D'OUVRAGE", clientX + 4, boxY + 6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...primaryNavy)
    doc.text(client?.name || 'Client', clientX + 4, boxY + 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...slateMuted)
    let cY = boxY + 17
    if (client?.address_line1) {
        doc.text(client.address_line1, clientX + 4, cY)
        cY += 4
    }
    const cCity = `${client?.zip_code || ''} ${client?.city || ''}`.trim()
    if (cCity) doc.text(cCity, clientX + 4, cY)

    // 2. CONSTRUCTION DYNAMIQUE DES COLONNES DU TABLEAU (SELON CONFIG)
    const tableStartY = boxY + boxHeight + 8
    const tableColumns: string[] = []
    const columnStyles: Record<number, any> = {}
    let colIdx = 0

    if (config.showReference) {
        tableColumns.push("Réf.")
        columnStyles[colIdx++] = { cellWidth: 18, halign: 'center' }
    }

    // La description est toujours présente
    tableColumns.push("Désignation des prestations")
    columnStyles[colIdx++] = { cellWidth: 'auto' }

    if (config.showQuantity) {
        tableColumns.push("Qté")
        columnStyles[colIdx++] = { cellWidth: 14, halign: 'center' }
    }

    if (config.showUnit) {
        tableColumns.push("Unité")
        columnStyles[colIdx++] = { cellWidth: 14, halign: 'center' }
    }

    if (config.showUnitPrice) {
        tableColumns.push("PU HT")
        columnStyles[colIdx++] = { cellWidth: 26, halign: 'right' }
    }

    if (config.showTotalHT) {
        tableColumns.push("Montant HT")
        columnStyles[colIdx++] = { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
    }

    const totalActiveColumns = tableColumns.length

    const rawItems = devis.devis_items || []
    const tableRows = rawItems.map((item: any) => {
        const desc = (item.description || '').trim()
        const isImage = item.item_type === 'image' || item.details?.is_image === true || Boolean(item.image_url)

        // Ligne Photo / Visuel pleine largeur entre les prestations
        if (isImage) {
            const caption = desc || item.details?.caption || item.caption || "Photo / Constat chantier"
            return [{
                content: caption,
                colSpan: totalActiveColumns,
                styles: {
                    halign: 'center',
                    valign: 'bottom',
                    fontSize: 8,
                    fontStyle: 'italic',
                    textColor: [100, 116, 139],
                    minCellHeight: 52,
                    cellPadding: { bottom: 3 },
                    fillColor: [250, 250, 252]
                },
                _isImage: true,
                _imageUrl: item.image_url || item.details?.image_url
            }]
        }

        const isSection = (item.unit_price === 0 && (!item.unit || item.unit === '')) ||
            item.item_type === 'section' || item.item_type === 'sub_section' ||
            /^[0-9]+\.\s+[A-ZÀ-Ÿ\s&]+$/.test(desc)

        if (isSection) {
            return [{
                content: desc.toUpperCase(),
                colSpan: totalActiveColumns,
                styles: {
                    fontStyle: 'bold',
                    fillColor: [241, 245, 249],
                    textColor: [15, 23, 42],
                    fontSize: 8.5,
                    cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 }
                }
            }]
        }

        const lineHT = (item.quantity || 1) * (item.unit_price || 0) * (1 - (item.discount_pct || 0) / 100)
        const rowCells: any[] = []

        if (config.showReference) {
            rowCells.push(item.reference || item.details?.reference || '-')
        }
        
        let displayedDesc = ''
        if (config.showDescription) {
            displayedDesc = desc
            const complement = (item.complement || item.details?.complement || '').trim()
            if (complement && !desc.toLowerCase().includes(complement.toLowerCase())) {
                displayedDesc += `\n${complement}`
            }
        } else {
            // Option Description détaillée désactivée : afficher UNIQUEMENT le titre/libellé principal (1ère ligne)
            displayedDesc = desc.split('\n')[0].trim()
        }
        rowCells.push(displayedDesc)

        if (config.showQuantity) {
            rowCells.push(item.quantity ? String(item.quantity) : '1')
        }

        if (config.showUnit) {
            rowCells.push(item.unit || 'u')
        }

        if (config.showUnitPrice) {
            rowCells.push(fmtCur(item.unit_price))
        }

        if (config.showTotalHT) {
            rowCells.push(fmtCur(lineHT))
        }

        return rowCells
    })

    autoTable(doc, {
        head: [tableColumns],
        body: tableRows.length > 0 ? tableRows : [
            [{ content: "Aucune prestation enregistrée", colSpan: totalActiveColumns, styles: { halign: 'center', fontStyle: 'italic', textColor: [150, 150, 150] } }]
        ],
        startY: tableStartY,
        theme: 'grid',
        headStyles: {
            fillColor: [30, 41, 59],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8.5,
            cellPadding: { top: 3, bottom: 3, left: 2, right: 2 }
        },
        styles: {
            fontSize: 8,
            cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 },
            textColor: [30, 41, 59],
            lineColor: [226, 232, 240],
            lineWidth: 0.1,
            valign: 'middle'
        },
        alternateRowStyles: { fillColor: [250, 250, 252] },
        columnStyles,
        didDrawCell: (data) => {
            const cellRaw: any = data.cell.raw
            if (cellRaw && cellRaw._isImage && cellRaw._imageUrl && data.column.index === 0) {
                try {
                    const imgW = 75
                    const imgH = 42
                    const imgX = data.cell.x + (data.cell.width - imgW) / 2
                    const imgY = data.cell.y + 4
                    const format = typeof cellRaw._imageUrl === 'string' && cellRaw._imageUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
                    doc.addImage(cellRaw._imageUrl, format, imgX, imgY, imgW, imgH)
                } catch (e) {
                    console.warn("Erreur affichage image PDF:", e)
                }
            }
        }
    })

    // 3. PIED FIXE DU DOCUMENT (SOUS-TOTAL HT, TVA, TOTAL TTC, SIGNATURE)
    // @ts-ignore
    let summaryY = doc.lastAutoTable.finalY + 8
    if (summaryY > 220) {
        doc.addPage()
        summaryY = 20
    }

    const showFinancialTotals = config.showTotals !== false

    // Cadre signature (Gauche ou Pleine largeur si totaux financiers masqués)
    const sigWidth = showFinancialTotals ? 88 : 182
    doc.setFillColor(...bgLight)
    doc.setDrawColor(...borderCard)
    doc.roundedRect(14, summaryY, sigWidth, 38, 2.5, 2.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...primaryNavy)
    doc.text("BON POUR ACCORD & COMMANDE", 18, summaryY + 7)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...slateMuted)
    doc.text("Mention manuscrite 'Bon pour accord' + Date et Signature :", 18, summaryY + 12)

    // Cadre Totaux financiers (Droite) - Masqué si showTotals est désactivé
    if (showFinancialTotals) {
        const sumX = 118
        const sumW = 78
        doc.setFillColor(...bgLight)
        doc.setDrawColor(...borderCard)
        doc.roundedRect(sumX, summaryY, sumW, 38, 2.5, 2.5, 'FD')

        const totalHT = devis.total_ht || 0
        const totalTTC = devis.total_ttc || (totalHT * 1.1)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(...slateDark)
        doc.text("Total HT Brut :", sumX + 6, summaryY + 7)
        doc.setFont('helvetica', 'bold')
        doc.text(fmtCur(totalHT), sumX + sumW - 6, summaryY + 7, { align: 'right' })

        doc.setFont('helvetica', 'normal')
        doc.text("TVA estimée :", sumX + 6, summaryY + 14)
        doc.text(fmtCur(totalTTC - totalHT), sumX + sumW - 6, summaryY + 14, { align: 'right' })

        const netBoxY = summaryY + 22
        doc.setFillColor(...slateDark)
        doc.roundedRect(sumX + 3, netBoxY, sumW - 6, 12, 2, 2, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(255, 255, 255)
        doc.text("TOTAL DEVIS TTC :", sumX + 6, netBoxY + 7.5)
        doc.setFontSize(9.5)
        doc.text(fmtCur(totalTTC), sumX + sumW - 6, netBoxY + 7.5, { align: 'right' })
    }

    // Mentions légales bas de page
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...slateMuted)
    const legalFooter = company?.footer_text ||
        "Offre valable 30 jours à compter de la date d'émission. Acompte de 30% à la commande, solde à réception de facture."
    const splitFooter = doc.splitTextToSize(legalFooter, 182)
    doc.text(splitFooter, 105, 283, { align: 'center' })

    if (returnBase64) {
        return doc.output('datauristring')
    } else {
        doc.save(`Devis-${devis.reference || 'BTP'}.pdf`)
    }
}
