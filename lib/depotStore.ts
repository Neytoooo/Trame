import fs from 'fs'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { DepotPhoto, DepotStats, DepotPhotoCategory } from '@/types/depot'
import { getAppSupabaseClient, getCachedServerSession } from './serverAuthCache'
import { getMobileDevis } from './mobileDevisStore'

const DATA_DIR = path.join(process.cwd(), 'data')
const DEPOT_FILE = path.join(DATA_DIR, 'depot_photos.json')
const NOTIFS_FILE = path.join(DATA_DIR, 'mobile_notifications.json')
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'depot')

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
    }
}

function ensureUploadsDir() {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true })
    }
}

export function saveBase64ImageToDisk(photoId: string, base64Data: string): string {
    try {
        ensureUploadsDir()
        const cleaned = base64Data.replace(/^data:image\/\w+;base64,/, '').trim()
        const buffer = Buffer.from(cleaned, 'base64')
        const fileName = `${photoId}.jpg`
        const filePath = path.join(UPLOADS_DIR, fileName)
        fs.writeFileSync(filePath, buffer)
        return `/uploads/depot/${fileName}`
    } catch (e) {
        console.error('Erreur sauvegarde image disque:', e)
        return base64Data
    }
}

// Système d'événements temps réel sans polling (Server-Sent Events)
export type DepotEvent = {
    type: 'NEW_PHOTO' | 'UPDATE_PHOTO' | 'DELETE_PHOTO' | 'CONNECTED'
    photo?: DepotPhoto
    stats?: DepotStats
    deletedId?: string
}

type DepotEventCallback = (data: DepotEvent) => void
const sseSubscribers = new Set<DepotEventCallback>()

export function subscribeToDepotEvents(cb: DepotEventCallback) {
    sseSubscribers.add(cb)
    return () => {
        sseSubscribers.delete(cb)
    }
}

export function notifyDepotChange(photo: DepotPhoto, stats: DepotStats, type: 'NEW_PHOTO' | 'UPDATE_PHOTO' = 'NEW_PHOTO') {
    for (const cb of sseSubscribers) {
        try {
            cb({ type, photo, stats })
        } catch {
            sseSubscribers.delete(cb)
        }
    }
}

export function notifyDepotDelete(deletedId: string, stats: DepotStats) {
    for (const cb of sseSubscribers) {
        try {
            cb({ type: 'DELETE_PHOTO', deletedId, stats })
        } catch {
            sseSubscribers.delete(cb)
        }
    }
}

export function getStoredDepotPhotos(): DepotPhoto[] {
    try {
        ensureDataDir()
        if (!fs.existsSync(DEPOT_FILE)) return []
        const raw = fs.readFileSync(DEPOT_FILE, 'utf8')
        return JSON.parse(raw)
    } catch {
        return []
    }
}

function saveStoredDepotPhotos(photos: DepotPhoto[]) {
    try {
        ensureDataDir()
        fs.writeFileSync(DEPOT_FILE, JSON.stringify(photos.slice(0, 200), null, 2), 'utf8')
    } catch (err) {
        console.error('Erreur écriture depot_photos.json:', err)
    }
}

/**
 * Récupère toutes les photos du dépôt (fusion Supabase + Store local persistant)
 */
