import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { colors } from './src/theme/colors'
import Header from './src/components/Header'
import BottomNav, { TabType } from './src/components/BottomNav'
import PlanningScreen from './src/screens/PlanningScreen'
import PhotoDevisScreen from './src/screens/PhotoDevisScreen'
import DepotScreen from './src/screens/DepotScreen'
import DevisHistoryScreen from './src/screens/DevisHistoryScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import { CreatedDevisSummary } from './src/types/devis'

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('planning')
  const [isOffline, setIsOffline] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  const getHeaderMeta = () => {
    switch (currentTab) {
      case 'planning':
        return {
          title: 'Planning Chantier',
          subtitle: 'Agenda des interventions et missions du jour',
        }
      case 'depot':
        return {
          title: 'Dépôt Photos Chantier',
          subtitle: 'Prenez vos clichés terrain et reliez-les à un devis',
        }
      case 'photo':
        return {
          title: 'Devis Photo IA',
          subtitle: 'Photographiez vos notes pour générer un devis automatique',
        }
      case 'history':
        return {
          title: 'Devis Synchronisés',
          subtitle: 'Historique des devis envoyés sur KOTA Web',
        }
      case 'settings':
        return {
          title: 'Configuration',
          subtitle: 'Connexion KOTA Web, Supabase et Gemini IA',
        }
    }
  }

  const handleDevisCreated = (devis: CreatedDevisSummary) => {
    setNotificationCount((prev) => prev + 1)
  }

  const headerMeta = getHeaderMeta()

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" />

        {/* Top Header */}
        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          isOffline={isOffline}
          onRefresh={() => setIsOffline(false)}
        />

        {/* Main Content View */}
        <View style={styles.content}>
          {currentTab === 'planning' && (
            <PlanningScreen onSyncRefresh={(offline) => setIsOffline(offline)} />
          )}

          {currentTab === 'depot' && <DepotScreen />}

          {currentTab === 'photo' && (
            <PhotoDevisScreen onDevisCreated={handleDevisCreated} />
          )}

          {currentTab === 'history' && <DevisHistoryScreen />}

          {currentTab === 'settings' && <SettingsScreen />}
        </View>

        {/* Bottom Tab Bar */}
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
})
