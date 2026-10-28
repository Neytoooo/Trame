import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

// Tunnel public actif sécurisé (permet de connecter le smartphone en 5G ou partage de connexion)
export const ACTIVE_TUNNEL_URL = 'https://ac09407eb53e94.lhr.life'

// IP locale de secours (si sur le même réseau Wi-Fi direct)
export const SERVER_LOCAL_IP = '10.70.136.9'
export const SERVER_PORT = '3000'

export function getAutoDetectedHost(): string {
  // 1. Priorité au tunnel public (fonctionne à 100% sur 5G, partage de connexion S25+, sans blocage pare-feu)
  if (ACTIVE_TUNNEL_URL) {
    return ACTIVE_TUNNEL_URL
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

export async function getKotaApiUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.KOTA_API_URL)
    if (saved && saved.trim() && saved.trim() !== 'http://10.0.2.2:3000') {
      const clean = saved.trim()
      // Si c'est un ancien tunnel .lhr.life expiré différent du tunnel actuel, on utilise le tunnel actif
      if (clean.includes('.lhr.life') && ACTIVE_TUNNEL_URL && clean !== ACTIVE_TUNNEL_URL) {
        await AsyncStorage.setItem(STORAGE_KEYS.KOTA_API_URL, ACTIVE_TUNNEL_URL)
        return ACTIVE_TUNNEL_URL
      }
      return clean
    }
    return getAutoDetectedHost()
  } catch {
    return getAutoDetectedHost()
  }
}

export async function setKotaApiUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.KOTA_API_URL, url)
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
