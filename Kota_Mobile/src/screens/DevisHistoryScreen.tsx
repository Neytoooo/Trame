import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native'
import { colors } from '../theme/colors'
import { CreatedDevisSummary } from '../types/devis'
import { getKotaApiUrl } from '../config/env'
import { supabase } from '../config/supabase'
import {
  FileText,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
} from 'lucide-react-native'

export default function DevisHistoryScreen() {
  const [devisList, setDevisList] = useState<CreatedDevisSummary[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDevis = async () => {
    setLoading(true)
    const kotaApiUrl = await getKotaApiUrl()

    // 1. Tenter l'appel API KOTA Web
    try {
      const res = await fetch(`${kotaApiUrl}/api/mobile/devis`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.devis)) {
          setDevisList(data.devis)
          setLoading(false)
          return
        }
      }
    } catch {}

    // 2. Fallback Supabase direct
    try {
      const { data } = await supabase
        .from('devis')
        .select(`
          id,
          reference,
          name,
          total_ht,
          status,
          created_at,
          chantiers ( name, clients ( name ) )
        `)
        .order('created_at', { ascending: false })
        .limit(15)

      if (data && data.length > 0) {
        const formatted: CreatedDevisSummary[] = data.map((d: any) => ({
          id: d.id,
          reference: d.reference || d.id.slice(0, 8),
          projectName: d.chantiers?.name || d.name || 'Projet',
          clientName: d.chantiers?.clients?.name || 'Client',
          totalHT: d.total_ht || 0,
          itemsCount: 0,
          webEditUrl: `/dashboard/devis/${d.id}/edit`,
          status: d.status || 'brouillon',
          created_at: d.created_at,
        }))
        setDevisList(formatted)
      }
    } catch {}

    setLoading(false)
  }

  useEffect(() => {
    fetchDevis()
  }, [])

  const openWebDevis = async (urlSuffix: string) => {
    const kotaApiUrl = await getKotaApiUrl()
    Linking.openURL(`${kotaApiUrl}${urlSuffix}`)
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={fetchDevis}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>Devis KOTA Synchronisés</Text>
        <Text style={styles.headerSub}>
          Les devis générés depuis le mobile sont immédiatement disponibles sur KOTA Web.
        </Text>
      </View>

      {devisList.length === 0 ? (
        <View style={styles.emptyBox}>
          <FileText size={36} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Aucun devis enregistré</Text>
          <Text style={styles.emptySub}>
            Utilisez l'onglet &quot;Devis Photo&quot; pour photographier une prise de cote
            et générer votre premier devis automatique.
          </Text>
        </View>
      ) : (
        devisList.map((item) => (
          <View key={item.id} style={styles.devisCard}>
            <View style={styles.cardTop}>
              <View style={styles.refBadge}>
                <Text style={styles.refText}>{item.reference}</Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {item.status ? item.status.toUpperCase() : 'BROUILLON'}
                </Text>
              </View>
            </View>

            <Text style={styles.projectTitle}>{item.projectName}</Text>

            <View style={styles.metaRow}>
              <User size={13} color={colors.textMuted} />
              <Text style={styles.clientName}>{item.clientName}</Text>
            </View>

            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.totalLabel}>Montant HT</Text>
                <Text style={styles.totalValue}>
                  {item.totalHT.toLocaleString('fr-FR')} € HT
                </Text>
              </View>

              <TouchableOpacity
                style={styles.openBtn}
                onPress={() => openWebDevis(item.webEditUrl || `/dashboard/devis/${item.id}/edit`)}
                activeOpacity={0.7}
              >
                <Text style={styles.openBtnText}>Éditer sur Web</Text>
                <ExternalLink size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
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
    paddingBottom: 32,
    gap: 12,
  },
  headerInfo: {
    marginBottom: 8,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
  },
  emptySub: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  devisCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  statusBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  projectTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  clientName: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  totalValue: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  openBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
})