export async function getDepotPhotos(filters?: {
    devis_reference?: string
    category?: string
    search?: string
}): Promise<DepotPhoto[]> {
    let dbPhotos: DepotPhoto[] = []

    try {
        const supabase = getAppSupabaseClient()
        let query = supabase
            .from('depot_photos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100)

        if (filters?.devis_reference) {
            query = query.ilike('devis_reference', `%${filters.devis_reference.trim()}%`)
        }
        if (filters?.category && filters.category !== 'all') {
            query = query.eq('category', filters.category)
        }

        const { data } = await query
        if (data) {
            dbPhotos = data as DepotPhoto[]
        }
    } catch {
        // Fallback local
    }

    const localPhotos = getStoredDepotPhotos()

    // Fusion sans doublon par id
    const seenIds = new Set(dbPhotos.map(p => p.id))
    const merged = [...dbPhotos]

    for (const p of localPhotos) {
        if (!seenIds.has(p.id)) {
            merged.push(p)
        }
    }

    // Filtrage mémoire
    let filtered = merged

    if (filters?.devis_reference && filters.devis_reference.trim()) {
        const refQuery = filters.devis_reference.trim().toLowerCase()
        filtered = filtered.filter(p => 
            p.devis_reference?.toLowerCase().includes(refQuery)
        )
    }

    if (filters?.category && filters.category !== 'all') {
        filtered = filtered.filter(p => p.category === filters.category)
    }

    if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase()
        filtered = filtered.filter(p => 
            p.title?.toLowerCase().includes(q) ||
            p.notes?.toLowerCase().includes(q) ||
            p.chantier_name?.toLowerCase().includes(q) ||
            p.client_name?.toLowerCase().includes(q) ||
            p.devis_reference?.toLowerCase().includes(q)
        )
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return filtered
}

/**
 * Récupère les métriques globales du Dépôt
 */
export async function getDepotStats(): Promise<DepotStats> {
    const photos = await getDepotPhotos()
    const linked = photos.filter(p => Boolean(p.devis_reference?.trim()))
    const uniqueRefs = new Set(linked.map(p => p.devis_reference?.trim()))

    return {
        totalPhotos: photos.length,
        linkedToDevisCount: linked.length,
        uniqueDevisCount: uniqueRefs.size,
        lastUploadedAt: photos[0]?.created_at || null
    }
}

/**
 * Recherche les informations d'un devis par sa référence
 */
export async function lookupDevisInfo(reference: string): Promise<{
    devisId: string | null
    reference: string
    chantierName: string
    clientName: string
    chantierId: string | null
}> {
    const cleanRef = reference.trim()
    if (!cleanRef) {
        return {
            devisId: null,
            reference: '',
            chantierName: 'Chantier',
            clientName: 'Client',
            chantierId: null
        }
    }

    // 1. Chercher dans les devis mobiles récents
    const mobileDevis = getMobileDevis()
    const foundMobile = mobileDevis.find(d => 
        d.reference.toLowerCase() === cleanRef.toLowerCase() ||
        d.id.toLowerCase() === cleanRef.toLowerCase()
    )

    if (foundMobile) {
        return {
            devisId: foundMobile.id,
            reference: foundMobile.reference,
            chantierName: foundMobile.chantiers?.name || foundMobile.name.replace(/^Devis\s+/, ''),
            clientName: foundMobile.chantiers?.clients?.name || 'Client',
            chantierId: foundMobile.chantier_id || null
        }
    }

    // 2. Chercher dans Supabase
    try {
        const supabase = getAppSupabaseClient()
        const { data: dbDevis } = await supabase
            .from('devis')
            .select(`
                id,
                reference,
                name,
                chantier_id,
                chantiers (
                    id,
                    name,
                    clients ( id, name )
                )
            `)
            .or(`reference.ilike.%${cleanRef}%,id.eq.${cleanRef}`)
            .limit(1)
            .maybeSingle()

        if (dbDevis) {
            return {
                devisId: dbDevis.id,
                reference: dbDevis.reference || cleanRef,
                chantierName: (dbDevis.chantiers as any)?.name || dbDevis.name,
                clientName: (dbDevis.chantiers as any)?.clients?.name || 'Client',
                chantierId: dbDevis.chantier_id || null
            }
        }
    } catch {
        // Ignore
    }

    return {
        devisId: null,
        reference: cleanRef.toUpperCase(),
        chantierName: 'Chantier ' + cleanRef.toUpperCase(),
        clientName: 'Client',
        chantierId: null
    }
}

/**
 * Ajoute une photo dans le Dépôt depuis le smartphone ou l'ordinateur
 */
export async function addDepotPhoto(params: {
    imageUrl: string
    thumbnailUrl?: string
    title?: string
    devisReference?: string
    category?: DepotPhotoCategory
    notes?: string
    deviceInfo?: string
    clientName?: string
    chantierName?: string
}): Promise<{
    success: boolean
    photo: DepotPhoto
    error?: string
}> {
    ensureDataDir()

    const now = new Date().toISOString()
    const photoId = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    // Auto-résolution du devis
    let devisId: string | null = null
    let resolvedRef = params.devisReference?.trim().toUpperCase() || null
    let chantierName = params.chantierName?.trim() || 'Chantier'
    let clientName = params.clientName?.trim() || 'Client'
    let chantierId: string | null = null

    if (resolvedRef) {
        const info = await lookupDevisInfo(resolvedRef)
        devisId = info.devisId
        resolvedRef = info.reference || resolvedRef
        if (info.chantierName && info.chantierName !== 'Chantier') chantierName = info.chantierName
        if (info.clientName && info.clientName !== 'Client') clientName = info.clientName
        chantierId = info.chantierId
    }

    // Si l'image est en base64, on l'écrit comme vrai fichier image dans public/uploads/depot
    let finalImageUrl = params.imageUrl
    if (finalImageUrl && (finalImageUrl.startsWith('data:') || finalImageUrl.length > 500)) {
        finalImageUrl = saveBase64ImageToDisk(photoId, finalImageUrl)
    }

    const newPhoto: DepotPhoto = {
        id: photoId,
        title: params.title?.trim() || (resolvedRef ? `Photo Devis ${resolvedRef}` : 'Photo de chantier'),
        devis_id: devisId,
        devis_reference: resolvedRef,
        chantier_id: chantierId,
        chantier_name: chantierName,
        client_name: clientName,
        category: params.category || 'constat',
        image_url: finalImageUrl,
        thumbnail_url: finalImageUrl,
        notes: params.notes?.trim() || '',
        device_info: params.deviceInfo || 'Samsung S25+ (KOTA Mobile)',
        created_at: now,
        updated_at: now,
        company_id: '00000000-0000-0000-0000-000000000001'
    }

    // 1. Sauvegarde locale immédiate
    const currentList = getStoredDepotPhotos()
    currentList.unshift(newPhoto)
    saveStoredDepotPhotos(currentList)

    // Notification temps réel immédiate aux clients web connectés (sans aucun polling !)
    getDepotStats().then(stats => {
        notifyDepotChange(newPhoto, stats, 'NEW_PHOTO')
    }).catch(() => {})

    // 2. Synchronisation Supabase
    try {
        const supabase = getAppSupabaseClient()
        const session = getCachedServerSession()

        const isValidUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
        const safeDevisId = isValidUuid(newPhoto.devis_id) ? newPhoto.devis_id : null
        const safeChantierId = isValidUuid(newPhoto.chantier_id) ? newPhoto.chantier_id : null

        const cloudImageUrl = (params.imageUrl && params.imageUrl.startsWith('data:')) ? params.imageUrl : newPhoto.image_url
        const { error: sbInsertError } = await supabase.from('depot_photos').insert({
            title: newPhoto.title,
            devis_id: safeDevisId,
            devis_reference: newPhoto.devis_reference,
            chantier_id: safeChantierId,
            chantier_name: newPhoto.chantier_name,
            client_name: newPhoto.client_name,
            category: newPhoto.category,
            image_url: cloudImageUrl,
            thumbnail_url: cloudImageUrl,
            notes: newPhoto.notes,
            device_info: newPhoto.device_info,
            company_id: '00000000-0000-0000-0000-000000000001',
            created_by: session?.userId || null
        })
        if (sbInsertError) {
            console.error('Erreur insertion Supabase depot_photos:', sbInsertError)
        }
    } catch (sbErr) {
        console.warn('Sync Supabase depot_photos différée:', sbErr)
    }

    // 3. Notification dans Annonces Web
    if (resolvedRef) {
        try {
            const notifId = `notif-depot-${Date.now()}`
            const notif = {
                id: notifId,
                type: 'new_depot_photo',
                title: `Nouvelle photo au Dépôt (${resolvedRef})`,
                message: `Une photo de chantier a été envoyée depuis le smartphone et rattachée au devis ${resolvedRef} (${chantierName}).`,
                status: 'unread',
                created_at: now,
                data: {
                    devis_reference: resolvedRef,
                    photo_id: photoId,
                    url: `/dashboard/depot?devis=${encodeURIComponent(resolvedRef)}`
                }
            }

            if (fs.existsSync(NOTIFS_FILE)) {
                const notifs = JSON.parse(fs.readFileSync(NOTIFS_FILE, 'utf8') || '[]')
                notifs.unshift(notif)
                fs.writeFileSync(NOTIFS_FILE, JSON.stringify(notifs.slice(0, 50), null, 2), 'utf8')
            }
        } catch {
            // Non-bloquant
        }
    }

    try {
        revalidatePath('/dashboard/depot')
        revalidatePath('/dashboard/devis')
    } catch {
        // Ignore
    }

    return {
        success: true,
        photo: newPhoto
    }
}

/**
 * Mise à jour d'une photo du Dépôt (ex: changer le devis rattaché ou les notes)
 */
export async function updateDepotPhoto(
    id: string,
    updates: {
        devisReference?: string | null
        title?: string
        notes?: string
        category?: DepotPhotoCategory
    }
): Promise<{ success: boolean; photo?: DepotPhoto }> {
    const list = getStoredDepotPhotos()
    const index = list.findIndex(p => p.id === id)

    if (index === -1) {
        return { success: false }
    }

    let devisId = list[index].devis_id
    let devisRef = list[index].devis_reference
    let chantierName = list[index].chantier_name
    let clientName = list[index].client_name

    if (updates.devisReference !== undefined) {
        if (updates.devisReference && updates.devisReference.trim()) {
            const info = await lookupDevisInfo(updates.devisReference)
            devisId = info.devisId
            devisRef = info.reference
            if (info.chantierName && info.chantierName !== 'Chantier') chantierName = info.chantierName
            if (info.clientName && info.clientName !== 'Client') clientName = info.clientName
        } else {
            devisId = null
            devisRef = null
        }
    }

    const updatedPhoto: DepotPhoto = {
        ...list[index],
        title: updates.title !== undefined ? updates.title : list[index].title,
        notes: updates.notes !== undefined ? updates.notes : list[index].notes,
        category: updates.category || list[index].category,
        devis_id: devisId,
        devis_reference: devisRef,
        chantier_name: chantierName,
        client_name: clientName,
        updated_at: new Date().toISOString()
    }

    list[index] = updatedPhoto
    saveStoredDepotPhotos(list)

    // Notification temps réel
    getDepotStats().then(stats => {
        notifyDepotChange(updatedPhoto, stats, 'UPDATE_PHOTO')
    }).catch(() => {})

    try {
        const supabase = getAppSupabaseClient()
        await supabase
            .from('depot_photos')
            .update({
                title: updatedPhoto.title,
                notes: updatedPhoto.notes,
                category: updatedPhoto.category,
                devis_id: updatedPhoto.devis_id,
                devis_reference: updatedPhoto.devis_reference,
                chantier_name: updatedPhoto.chantier_name,
                client_name: updatedPhoto.client_name,
                updated_at: updatedPhoto.updated_at
            })
            .eq('id', id)
    } catch {
        // Ignore
    }

    try {
        revalidatePath('/dashboard/depot')
    } catch {
        // Ignore
    }

    return { success: true, photo: updatedPhoto }
}

/**
 * Suppression d'une photo du Dépôt
 */
export async function deleteDepotPhoto(id: string): Promise<boolean> {
    const list = getStoredDepotPhotos()
    const updated = list.filter(p => p.id !== id)
    saveStoredDepotPhotos(updated)

    // Notification temps réel suppression
    getDepotStats().then(stats => {
        notifyDepotDelete(id, stats)
    }).catch(() => {})

    try {
        const supabase = getAppSupabaseClient()
        await supabase.from('depot_photos').delete().eq('id', id)
    } catch {
        // Ignore
    }

    try {
        revalidatePath('/dashboard/depot')
    } catch {
        // Ignore
    }

    return true
}
