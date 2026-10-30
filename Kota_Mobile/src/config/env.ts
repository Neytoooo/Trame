import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

// Tunnel public actif sécurisé (mis à jour automatiquement par le daemon tunnel-manager)
export const ACTIVE_TUNNEL_URL = 'https://ac32ba279de007.lhr.life'

// Topic de synchronisation cloud temps réel (ntfy.sh)
export const CLOUD_SYNC_TOPIC = 'kota_btp_tunnel_sync_7f8a92'

// IP locale de secours (si sur le même réseau Wi-Fi direct)
export const SERVER_LOCAL_IP = '10.147.94.9'
export const SERVER_PORT = '3000'

export function getAutoDetectedHost(): string {
  if (ACTIVE_TUNNEL_URL) {
    return ACTIVE_TUNNEL_URL.replace(/\/+$/, '')
  }

  const hostUri = Constants.expoConfig?.hostUri
  if (hostUri) {
    const host = hostUri.split(':')[0]
    if (
      host &&
      !host.startsWith('192.168.56.') &&
      !host.startsWith('169.254.') &&
      host !== 'localhost' &&
      host !== '127.0.0.1'
    ) {
      return `http://${host}:${SERVER_PORT}`
    }
  }

  return `http://${SERVER_LOCAL_IP}:${SERVER_PORT}`
}

export const DEFAULT_CONFIG = {
  SUPABASE_URL: 'https://yljsnkiewgsubimwatji.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_bGSTGeJbehf9bOumU0Nb2Q_WUzay69-',
  GEMINI_API_KEY: 'AIzaSyD5zaUyicjaEnTSNuyIvhM0FeXV7remSv8',
  KOTA_API_URL: ACTIVE_TUNNEL_URL || `http://${SERVER_LOCAL_IP}:${SERVER_PORT}`,
}

const STORAGE_KEYS = {
  KOTA_API_URL: '@kota_api_url',
  GEMINI_KEY: '@kota_gemini_key',
}

let cachedKotaUrl: string | null = null
let lastCloudCheckTimestamp = 0

/**
 * Récupère le tout dernier tunnel actif publié sur le canal de synchro cloud (ntfy.sh).
 * Fonctionne même si l'URL a changé pendant que l'application était ouverte.
 */
export async function fetchLatestCloudTunnelUrl(): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500)

    const res = await fetch(`https://ntfy.sh/${CLOUD_SYNC_TOPIC}/json?poll=1`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) return null

    const text = await res.text()
    const lines = text.trim().split('\n').filter(Boolean)
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const item = JSON.parse(lines[i])
        if (item.event === 'message' && typeof item.message === 'string' && item.message.startsWith('https://')) {
          const cloudUrl = item.message.trim().replace(/\/+$/, '')
          cachedKotaUrl = cloudUrl
          lastCloudCheckTimestamp = Date.now()
          await AsyncStorage.setItem(STORAGE_KEYS.KOTA_API_URL, cloudUrl)
          return cloudUrl
        }
      } catch {}
    }
    return null
  } catch {
    return null
  }
}

/**
 * Retourne l'URL du serveur KOTA Web.
 * Vérifie automatiquement toutes les 25 secondes si un nouveau tunnel a été généré
 * sur le PC sans nécessiter d'intervention manuelle.
 */
export async function getKotaApiUrl(forceCloudCheck = false): Promise<string> {
  const now = Date.now()
  const shouldCheckCloud = forceCloudCheck || now - lastCloudCheckTimestamp > 25000

  // 1. Tenter la récupération du dernier tunnel cloud si nécessaire
  if (shouldCheckCloud) {
    lastCloudCheckTimestamp = now
    const cloudUrl = await fetchLatestCloudTunnelUrl()
    if (cloudUrl) {
      cachedKotaUrl = cloudUrl
      return cloudUrl
    }
  }

  if (cachedKotaUrl) {
    return cachedKotaUrl
  }

  // 2. Fallback sur AsyncStorage
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.KOTA_API_URL)
    if (saved && saved.trim() && saved.trim() !== 'http://10.0.2.2:3000') {
      const clean = saved.trim().replace(/\/+$/, '')
      cachedKotaUrl = clean
      return clean
    }
  } catch {}

  // 3. Fallback sur le tunnel bundlé ou auto-détecté
  const fallback = getAutoDetectedHost().replace(/\/+$/, '')
  cachedKotaUrl = fallback
  return fallback
}

export async function setKotaApiUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/+$/, '')
  cachedKotaUrl = clean
  await AsyncStorage.setItem(STORAGE_KEYS.KOTA_API_URL, clean)
}

export async function getGeminiApiKey(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.GEMINI_KEY)
    return saved || DEFAULT_CONFIG.GEMINI_API_KEY
  } catch {
    return DEFAULT_CONFIG.GEMINI_API_KEY
  }
}

export async function setGeminiApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.GEMINI_KEY, key)
}
