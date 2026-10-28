# 📱 KOTA Mobile — Application Terrain BTP (React Native & Expo)

Application mobile compagnon officielle pour le SaaS **KOTA BTP**, conçue spécifiquement pour les artisans, chefs de chantiers et métreurs sur le terrain.

---

## 🚀 Fonctionnalités Clés

### 1. 📸 Devis Automatique par Photo IA (Notes Manuscrites)
- **Capture sur le terrain** : Prenez en photo vos relevés de cotes manuscrits, calepins de chantier, croquis ou bons de commande.
- **Vision Multimodale Gemini 2.5 Flash** : Déchiffrement automatique des écritures manuscrites, détection des surfaces ($m^2$, mètres linéaires, unités, forfaits), détection du client et du nom de chantier.
- **Matching Catalogue KOTA BTP** : Conversion automatique des tâches en lignes de devis professionnelles chiffrées avec TVA adaptée.
- **Synchronisation Directe avec KOTA Web** : Le devis et les lignes sont immédiatement créés dans votre base de données Supabase et consultables/éditables dans votre espace web KOTA (`/dashboard/devis/[id]/edit`).

### 2. 📅 Accès Intégral au Planning & Agenda
- **Vue par jour & semaine** : Navigation intuitive entre les jours avec compteurs de missions.
- **Détails des interventions** : Horaires, chantier, client, technicien assigné et consignes techniques.
- **Actions rapides 1-tap** :
  - 🗺️ **GPS / Itinéraire** : Ouvre directement Google Maps, Waze ou Apple Maps à l'adresse exacte du chantier.
  - 🔄 **Changement de statut en direct** : Basculez le statut (*Planifié* ➔ *En cours* ➔ *Terminé*) en un clic avec synchronisation immédiate.
  - ➕ **Création rapide d'interventions** sur le terrain.

### 3. 📋 Historique & Mode Hors-Ligne Résilient
- Consultation des devis récents avec statut, client et total HT.
- Fonctionnement hybride : si le réseau est faible sur un chantier, les interventions sont lues depuis le cache local sécurisé et synchronisées dès que la connexion revient.

---

## 🛠️ Stack Technique

- **Framework Mobile** : [React Native](https://reactnative.dev/) avec [Expo SDK 58](https://expo.dev/) (TypeScript)
- **IA Multimodale** : Google Gemini 2.5 Flash Vision (`@google/generative-ai`)
- **Backend & Données** : Supabase Multi-Tenant (`@supabase/supabase-js`) & API REST KOTA Next.js 16
- **Icônes & Design System** : Lucide React Native, charte graphique KOTA (Dark slate `#0B101B`, accents néon purple `#8B5CF6` et cyan `#06B6D4`)
- **Stockage Local & Cache** : `@react-native-async-storage/async-storage`

---

## 📲 Comment Lancer l'Application Mobile

### 1. Démarrer le serveur Expo :
```bash
cd Kota_Mobile
npm start
```

### 2. Tester sur votre smartphone (iOS ou Android) :
1. Installez l'application gratuite **Expo Go** depuis l'App Store (iOS) ou Google Play Store (Android).
2. Scannez le QR Code affiché dans votre terminal : l'application se charge instantanément sur votre téléphone sans compilation native !

### 3. Tester dans votre navigateur web :
Dans le terminal où Expo tourne, appuyez simplement sur la touche **`w`** pour lancer la version web mobile réactive.

---

## 🌐 Endpoints API KOTA Web Associés

L'application web KOTA intègre désormais les routes dédiées aux requêtes mobiles :
- `POST /api/mobile/devis/from-photo` : Analyse de l'image de notes manuscrites et insertion dans Supabase.
- `GET /api/mobile/planning` : Récupération des interventions du planning.
- `POST /api/mobile/planning` : Ajout d'une intervention depuis le mobile.
- `PATCH /api/mobile/planning` : Mise à jour du statut d'une intervention.
- `GET /api/mobile/devis` : Liste des devis synchronisés.
