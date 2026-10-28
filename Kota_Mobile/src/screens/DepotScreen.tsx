import React, { useState, useEffect } from 'react'
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
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { colors } from '../theme/colors'
import { DepotPhoto, DepotPhotoCategory } from '../types/depot'
import {
  uploadPhotoToDepot,
  getRecentDevisReferences,
  getLocalDepotPhotos,
} from '../services/depotService'
import {
  Camera,
  Image as ImageIcon,
  CheckCircle,
  Trash2,
  Tag,
  FolderArchive,
  RefreshCw,
  Sparkles,
  Smartphone,
  ExternalLink,
  ChevronRight,
} from 'lucide-react-native'

const CATEGORIES: Array<{ key: DepotPhotoCategory; label: string; color: string }> = [
  { key: 'constat', label: 'Constat / État', color: colors.primary },
  { key: 'avant_travaux', label: 'Avant travaux', color: colors.warning },
  { key: 'en_cours', label: 'En cours', color: colors.cyan },
  { key: 'apres_travaux', label: 'Après travaux / Réception', color: colors.success },
  { key: 'releve_technique', label: 'Relevé technique', color: '#818CF8' },
  { key: 'autre', label: 'Autre', color: colors.textMuted },
]

export default function DepotScreen() {
  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64: string } | null>(null)
  const [devisRef, setDevisRef] = useState('')
  const [category, setCategory] = useState<DepotPhotoCategory>('constat')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [recentDevisList, setRecentDevisList] = useState<Array<{ reference: string; label: string }>>([])
  const [uploadedPhotos, setUploadedPhotos] = useState<DepotPhoto[]>([])
  const [lastUploaded, setLastUploaded] = useState<DepotPhoto | null>(null)

  // Charger les devis récents et l'historique local au démarrage
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [refs, photos] = await Promise.all([
      getRecentDevisReferences(),
      getLocalDepotPhotos(),
    ])
    setRecentDevisList(refs)
    setUploadedPhotos(photos)
  }

  // 1. Prendre une photo avec l'appareil photo
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à l\'appareil photo est nécessaire pour prendre des photos de chantier.'
        )
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      })

      if (!result.canceled && result.assets[0]?.base64) {
        setSelectedImage({
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
        })
        setLastUploaded(null)
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
        Alert.alert('Permission requise', 'L\'accès à la galerie est requis.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      })

      if (!result.canceled && result.assets[0]?.base64) {
        setSelectedImage({
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
        })
        setLastUploaded(null)
      }
    } catch (err: any) {
      Alert.alert('Erreur galerie', err.message)
    }
  }

  // 3. Envoyer la photo vers le Dépôt KOTA Web
  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('Photo requise', 'Veuillez prendre une photo ou en choisir une dans votre galerie.')
      return
    }

    setIsUploading(true)

    try {
      const res = await uploadPhotoToDepot({
        imageBase64: selectedImage.base64,
        devisReference: devisRef.trim() || undefined,
        category,
        title: title.trim() || (devisRef ? `Photo Devis ${devisRef.toUpperCase()}` : 'Photo de chantier'),
        notes: notes.trim() || undefined,
      })

      if (res.success && res.photo) {
        setLastUploaded(res.photo)
        setSelectedImage(null)
        setNotes('')
        setTitle('')
        loadData()

        Alert.alert(
          'Photo ajoutée au Dépôt !',
          devisRef
            ? `La photo a bien été enregistrée et rattachée au devis ${devisRef.toUpperCase()} sur KOTA Web.`
            : 'La photo a bien été enregistrée dans votre Dépôt KOTA Web.'
        )
      } else {
        Alert.alert('Erreur', res.error || 'Impossible d\'envoyer la photo.')
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Une erreur est survenue.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* SUCCESS BANNER DERNIÈRE PHOTO */}
      {lastUploaded && (
        <View style={styles.successBanner}>
          <CheckCircle size={20} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>Photo Enregistrée dans le Dépôt !</Text>
            <Text style={styles.successSub}>
              {lastUploaded.devis_reference
                ? `Reliée au devis ${lastUploaded.devis_reference} • Visible sur KOTA Web`
                : 'Visible dans l\'onglet Dépôt de votre application KOTA Web'}
            </Text>
          </View>
        </View>
      )}

      {/* ZONE PRISE DE VUE */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Camera size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Prendre une Photo de Chantier</Text>
            <Text style={styles.cardSub}>
              Les photos sont synchronisées en direct dans l&apos;onglet Dépôt
            </Text>
          </View>
        </View>

        {selectedImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.deleteBadge}
              onPress={() => setSelectedImage(null)}
              activeOpacity={0.8}
            >
              <Trash2 size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.photoButtonPrimary}
              onPress={takePhoto}
              activeOpacity={0.8}
            >
              <Camera size={20} color={colors.white} />
              <Text style={styles.buttonTextPrimary}>Appareil Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoButtonSecondary}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <ImageIcon size={20} color={colors.textSecondary} />
              <Text style={styles.buttonTextSecondary}>Galerie</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* RATTACHEMENT À UN DEVIS */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Tag size={18} color={colors.cyan} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Relier à un Devis</Text>
            <Text style={styles.cardSub}>
              Entrez le numéro du devis pour retrouver la photo en 1 clic
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Numéro / Réf du Devis (ex: DEV-MOB-47606)</Text>
        <TextInput
          style={styles.input}
          value={devisRef}
          onChangeText={setDevisRef}
          placeholder="ex: DEV-MOB-47606"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
        />

        {/* Suggestions rapides des devis récents */}
        {recentDevisList.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.subLabel}>Ou choisissez un devis récent :</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {recentDevisList.slice(0, 5).map((d) => {
                const isSelected = devisRef === d.reference
                return (
                  <TouchableOpacity
                    key={d.reference}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setDevisRef(isSelected ? '' : d.reference)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {d.reference}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        )}

        {/* CATÉGORIE DE PHOTO */}
        <Text style={[styles.label, { marginTop: 14 }]}>Type de Cliché</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.key
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.catButton,
                  isSelected && { borderColor: cat.color, backgroundColor: `${cat.color}20` },
                ]}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.catButtonText,
                    isSelected && { color: cat.color, fontWeight: '700' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* NOTES ET OBSERVATIONS */}
        <Text style={[styles.label, { marginTop: 14 }]}>Observations / Cotes (Optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Détails du relevé, état des murs, fissure constatée..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        {/* BOUTON ENVOI */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedImage || isUploading) && styles.submitButtonDisabled,
          ]}
          onPress={handleUpload}
          disabled={!selectedImage || isUploading}
          activeOpacity={0.8}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <FolderArchive size={18} color={colors.white} />
              <Text style={styles.submitButtonText}>
                {devisRef
                  ? `Envoyer au Dépôt (Devis ${devisRef.toUpperCase()})`
                  : 'Envoyer au Dépôt KOTA'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* GALERIE DES DERNIÈRES PHOTOS ENVOYÉES */}
      {uploadedPhotos.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <FolderArchive size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Dernières Photos Envoyées</Text>
              <Text style={styles.cardSub}>
                {uploadedPhotos.length} photo{uploadedPhotos.length > 1 ? 's' : ''} synchronisée{uploadedPhotos.length > 1 ? 's' : ''} au Dépôt
              </Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
            {uploadedPhotos.slice(0, 8).map((photo) => (
              <View key={photo.id} style={styles.galleryItem}>
                <Image source={{ uri: photo.image_url }} style={styles.galleryThumb} />
                {photo.devis_reference && (
                  <View style={styles.galleryBadge}>
                    <Text style={styles.galleryBadgeText}>{photo.devis_reference}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
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
    gap: 14,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  successSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonTextPrimary: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  photoButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceLight,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonTextSecondary: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  previewContainer: {
    position: 'relative',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deleteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    padding: 8,
    borderRadius: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  chipSelected: {
    backgroundColor: `${colors.primary}30`,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catButtonText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  galleryScroll: {
    flexDirection: 'row',
  },
  galleryItem: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingVertical: 1,
    alignItems: 'center',
  },
  galleryBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.white,
  },
})
