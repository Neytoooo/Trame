import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { colors } from '../theme/colors'
import { Calendar, Camera, FileText, Settings, Sparkles, FolderArchive } from 'lucide-react-native'

export type TabType = 'planning' | 'depot' | 'photo' | 'history' | 'settings'

interface BottomNavProps {
  currentTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  return (
    <View style={styles.container}>
      {/* Tab: Planning */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabChange('planning')}
        activeOpacity={0.7}
      >
        <Calendar
          size={20}
          color={currentTab === 'planning' ? colors.primary : colors.textMuted}
        />
        <Text
          style={[
            styles.tabText,
            { color: currentTab === 'planning' ? colors.white : colors.textMuted },
          ]}
        >
          Planning
        </Text>
      </TouchableOpacity>

      {/* Tab: Dépôt Photos */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabChange('depot')}
        activeOpacity={0.7}
      >
        <FolderArchive
          size={20}
          color={currentTab === 'depot' ? colors.primary : colors.textMuted}
        />
        <Text
          style={[
            styles.tabText,
            { color: currentTab === 'depot' ? colors.white : colors.textMuted },
          ]}
        >
          Dépôt
        </Text>
      </TouchableOpacity>

      {/* Tab: Photo Devis IA (Center Hero Action) */}
      <TouchableOpacity
        style={styles.heroButtonWrapper}
        onPress={() => onTabChange('photo')}
        activeOpacity={0.85}
      >
        <View
          style={[
            styles.heroButton,
            currentTab === 'photo' && styles.heroButtonActive,
          ]}
        >
          <Camera size={20} color={colors.white} />
          <View style={styles.heroBadge}>
            <Sparkles size={9} color={colors.primary} />
          </View>
        </View>
        <Text
          style={[
            styles.tabText,
            styles.heroText,
            { color: currentTab === 'photo' ? colors.primary : colors.textSecondary },
          ]}
        >
          Devis IA
        </Text>
      </TouchableOpacity>

      {/* Tab: Historique Devis */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabChange('history')}
        activeOpacity={0.7}
      >
        <FileText
          size={20}
          color={currentTab === 'history' ? colors.primary : colors.textMuted}
        />
        <Text
          style={[
            styles.tabText,
            { color: currentTab === 'history' ? colors.white : colors.textMuted },
          ]}
        >
          Devis
        </Text>
      </TouchableOpacity>

      {/* Tab: Settings */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabChange('settings')}
        activeOpacity={0.7}
      >
        <Settings
          size={20}
          color={currentTab === 'settings' ? colors.primary : colors.textMuted}
        />
        <Text
          style={[
            styles.tabText,
            { color: currentTab === 'settings' ? colors.white : colors.textMuted },
          ]}
        >
          Réglages
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 54,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  heroButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    minWidth: 58,
  },
  heroButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  heroButtonActive: {
    backgroundColor: colors.primaryHover,
    transform: [{ scale: 1.05 }],
  },
  heroBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    marginTop: 3,
    fontWeight: '700',
  },
})
