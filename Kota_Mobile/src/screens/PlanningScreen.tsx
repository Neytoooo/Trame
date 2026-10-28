import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native'
import { colors } from '../theme/colors'
import { Intervention, InterventionStatus } from '../types/planning'
import InterventionCard from '../components/InterventionCard'
import {
  fetchPlanningInterventions,
  updateInterventionStatus,
  createIntervention,
} from '../services/planningService'
import { Plus, Calendar, Clock, Check, X, HardHat, Building2, MapPin } from 'lucide-react-native'

interface PlanningScreenProps {
  onSyncRefresh?: (isOffline: boolean) => void
}

export default function PlanningScreen({ onSyncRefresh }: PlanningScreenProps) {
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [chantiers, setChantiers] = useState<Array<{ id: string; name: string; address: string; clientName: string }>>([])
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Champs de création d'intervention
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newChantier, setNewChantier] = useState('')
  const [newClient, setNewClient] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newStartTime, setNewStartTime] = useState('08:30')
  const [newEndTime, setNewEndTime] = useState('12:00')
  const [newNotes, setNewNotes] = useState('')

  const loadData = async (silent = false) => {
    if (!silent) setRefreshing(true)
    const { interventions: data, chantiers: chList, isOffline } = await fetchPlanningInterventions()
    setInterventions(data)
    if (chList && chList.length > 0) setChantiers(chList)
    if (!silent) setRefreshing(false)
    if (onSyncRefresh) onSyncRefresh(isOffline)
  }

  useEffect(() => {
    loadData(false)

    // Synchronisation automatique toutes les 10 secondes avec le planning KOTA Web
    const interval = setInterval(() => {
      loadData(true)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Génération des 7 prochains jours pour le sélecteur
  const daysList = useMemo(() => {
    const list = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' })
      const dayNum = d.getDate()
      const dateKey = d.toISOString().split('T')[0]
      list.push({
        offset: i,
        name: i === 0 ? "Aujourd'hui" : dayName.charAt(0).toUpperCase() + dayName.slice(1),
        dayNum,
        dateKey,
      })
    }
    return list
  }, [])

  const selectedDateKey = daysList[selectedDayOffset]?.dateKey

  // Filtrer les interventions selon le jour sélectionné
  const filteredInterventions = useMemo(() => {
    return interventions.filter((i) => i.date === selectedDateKey)
  }, [interventions, selectedDateKey])

  // Statistiques du jour
  const stats = useMemo(() => {
    const total = filteredInterventions.length
    const done = filteredInterventions.filter((i) => i.status === 'termine').length
    const inProgress = filteredInterventions.filter((i) => i.status === 'en_cours').length
    return { total, done, inProgress }
  }, [filteredInterventions])

  const handleStatusChange = async (id: string, newStatus: InterventionStatus) => {
    // Mise à jour optimiste immédiate dans l'UI
    setInterventions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    )
    await updateInterventionStatus(id, newStatus)
  }

  const openCreateModal = () => {
    setNewDate(selectedDateKey || new Date().toISOString().split('T')[0])
    setIsModalOpen(true)
  }

  const selectExistingChantier = (ch: { name: string; address: string; clientName: string }) => {
    setNewChantier(ch.name)
    setNewAddress(ch.address)
    setNewClient(ch.clientName)
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un intitulé de mission')
      return
    }

    const targetDate = newDate.trim() || selectedDateKey || new Date().toISOString().split('T')[0]

    const created = await createIntervention({
      title: newTitle.trim(),
      chantierName: newChantier.trim() || 'Chantier KOTA',
      clientName: newClient.trim() || 'Client',
      address: newAddress.trim() || '',
      technicien: 'Moi (Mobile)',
      zone: 'Île-de-France',
      date: targetDate,
      startTime: newStartTime,
      endTime: newEndTime,
      color: 'rose',
      status: 'planifie',
      notes: newNotes.trim() || '',
    })

    setInterventions((prev) => [created, ...prev])
    setIsModalOpen(false)
    setNewTitle('')
    setNewChantier('')
    setNewClient('')
    setNewAddress('')
    setNewNotes('')

    // Basculer automatiquement sur le jour de l'intervention créée pour la voir immédiatement
    const matchingOffset = daysList.findIndex(d => d.dateKey === targetDate)
    if (matchingOffset !== -1) {
      setSelectedDayOffset(matchingOffset)
    }
  }

  return (
    <View style={styles.container}>
      {/* Sélecteur horizontal de jours */}
      <View style={styles.daysScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysScroll}
        >
          {daysList.map((day) => {
            const isSelected = selectedDayOffset === day.offset
            return (
              <TouchableOpacity
                key={day.offset}
                style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                onPress={() => setSelectedDayOffset(day.offset)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.dayCardName, isSelected && styles.dayCardNameSelected]}
                >
                  {day.name}
                </Text>
                <Text
                  style={[styles.dayCardNum, isSelected && styles.dayCardNumSelected]}
                >
                  {day.dayNum}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Résumé & Bouton Nouveau */}
      <View style={styles.statsRow}>
        <View style={styles.statsInfo}>
          <Text style={styles.statsCount}>
            {stats.total} intervention{stats.total > 1 ? 's' : ''}
          </Text>
          <Text style={styles.statsSub}>
            {stats.done} terminée(s) • {stats.inProgress} en cours
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreateModal}
          activeOpacity={0.8}
        >
          <Plus size={16} color={colors.white} />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des interventions */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(false)}
            tintColor={colors.primary}
          />
        }
      >
        {filteredInterventions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune intervention ce jour</Text>
            <Text style={styles.emptySub}>
              Le planning est dégagé ou synchronisé depuis le bureau KOTA Web.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={openCreateModal}
            >
              <Plus size={14} color={colors.primary} />
              <Text style={styles.emptyAddText}>Programmer une mission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredInterventions.map((item) => (
            <InterventionCard
              key={item.id}
              intervention={item}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </ScrollView>

      {/* Modal Ajout Rapide avec Choix de Date */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <HardHat size={20} color={colors.primary} />
                <Text style={styles.modalTitle}>Nouvelle Intervention</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Intitulé */}
              <Text style={styles.inputLabel}>Intitulé de l'intervention *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Pose couvertines alu, Diagnostic, Lavage..."
                placeholderTextColor={colors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              {/* DATE SELECTION (Fonctionnalité demandée) */}
              <Text style={styles.inputLabel}>Date de l'intervention *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {daysList.map((d) => (
                  <TouchableOpacity
                    key={d.dateKey}
                    style={[
                      styles.dateChip,
                      newDate === d.dateKey && styles.dateChipSelected,
                    ]}
                    onPress={() => setNewDate(d.dateKey)}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        newDate === d.dateKey && styles.dateChipTextSelected,
                      ]}
                    >
                      {d.name} {d.dayNum}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.dateInputRow}>
                <Calendar size={14} color={colors.primary} />
                <TextInput
                  style={styles.dateInputText}
                  value={newDate}
                  onChangeText={setNewDate}
                  placeholder="Format: AAAA-MM-JJ (ex: 2026-10-28)"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Raccourcis chantiers existants */}
              {chantiers.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.inputSubLabel}>Chantiers fréquents :</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    {chantiers.map((ch) => (
                      <TouchableOpacity
                        key={ch.id}
                        style={[
                          styles.chantierChip,
                          newChantier === ch.name && styles.chantierChipSelected,
                        ]}
                        onPress={() => selectExistingChantier(ch)}
                      >
                        <Building2 size={11} color={newChantier === ch.name ? colors.white : colors.textMuted} />
                        <Text
                          style={[
                            styles.chantierChipText,
                            newChantier === ch.name && styles.chantierChipTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {ch.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Nom du chantier */}
              <Text style={styles.inputLabel}>Nom du Chantier</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: RESIDENCE PLEIN AIR"
                placeholderTextColor={colors.textMuted}
                value={newChantier}
                onChangeText={setNewChantier}
              />

              {/* Client */}
              <Text style={styles.inputLabel}>Client</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: FONCIA, Syndic LAMY..."
                placeholderTextColor={colors.textMuted}
                value={newClient}
                onChangeText={setNewClient}
              />

              {/* Adresse */}
              <Text style={styles.inputLabel}>Adresse de l'intervention</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 14 Rue de Conflans, 78700"
                placeholderTextColor={colors.textMuted}
                value={newAddress}
                onChangeText={setNewAddress}
              />

              {/* Horaires Début / Fin */}
              <View style={styles.timeInputsRow}>
                <View style={styles.timeInputCol}>
                  <Text style={styles.inputLabel}>Début</Text>
                  <TextInput
                    style={styles.input}
                    value={newStartTime}
                    onChangeText={setNewStartTime}
                    placeholder="08:30"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.timeInputCol}>
                  <Text style={styles.inputLabel}>Fin</Text>
                  <TextInput
                    style={styles.input}
                    value={newEndTime}
                    onChangeText={setNewEndTime}
                    placeholder="12:00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* Notes */}
              <Text style={styles.inputLabel}>Notes / Consignes particulières</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex: Prévoir nacelle, gardien présent pour accès loge..."
                placeholderTextColor={colors.textMuted}
                value={newNotes}
                onChangeText={setNewNotes}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Check size={16} color={colors.white} />
                <Text style={styles.submitButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  daysScrollWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  daysScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    minWidth: 64,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dayCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  dayCardName: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayCardNameSelected: {
    color: colors.white,
  },
  dayCardNum: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  dayCardNumSelected: {
    color: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  statsInfo: {},
  statsCount: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  statsSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
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
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  emptyAddText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputSubLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.white,
    fontSize: 14,
    marginBottom: 14,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  dateChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  dateChipTextSelected: {
    color: colors.white,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  dateInputText: {
    flex: 1,
    paddingVertical: 10,
    color: colors.white,
    fontSize: 13,
  },
  chantierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chantierChipSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderColor: colors.primary,
  },
  chantierChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 120,
  },
  chantierChipTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputCol: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
})
