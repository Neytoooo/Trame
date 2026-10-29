import AsyncStorage from '@react-native-async-storage/async-storage'
import { DepotPhoto, DepotPhotoCategory } from '../types/depot'
import { getKotaApiUrl } from '../config/env'

const STORAGE_DEPOT_KEY = '@kota_mobile_depot_photos'
const STORAGE_DEVIS_KEY = '@kota_created_devis'

export interface UploadPhotoParams {
  imageBase64: string
  devisReference?: string
  category: DepotPhotoCategory
  title?: string
  notes?: string
  clientName?: string
  chantierName?: string
}

/**
 * Sauvegarde locale pour l'historique mobile
 */
async function saveLocalDepotPhoto(photo: DepotPhoto) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_DEPOT_KEY)
    const list: DepotPhoto[] = raw ? JSON.parse(raw) : []
    const updated = [photo, ...list.filter(p => p.id !== photo.id)].slice(0, 30)
    await AsyncStorage.setItem(STORAGE_DEPOT_KEY, JSON.stringify(updated))
  } catch {
    // Non-bloquant
  }
}

/**
 * Récupère l'historique des photos envoyées depuis ce smartphone
 */
export async function getLocalDepotPhotos(): Promise<DepotPhoto[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_DEPOT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Récupère les numéros de devis récents pour l'auto-complétion rapide
 */
export async function getRecentDevisReferences(): Promise<Array<{ reference: string; label: string }>> {
  const references: Array<{ reference: string; label: string }> = []
  const seenRefs = new Set<string>()

  // 1. Depuis l'API KOTA
  try {
    const kotaApiUrl = await getKotaApiUrl()
    const res = await fetch(`${kotaApiUrl}/api/mobile/devis`, {
      headers: { 'Bypass-Tunnel-Reminder': 'true' }
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.devis)) {
        data.devis.forEach((d: any) => {
          if (d.reference && !seenRefs.has(d.reference)) {
            seenRefs.add(d.reference)
            references.push({
              reference: d.reference,
              label: `${d.reference} (${d.clientName || d.chantierName || 'Devis'})`
            })
          }
        })
      }
    }
  } catch {
    // Fallback local
  }

  // 2. Depuis le stockage local du téléphone
  try {
    const raw = await AsyncStorage.getItem(STORAGE_DEVIS_KEY)
    if (raw) {
      const localList = JSON.parse(raw)
      localList.forEach((d: any) => {
        if (d.reference && !seenRefs.has(d.reference)) {
          seenRefs.add(d.reference)
          references.push({
            reference: d.reference,
            label: `${d.reference} (${d.clientName || 'Mobile'})`
          })
        }
      })
    }
  } catch {
    // Ignore
  }

  return references
}

/**
 * Envoie une photo prise avec le smartphone vers le Dépôt KOTA Web
 */
export async function uploadPhotoToDepot(params: UploadPhotoParams): Promise<{
  success: boolean
  photo?: DepotPhoto
  error?: string
}> {
  const kotaApiUrl = await getKotaApiUrl()

  const payload = {
    imageBase64: params.imageBase64,
    devisReference: params.devisReference?.trim() || undefined,
    category: params.category || 'constat',
    title: params.title?.trim() || undefined,
    notes: params.notes?.trim() || undefined,
    clientName: params.clientName?.trim() || undefined,
    chantierName: params.chantierName?.trim() || undefined,
    deviceInfo: 'Samsung S25+ (KOTA Mobile)'
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)

    const res = await fetch(`${kotaApiUrl}/api/mobile/depot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (res.ok) {
      const data = await res.json()
      if (data.success && data.photo) {
        await saveLocalDepotPhoto(data.photo)
        return { success: true, photo: data.photo }
      }
    }

    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'Erreur lors de l\'enregistrement')
  } catch (err: any) {
    // Tentative de récupération automatique du dernier tunnel cloud en direct (auto-guérison)
    try {
      const freshKotaUrl = await getKotaApiUrl(true)
      if (freshKotaUrl && freshKotaUrl !== kotaApiUrl) {
        const retryController = new AbortController()
        const retryTimeout = setTimeout(() => retryController.abort(), 20000)
        const retryRes = await fetch(`${freshKotaUrl}/api/mobile/depot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true'
          },
          body: JSON.stringify(payload),
          signal: retryController.signal
        })
        clearTimeout(retryTimeout)
        if (retryRes.ok) {
          const retryData = await retryRes.json()
          if (retryData.success && retryData.photo) {
            await saveLocalDepotPhoto(retryData.photo)
            return { success: true, photo: retryData.photo }
          }
        }
      }
    } catch {
      // Ignorer l'échec du retry et basculer en mode hors-ligne
    }

    // Sauvegarde de secours en mode hors-ligne
    const offlinePhoto: DepotPhoto = {
      id: `photo-offline-${Date.now()}`,
      title: params.title?.trim() || 'Photo de chantier (En attente sync)',
      devis_id: null,
      devis_reference: params.devisReference?.trim().toUpperCase() || null,
      chantier_id: null,
      chantier_name: params.chantierName || 'Chantier',
      client_name: params.clientName || 'Client',
      category: params.category,
      image_url: params.imageBase64.startsWith('data:') ? params.imageBase64 : `data:image/jpeg;base64,${params.imageBase64}`,
      notes: params.notes,
      device_info: 'Samsung S25+ (Hors-ligne)',
      created_at: new Date().toISOString()
    }

    await saveLocalDepotPhoto(offlinePhoto)

    return {
      success: false,
      photo: offlinePhoto,
      error: `Serveur non joignable (${err.message || 'Erreur réseau'}). La photo a été conservée sur votre téléphone en attente de connexion.`
    }
  }
}
