import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { colors } from '../theme/colors'
import { ExtractedDevisData, ExtractedDevisItem, CreatedDevisSummary } from '../types/devis'
import { analyzePhotoAndCreateDevis } from '../services/aiDevisService'
import { getKotaApiUrl } from '../config/env'
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  CheckCircle,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  FileSpreadsheet,
  AlertCircle,
  FileCheck2,
  Wand2,
} from 'lucide-react-native'

interface PhotoDevisScreenProps {
  onDevisCreated?: (devis: CreatedDevisSummary) => void
}

export default function PhotoDevisScreen({ onDevisCreated }: PhotoDevisScreenProps) {
  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64: string } | null>(null)
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedDevisData | null>(null)
  const [createdSummary, setCreatedSummary] = useState<CreatedDevisSummary | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')

  // 1. Ouvrir l'appareil photo
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à l\'appareil photo est nécessaire pour photographier vos notes de chantier.'
        )
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets[0]?.base64) {
        setSelectedImage({
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
        })
        setExtractedData(null)
        setCreatedSummary(null)
      }
    } catch (err: any) {
      Alert.alert('Erreur appareil photo', err.message)
    }
  }

  // 2. Choisir une photo dans la galerie
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à la galerie photos est requis.'
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets[0]?.base64) {
        setSelectedImage({
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
        })
        setExtractedData(null)
        setCreatedSummary(null)
      }
    } catch (err: any) {
      Alert.alert('Erreur galerie', err.message)
    }
  }

  // Démo rapide : injecte une simulation de note manuscrite réaliste
  const loadDemoSample = () => {
    setAdditionalNotes(
      "Client M. Jean Bernard. Travaux à réaliser :\n- Préparation murs salon : 45 m² à 18 €/m²\n- Peinture acrylique veloutée 2 couches : 45 m² à 28 €/m²\n- Pose parquet chêne flottant : 28 m² à 42 €/m²\n- Remplacement tableau électrique 4 rangées : Forfait 1450 €"
    )
    Alert.alert(
      'Exemple injecté',
      'Des notes de chantier réalistes ont été ajoutées. Vous pouvez maintenant lancer l\'analyse IA sans photo si souhaité.'
    )
  }

  // 3. Lancer l'analyse IA via Gemini Vision & envoi vers KOTA Web
  const handleAnalyze = async () => {
    if (!selectedImage && !additionalNotes.trim()) {
      Alert.alert(
        'Image ou notes requises',
        'Veuillez prendre en photo vos notes de chantier ou saisir des notes dans le champ texte.'
      )
      return
    }

    setIsAnalyzing(true)
    setStatusMessage('Déchiffrage des notes manuscrites via Gemini Vision...')

    try {
      const dummyBase64 = selectedImage?.base64 || ''
      const res = await analyzePhotoAndCreateDevis(
        dummyBase64,
        'image/jpeg',
        additionalNotes
      )

      if (res.success && res.devis) {
        setCreatedSummary(res.devis)
        if (res.extracted) {
          setExtractedData(res.extracted)
        }
        if (onDevisCreated) {
          onDevisCreated(res.devis)
        }
      } else {
        Alert.alert(
          'Erreur d\'analyse',
          res.error || 'Impossible d\'extraire les informations du devis.'
        )
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Une erreur est survenue.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Ouvrir le devis sur KOTA Web
  const openOnWeb = async () => {
    if (!createdSummary?.webEditUrl) return
    const kotaApiUrl = await getKotaApiUrl()
    const url = `${kotaApiUrl}${createdSummary.webEditUrl}`
    Linking.openURL(url)
  }

  // Réinitialiser pour un nouveau devis
  const resetForm = () => {
    setSelectedImage(null)
    setExtractedData(null)
    setCreatedSummary(null)
    setAdditionalNotes('')
  }

  // Calcul du total HT en direct
  const computedTotalHT = React.useMemo(() => {
    if (!extractedData?.items) return createdSummary?.totalHT || 0
    return extractedData.items.reduce((acc, item) => {
      return acc + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
    }, 0)
  }, [extractedData, createdSummary])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* SUCCESS BANNER QUAND CRÉÉ ET SYNCHRONISÉ */}
      {createdSummary && (
        <View style={styles.successCard}>
          <View style={styles.successHeader}>
            <View style={styles.successIcon}>
              <CheckCircle size={22} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Devis Créé & Synchronisé !</Text>
              <Text style={styles.successSub}>
                Réf: {createdSummary.reference} • Directement dans votre KOTA Web
              </Text>
            </View>
          </View>

          <View style={styles.successDetails}>
            <View style={styles.successDetailCol}>
              <Text style={styles.successDetailLabel}>Client</Text>
              <Text style={styles.successDetailVal}>{createdSummary.clientName}</Text>
            </View>
            <View style={styles.successDetailCol}>
              <Text style={styles.successDetailLabel}>Total HT</Text>
              <Text style={styles.successDetailVal}>
                {createdSummary.totalHT.toLocaleString('fr-FR')} €
              </Text>
            </View>
            <View style={styles.successDetailCol}>
              <Text style={styles.successDetailLabel}>Lignes</Text>
              <Text style={styles.successDetailVal}>{createdSummary.itemsCount}</Text>
            </View>
          </View>

          <View style={styles.successActions}>
            <TouchableOpacity style={styles.webButton} onPress={openOnWeb}>
              <ExternalLink size={15} color={colors.white} />
              <Text style={styles.webButtonText}>Ouvrir dans KOTA Web</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
              <RefreshCw size={14} color={colors.textSecondary} />
              <Text style={styles.resetButtonText}>Nouveau devis</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ZONE PRISE DE PHOTO */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Camera size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Capture de Notes Manuscrites</Text>
            <Text style={styles.cardSub}>
              Photographiez vos prises de cotes, calepin ou relevé de terrain
            </Text>
          </View>
        </View>

        {/* Image Display */}
        {selectedImage ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => setSelectedImage(null)}
            >
              <Trash2 size={14} color={colors.white} />
              <Text style={styles.retakeBtnText}>Changer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.captureButtonsRow}>
            <TouchableOpacity
              style={styles.captureMainBtn}
              onPress={takePhoto}
              activeOpacity={0.8}
            >
              <Camera size={26} color={colors.white} />
              <Text style={styles.captureMainText}>Prendre une Photo</Text>
              <Text style={styles.captureSubText}>Appareil photo en direct</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureSecBtn}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <ImageIcon size={22} color={colors.primary} />
              <Text style={styles.captureSecText}>Galerie</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Champ Notes additionnelles */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            Précisions ou notes orales (optionnel) :
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: M. Jean Martin, 14 Rue Victor Hugo. Rénover le salon et pose de parquet chêne..."
            placeholderTextColor={colors.textMuted}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Simulation démo rapide */}
        {!selectedImage && !additionalNotes && (
          <TouchableOpacity
            style={styles.demoLink}
            onPress={loadDemoSample}
          >
            <Wand2 size={13} color={colors.cyan} />
            <Text style={styles.demoLinkText}>
              Tester avec un exemple de note manuscrite BTP
            </Text>
          </TouchableOpacity>
        )}

        {/* Action Button: Analyser & Générer */}
        <TouchableOpacity
          style={[
            styles.generateBtn,
            isAnalyzing && styles.generateBtnDisabled,
            (!selectedImage && !additionalNotes.trim()) && styles.generateBtnDisabled,
          ]}
          onPress={handleAnalyze}
          disabled={isAnalyzing || (!selectedImage && !additionalNotes.trim())}
          activeOpacity={0.85}
        >
          {isAnalyzing ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={styles.generateBtnText}>Analyse Gemini Vision en cours...</Text>
            </View>
          ) : (
            <View style={styles.loadingRow}>
              <Sparkles size={18} color={colors.white} />
              <Text style={styles.generateBtnText}>
                Générer Devis Automatique & KOTA Sync
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* APERÇU DES LIGNES EXTRAITES */}
      {extractedData && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleEmerald}>
              <FileSpreadsheet size={18} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Lignes de Chiffrage Extraites</Text>
              <Text style={styles.cardSub}>
                Chantier : {extractedData.project_name} • Client : {extractedData.client_name}
              </Text>
            </View>
          </View>

          {/* Liste des items */}
          <View style={styles.itemsList}>
            {extractedData.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemMain}>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                  <Text style={styles.itemDetails}>
                    {item.quantity} {item.unit} × {item.unit_price} € HT (TVA {item.tva}%)
                  </Text>
                </View>
                <View style={styles.itemPriceCol}>
                  <Text style={styles.itemTotalPrice}>
                    {((item.quantity || 0) * (item.unit_price || 0)).toLocaleString('fr-FR')} €
                  </Text>
                  <Text style={styles.itemHtLabel}>HT</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Total HT Footer */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Devis HT :</Text>
            <Text style={styles.totalValue}>
              {computedTotalHT.toLocaleString('fr-FR')} € HT
            </Text>
          </View>
        </View>
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
    paddingBottom: 40,
    gap: 16,
  },
  successCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 18,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  successIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  successSub: {
    color: colors.success,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  successDetails: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  successDetailCol: {
    alignItems: 'center',
  },
  successDetailLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  successDetailVal: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  successActions: {
    flexDirection: 'row',
    gap: 10,
  },
  webButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  webButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
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
  iconCircleEmerald: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
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
  imageWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  retakeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  retakeBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  captureButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  captureMainBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  captureMainText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  captureSubText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginTop: 2,
  },
  captureSecBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  captureSecText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  inputSection: {
    marginBottom: 14,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    color: colors.white,
    fontSize: 13,
    textAlignVertical: 'top',
    height: 75,
  },
  demoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingVertical: 4,
  },
  demoLinkText: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  generateBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  itemMain: {
    flex: 1,
    paddingRight: 10,
  },
  itemDesc: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  itemDetails: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  itemPriceCol: {
    alignItems: 'flex-end',
  },
  itemTotalPrice: {
    color: colors.cyan,
    fontSize: 14,
    fontWeight: '800',
  },
  itemHtLabel: {
    color: colors.textMuted,
    fontSize: 9,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '900',
  },
})
