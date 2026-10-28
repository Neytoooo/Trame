import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native'
import { colors } from '../theme/colors'
import { Intervention, InterventionStatus } from '../types/planning'
import {
  Clock,
  MapPin,
  Building,
  User,
  Navigation,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
} from 'lucide-react-native'

interface InterventionCardProps {
  intervention: Intervention
  onStatusChange: (id: string, newStatus: InterventionStatus) => void
}

export default function InterventionCard({
  intervention,
  onStatusChange,
}: InterventionCardProps) {
  const openGPS = () => {
    if (!intervention.address) return
    const encoded = encodeURIComponent(intervention.address)
    const url = Platform.select({
      ios: `maps:0,0?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    })
    Linking.openURL(url || `https://www.google.com/maps/search/?api=1&query=${encoded}`)
  }

  const cycleStatus = () => {
    if (intervention.status === 'planifie') {
      onStatusChange(intervention.id, 'en_cours')
    } else if (intervention.status === 'en_cours') {
      onStatusChange(intervention.id, 'termine')
    } else {
      onStatusChange(intervention.id, 'planifie')
    }
  }

  const getStatusMeta = (status: InterventionStatus) => {
    switch (status) {
      case 'planifie':
        return {
          label: 'Planifié',
          color: colors.statusPlanifie,
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.25)',
          icon: Clock,
        }
      case 'en_cours':
        return {
          label: 'En cours',
          color: colors.statusEnCours,
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.25)',
          icon: PlayCircle,
        }
      case 'termine':
        return {
          label: 'Terminé',
          color: colors.statusTermine,
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.25)',
          icon: CheckCircle2,
        }
    }
  }

  const statusMeta = getStatusMeta(intervention.status)
  const StatusIcon = statusMeta.icon

  return (
    <View style={styles.card}>
      {/* Top Header: Time Slot & Status Pill */}
      <View style={styles.headerRow}>
        <View style={styles.timeBadge}>
          <Clock size={13} color={colors.primary} />
          <Text style={styles.timeText}>
            {intervention.startTime} - {intervention.endTime}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.statusPill,
            { backgroundColor: statusMeta.bg, borderColor: statusMeta.border },
          ]}
          onPress={cycleStatus}
          activeOpacity={0.7}
        >
          <StatusIcon size={12} color={statusMeta.color} />
          <Text style={[styles.statusText, { color: statusMeta.color }]}>
            {statusMeta.label}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>{intervention.title}</Text>

      {/* Chantier & Client */}
      <View style={styles.metaRow}>
        <Building size={14} color={colors.textSecondary} />
        <Text style={styles.chantierName} numberOfLines={1}>
          {intervention.chantierName}
        </Text>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.clientName} numberOfLines={1}>
          {intervention.clientName}
        </Text>
      </View>

      {/* Address & GPS Action */}
      {intervention.address ? (
        <View style={styles.addressContainer}>
          <View style={styles.addressLeft}>
            <MapPin size={14} color={colors.textMuted} />
            <Text style={styles.addressText} numberOfLines={2}>
              {intervention.address}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.gpsButton}
            onPress={openGPS}
            activeOpacity={0.7}
          >
            <Navigation size={13} color={colors.cyan} />
            <Text style={styles.gpsButtonText}>GPS</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Notes */}
      {intervention.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesText}>{intervention.notes}</Text>
        </View>
      ) : null}

      {/* Footer: Technicien */}
      <View style={styles.footerRow}>
        <View style={styles.techWrapper}>
          <User size={12} color={colors.textMuted} />
          <Text style={styles.techText}>{intervention.technicien}</Text>
        </View>
        <TouchableOpacity onPress={cycleStatus} style={styles.toggleHint}>
          <Text style={styles.toggleHintText}>Toucher statut pour changer ↻</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  timeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  chantierName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  bullet: {
    color: colors.textMuted,
  },
  clientName: {
    color: colors.textSecondary,
    fontSize: 12,
    flexShrink: 1,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  addressText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  gpsButtonText: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: '700',
  },
  notesBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 10,
  },
  notesText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
    marginTop: 2,
  },
  techWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  techText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  toggleHint: {
    paddingVertical: 2,
  },
  toggleHintText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
})
