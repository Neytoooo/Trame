import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { colors } from '../theme/colors'
import {
  getKotaApiUrl,
  setKotaApiUrl,
  fetchLatestCloudTunnelUrl,
  getGeminiApiKey,
  setGeminiApiKey,
  DEFAULT_CONFIG,
  ACTIVE_TUNNEL_URL,
  SERVER_LOCAL_IP,
  SERVER_PORT,
} from '../config/env'
import {
  Server,
  Key,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Smartphone,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react-native'

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    // 1. Initialiser avec l'URL en mémoire
    getKotaApiUrl().then((initial) => {
      setApiUrl(initial)
      // 2. Synchroniser en direct avec le tout dernier tunnel cloud en arrière-plan
      fetchLatestCloudTunnelUrl().then((cloudUrl) => {
        if (cloudUrl && cloudUrl !== initial) {
          setApiUrl(cloudUrl)
        }
      })
    })
    getGeminiApiKey().then(setGeminiKey)
  }, [])

  const handleSave = async () => {
    await setKotaApiUrl(apiUrl.trim())
    await setGeminiApiKey(geminiKey.trim())
    Alert.alert('Succès', 'Paramètres enregistrés.')
  }

  const syncLatestTunnel = async () => {
    setIsSyncing(true)
    setTestResult(null)

    try {
      const latestUrl = await fetchLatestCloudTunnelUrl()
      if (latestUrl) {
        setApiUrl(latestUrl)
        await setKotaApiUrl(latestUrl)
        // Tester immédiatement la nouvelle adresse
        await testConnection(latestUrl)
      } else {
        Alert.alert(
          'Information',
          'Aucun nouveau tunnel actif reçu sur le relais. L\'adresse actuelle a été conservée.'
        )
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de contacter le relais de synchronisation cloud.')
    } finally {
      setIsSyncing(false)
    }
  }

  const testConnection = async (overrideTarget?: string) => {
    setIsTesting(true)
    setTestResult(null)

    const target = (overrideTarget || apiUrl.trim() || ACTIVE_TUNNEL_URL || DEFAULT_CONFIG.KOTA_API_URL).replace(/\/+$/, '')

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(`${target}/api/mobile/planning`, {
        signal: controller.signal,
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'Accept': 'application/json',
        },
      })
      clearTimeout(timeout)

      if (res.ok) {
        setTestResult({
          success: true,
          message: `Connexion réussie au serveur KOTA Web !\n(${target})`,
        })
        await setKotaApiUrl(target)
      } else {
        setTestResult({
          success: false,
          message: `Le serveur a répondu avec le statut HTTP ${res.status}`,
        })
      }
    } catch {
      // Auto-récupération intelligente : si l'adresse a échoué, on cherche si un nouveau tunnel a été généré
      try {
        const freshCloud = await fetchLatestCloudTunnelUrl()
        if (freshCloud && freshCloud !== target) {
          const retryRes = await fetch(`${freshCloud}/api/mobile/planning`, {
            headers: {
              'Bypass-Tunnel-Reminder': 'true',
              'Accept': 'application/json',
            },
          })
          if (retryRes.ok) {
            setApiUrl(freshCloud)
            await setKotaApiUrl(freshCloud)
            setTestResult({
              success: true,
              message: `Nouveau tunnel détecté et reconnecté automatiquement !\n(${freshCloud})`,
            })
            return
          }
        }
      } catch {}

      setTestResult({
        success: false,
        message: 'Serveur KOTA inaccessible. Cliquez sur "Récupérer le tunnel actif en direct" ci-dessus.',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const resetDefaults = async () => {
    const defUrl = ACTIVE_TUNNEL_URL || DEFAULT_CONFIG.KOTA_API_URL
    setApiUrl(defUrl)
    setGeminiKey(DEFAULT_CONFIG.GEMINI_API_KEY)
    await setKotaApiUrl(defUrl)
    await setGeminiApiKey(DEFAULT_CONFIG.GEMINI_API_KEY)
    setTestResult(null)
    Alert.alert('Réinitialisé', 'Valeurs par défaut restaurées avec le tunnel actif.')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* SECTION SERVEUR KOTA */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Server size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Serveur KOTA Web</Text>
            <Text style={styles.cardSub}>
              Synchronisation des devis, du dépôt et du planning en direct
            </Text>
          </View>
        </View>

        <Text style={styles.label}>URL du serveur KOTA</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder="https://...lhr.life"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.quickButtonsCol}>
          {/* BOUTON CLOUD AUTO-SYNC EN DIRECT */}
          <TouchableOpacity
            style={styles.syncCloudBtn}
            onPress={syncLatestTunnel}
            disabled={isSyncing}
            activeOpacity={0.8}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={colors.success} />
            ) : (
              <>
                <RefreshCw size={13} color={colors.success} />
                <Text style={styles.syncCloudBtnText}>
                  🔄 Récupérer le tunnel actif en direct
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tunnelBtn}
            onPress={() => setApiUrl(ACTIVE_TUNNEL_URL)}
            activeOpacity={0.8}
          >
            <Sparkles size={13} color={colors.white} />
            <Text style={styles.tunnelBtnText}>Appliquer Tunnel 5G ({ACTIVE_TUNNEL_URL.split('//')[1] || 'Actif'})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.wifiBtn}
            onPress={() => setApiUrl(`http://${SERVER_LOCAL_IP}:${SERVER_PORT}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.wifiBtnText}>Appliquer IP Wi-Fi Local ({SERVER_LOCAL_IP})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.wifiNoticeBox}>
          <Text style={styles.wifiNoticeText}>
            💡 Le bouton vert &quot;Récupérer le tunnel actif en direct&quot; met à jour automatiquement l&apos;adresse de votre serveur dès que votre PC génère un nouveau tunnel.
          </Text>
        </View>

        {testResult && (
          <View
            style={[
              styles.testResultBox,
              testResult.success ? styles.testSuccess : styles.testFail,
            ]}
          >
            {testResult.success ? (
              <CheckCircle2 size={16} color={colors.success} />
            ) : (
              <AlertTriangle size={16} color={colors.danger} />
            )}
            <Text
              style={[
                styles.testResultText,
                { color: testResult.success ? colors.success : colors.danger },
              ]}
            >
              {testResult.message}
            </Text>
          </View>
        )}

        <View style={styles.rowButtons}>
          <TouchableOpacity
            style={styles.testBtn}
            onPress={() => testConnection()}
            disabled={isTesting}
            activeOpacity={0.7}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color={colors.cyan} />
            ) : (
              <>
                <ShieldCheck size={14} color={colors.cyan} />
                <Text style={styles.testBtnText}>Tester la connexion</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION GEMINI VISION IA */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Sparkles size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Intelligence Artificielle</Text>
            <Text style={styles.cardSub}>
              Moteur Gemini 2.5 Flash pour lecture des notes manuscrites
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Clé API Google Gemini</Text>
        <TextInput
          style={styles.input}
          value={geminiKey}
          onChangeText={setGeminiKey}
          placeholder="AIzaSy..."
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* SECTION SUPABASE */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Database size={18} color={colors.cyan} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Base de données Supabase</Text>
            <Text style={styles.cardSub}>
              Tables multi-tenant KOTA (devis, chantiers, planning)
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Instance KOTA :</Text>
          <Text style={styles.infoVal}>yljsnkiewgsubimwatji.supabase.co</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Statut RLS :</Text>
          <Text style={[styles.infoVal, { color: colors.success }]}>Actif & Sécurisé</Text>
        </View>
      </View>

      {/* BOUTON RESET */}
      <TouchableOpacity
        style={styles.resetAllBtn}
        onPress={resetDefaults}
        activeOpacity={0.7}
      >
        <RotateCcw size={14} color={colors.textMuted} />
        <Text style={styles.resetAllText}>Restaurer les valeurs d'origine</Text>
      </TouchableOpacity>

      {/* FOOTER */}
      <View style={styles.appFooter}>
        <Smartphone size={16} color={colors.textMuted} />
        <Text style={styles.appFooterText}>KOTA Mobile SaaS v1.0.0 • Architecture BTP</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  cardSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.white,
    fontSize: 13,
    marginBottom: 12,
  },
  testResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  testSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  testFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  testResultText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  testBtnText: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  infoVal: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  resetAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  resetAllText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  appFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  appFooterText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  quickButtonsCol: {
    gap: 8,
    marginBottom: 12,
  },
  syncCloudBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  syncCloudBtnText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  tunnelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tunnelBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  wifiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 9,
    borderRadius: 10,
  },
  wifiBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  wifiNoticeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.cyan,
  },
  wifiNoticeText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
})
