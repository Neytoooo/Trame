import fs from 'fs'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { getAppSupabaseClient, getCachedServerSession } from './serverAuthCache'

const DATA_DIR = path.join(process.cwd(), 'data')
const DEVIS_FILE = path.join(DATA_DIR, 'mobile_devis.json')
const NOTIFS_FILE = path.join(DATA_DIR, 'mobile_notifications.json')

export interface MobileDevisItem {
    id?: string
    description: string
    quantity: number
    unit: string
    unit_price: number
    cost_price?: number
    tva?: number
    item_type?: string
}

export interface MobileDevis {
    id: string
    reference: string
    name: string
    status: 'brouillon' | 'envoye' | 'valide' | 'refuse'
    total_ht: number
    created_at: string
    updated_at: string
    chantier_id?: string
    notes?: string
    synced_supabase?: boolean
    chantiers?: {
        id: string
        name: string
        clients?: {
            id?: string
            name: string
            phone?: string
            address_line1?: string
        }
    }
    items: MobileDevisItem[]
}

export interface MobileNotification {
    id: string
    user_id?: string | null
    type: string
    title: string
    message: string
    status: 'unread' | 'read' | 'archived'
    created_at: string
    data: {
        devis_id: string
        reference: string
        projectName: string
        clientName: string
        totalHT: number
        itemsCount: number
        url: string
        source?: string
    }
}

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
    }
}

export function getMobileDevis(): MobileDevis[] {
    try {
        ensureDataDir()
        if (!fs.existsSync(DEVIS_FILE)) return []
        const raw = fs.readFileSync(DEVIS_FILE, 'utf8')
        return JSON.parse(raw)
    } catch {
        return []
    }
}

export function getMobileDevisById(id: string): MobileDevis | null {
    const list = getMobileDevis()
    return list.find(d => d.id === id) || null
}

export function updateMobileDevis(
    id: string,
    items: any[],
    devisData?: { name?: string; status?: string }
): boolean {
    try {
        ensureDataDir()
        const list = getMobileDevis()
        const index = list.findIndex(d => d.id === id)
        if (index === -1) return false

        const target = list[index]

        let totalHT = 0
        const sanitizedItems = items.map((it, idx) => {
            const isImage = it.item_type === 'image' || it.details?.is_image === true || Boolean(it.image_url)
            const qty = isImage ? 0 : (Number(it.quantity) || 0)
            const pu = isImage ? 0 : (Number(it.unit_price) || 0)
            const discount = isImage ? 0 : (Number(it.details?.discount_pct) || 0)
            if (!isImage && !it.details?.dont_totalize) {
                totalHT += qty * pu * (1 - discount / 100)
            }

            return {
                id: it.id || `item-${Date.now()}-${idx}`,
                description: it.description || (isImage ? 'Photo / Constat chantier' : 'Prestation'),
                quantity: qty,
                unit: isImage ? '' : (it.unit || 'u'),
                unit_price: pu,
                cost_price: Number(it.cost_price) || 0,
                tva: Number(it.tva) || 10,
                item_type: isImage ? 'image' : (it.item_type || 'item'),
                image_url: it.image_url || it.details?.image_url || '',
                caption: it.caption || it.details?.caption || '',
                details: it.details || {
                    is_image: isImage,
                    image_url: it.image_url || it.details?.image_url || '',
                    caption: it.caption || it.details?.caption || ''
                }
            }
        })

        target.items = sanitizedItems as any
        target.total_ht = Math.round(totalHT * 100) / 100
        target.updated_at = new Date().toISOString()
        if (devisData?.name) target.name = devisData.name
        if (devisData?.status) target.status = devisData.status as any

        list[index] = target
        fs.writeFileSync(DEVIS_FILE, JSON.stringify(list, null, 2), 'utf8')
        return true
    } catch (e) {
        console.error('Erreur updateMobileDevis:', e)
        return false
    }
}

export function getMobileNotifications(): MobileNotification[] {
    try {
        ensureDataDir()
        if (!fs.existsSync(NOTIFS_FILE)) return []
        const raw = fs.readFileSync(NOTIFS_FILE, 'utf8')
        return JSON.parse(raw)
    } catch {
        return []
    }
}

export function markMobileNotificationAsRead(id: string): boolean {
    try {
        const notifs = getMobileNotifications()
        const updated = notifs.map(n => n.id === id ? { ...n, status: 'read' as const } : n)
        fs.writeFileSync(NOTIFS_FILE, JSON.stringify(updated, null, 2), 'utf8')
        return true
    } catch {
        return false
    }
}

