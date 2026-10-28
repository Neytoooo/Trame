import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors } from '../theme/colors'
import { Sparkles, Wifi, WifiOff } from 'lucide-react-native'

interface HeaderProps {
  title: string
  subtitle?: string
  isOffline?: boolean
  onRefresh?: () => void
}

export default function Header({ title, subtitle, isOffline = false, onRefresh }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Logo KOTA */}
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>K</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>KOTA</Text>
            <Text style={styles.brandSub}>MOBILE BTP</Text>
          </View>
        </View>

        {/* Sync Status Badge */}
        <TouchableOpacity
          style={[styles.syncBadge, isOffline ? styles.syncBadgeOffline : styles.syncBadgeOnline]}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          {isOffline ? (
            <WifiOff size={12} color={colors.warning} />
          ) : (
            <Wifi size={12} color={colors.success} />
          )}
          <Text
            style={[
              styles.syncText,
              { color: isOffline ? colors.warning : colors.success },
            ]}
          >
            {isOffline ? 'Mode Hors-Ligne' : 'KOTA Web Connecté'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: -1,
  },
  brandTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandSub: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  syncBadgeOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  syncBadgeOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  syncText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  titleContainer: {
    marginTop: 2,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
})