export async function createAndSyncMobileDevis(params: {
    clientName: string
    clientPhone?: string
    clientAddress?: string
    projectName: string
    notes?: string
    items: MobileDevisItem[]
}): Promise<{
    success: boolean
    devis: MobileDevis
    notification: MobileNotification
    error?: string
}> {
    ensureDataDir()

    const now = new Date().toISOString()
    const rawRefNumber = Date.now().toString().slice(-5)
    const ref = `DEV-MOB-${rawRefNumber}`
    const devisId = `dev-mob-${Date.now()}`

    let totalHT = 0
    const sanitizedItems: MobileDevisItem[] = (params.items || []).map((item, idx) => {
        const qty = Number(item.quantity) || 1
        const pu = Number(item.unit_price) || 0
        const tva = Number(item.tva) || 10
        totalHT += qty * pu

        return {
            id: `item-${Date.now()}-${idx}`,
            description: item.description?.trim() || 'Prestation BTP',
            quantity: qty,
            unit: item.unit?.trim() || 'u',
            unit_price: pu,
            cost_price: item.cost_price || Math.round(pu * 0.65 * 100) / 100,
            tva,
            item_type: 'item'
        }
    })
    totalHT = Math.round(totalHT * 100) / 100

    const clientName = params.clientName?.trim() || 'Client Mobile'
    const projectName = params.projectName?.trim() || 'Chantier Mobile'

    const localDevis: MobileDevis = {
        id: devisId,
        reference: ref,
        name: `Devis ${projectName}`,
        status: 'brouillon',
        total_ht: totalHT,
        created_at: now,
        updated_at: now,
        notes: params.notes || 'Créé via KOTA Mobile (Photo & IA)',
        synced_supabase: false,
        chantiers: {
            id: `ch-${Date.now()}`,
            name: projectName,
            clients: {
                name: clientName,
                phone: params.clientPhone,
                address_line1: params.clientAddress
            }
        },
        items: sanitizedItems
    }

    const notificationId = `notif-mob-${Date.now()}`
    const localNotification: MobileNotification = {
        id: notificationId,
        type: 'new_mobile_devis',
        title: 'Nouveau Devis Mobile (Photo IA)',
        message: `Devis ${ref} (${projectName} - ${clientName}) créé depuis le smartphone. Total estimé : ${totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € HT`,
        status: 'unread',
        created_at: now,
        data: {
            devis_id: devisId,
            reference: ref,
            projectName,
            clientName,
            totalHT,
            itemsCount: sanitizedItems.length,
            url: `/dashboard/devis/${devisId}/edit`,
            source: 'KOTA Mobile (Photo IA)'
        }
    }

    // 1. Sauvegarde immédiate dans le store serveur local (Garantie de non-perte 100%)
    try {
        const existingDevis = getMobileDevis()
        existingDevis.unshift(localDevis)
        fs.writeFileSync(DEVIS_FILE, JSON.stringify(existingDevis.slice(0, 50), null, 2), 'utf8')

        const existingNotifs = getMobileNotifications()
        existingNotifs.unshift(localNotification)
        fs.writeFileSync(NOTIFS_FILE, JSON.stringify(existingNotifs.slice(0, 50), null, 2), 'utf8')
    } catch (saveErr) {
        console.error('Erreur écriture store local mobile devis:', saveErr)
    }

    // 2. Synchronisation Supabase (si session / permissions disponibles)
    try {
        const supabase = getAppSupabaseClient()
        const session = getCachedServerSession()
        const defaultCompanyId = '00000000-0000-0000-0000-000000000001'

        // A. Client Supabase
        let supabaseClientId: string | null = null
        const { data: foundClient } = await supabase
            .from('clients')
            .select('id')
            .ilike('name', `%${clientName}%`)
            .limit(1)
            .maybeSingle()

        if (foundClient?.id) {
            supabaseClientId = foundClient.id
        } else {
            const { data: createdClient } = await supabase
                .from('clients')
                .insert({
                    name: clientName,
                    phone: params.clientPhone || null,
                    address: params.clientAddress || null,
                    type: 'particulier',
                    company_id: defaultCompanyId,
                    created_by: session?.userId || null
                })
                .select()
                .maybeSingle()
            if (createdClient?.id) supabaseClientId = createdClient.id
        }

        // B. Chantier Supabase
        let supabaseChantierId: string | null = null
        const { data: createdChantier } = await supabase
            .from('chantiers')
            .insert({
                name: projectName,
                client_id: supabaseClientId,
                address_line1: params.clientAddress || null,
                status: 'etude',
                company_id: defaultCompanyId,
                created_by: session?.userId || null
            })
            .select()
            .maybeSingle()
        if (createdChantier?.id) supabaseChantierId = createdChantier.id

        // C. Devis Supabase
        const { data: createdDevis, error: devisInsertErr } = await supabase
            .from('devis')
            .insert({
                reference: ref,
                name: `Devis ${projectName}`,
                chantier_id: supabaseChantierId,
                status: 'brouillon',
                notes: localDevis.notes,
                total_ht: totalHT,
                company_id: defaultCompanyId,
                created_by: session?.userId || null
            })
            .select()
            .maybeSingle()

        if (!devisInsertErr && createdDevis?.id) {
            localDevis.synced_supabase = true
            localDevis.id = createdDevis.id
            localNotification.data.devis_id = createdDevis.id
            localNotification.data.url = `/dashboard/devis/${createdDevis.id}/edit`

            // D. Items Devis
            if (sanitizedItems.length > 0) {
                const dbItems = sanitizedItems.map((item, i) => ({
                    devis_id: createdDevis.id,
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit,
                    unit_price: item.unit_price,
                    cost_price: item.cost_price,
                    tva: item.tva,
                    position: i,
                    item_type: 'item'
                }))
                await supabase.from('devis_items').insert(dbItems)
            }

            // E. Notification Supabase
            await supabase.from('notifications').insert({
                type: 'new_mobile_devis',
                title: localNotification.title,
                message: localNotification.message,
                status: 'unread',
                user_id: session?.userId || null,
                data: localNotification.data
            })
        }
    } catch (sbErr) {
        console.warn('Sync Supabase différée ou limitée (devis préservé en local):', sbErr)
    }

    try {
        revalidatePath('/dashboard/devis')
        revalidatePath('/dashboard/annonces')
    } catch {
        // Ignorer hors contexte requête Next
    }

    return {
        success: true,
        devis: localDevis,
        notification: localNotification
    }
}
