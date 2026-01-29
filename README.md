# 🏗️ Trame - L'ERP Bâtiment Nouvelle Génération

**Trame** est une application SaaS moderne conçue pour simplifier la gestion des artisans et PME du bâtiment. Elle se positionne comme une alternative rapide, esthétique et web-based aux logiciels traditionnels comme Sage Batigest.

![Trame Preview](https://via.placeholder.com/1200x600?text=Dashboard+Preview+Trame) **

## ✨ Fonctionnalités Principales

* **⚡ Gestion de Chantiers** : Suivi des affaires, statuts (En étude, En cours, Livré).
* **👥 CRM Clients** : Gestion des particuliers et professionnels avec annuaire centralisé.
* **📝 Devis & Chiffrage** : Éditeur type "Excel" connecté à une bibliothèque de prix.
* **🧱 Bibliothèque d'Ouvrages** : Base de données articles (Fournitures, Main d'œuvre) pour chiffrer vite.
* **💶 Facturation** : Conversion automatique Devis -> Facture, gestion des acomptes et suivis de paiement.
* **📄 Génération PDF** : Création automatique de documents professionnels.
* **🎨 UI Moderne** : Interface "Glassmorphism" sombre, pensée pour être agréable et rapide.

## 🛠️ Stack Technique

* **Framework** : [Next.js 15](https://nextjs.org/) (App Router)
* **Langage** : TypeScript
* **Base de données & Auth** : [Supabase](https://supabase.com/) (PostgreSQL)
* **Style** : [Tailwind CSS v4](https://tailwindcss.com/)
* **Icônes** : Lucide React
* **Emails** : [Resend](https://resend.com/)

---

## 🚀 Pré-requis (Comptes nécessaires)

Pour faire tourner ce projet en local, tu auras besoin de créer des comptes sur les services suivants (ils ont tous une offre gratuite) :

### 1. Supabase (Base de données & Auth)
C'est le cœur du backend.
* Crée un projet sur [supabase.com](https://supabase.com/).
* Tu auras besoin de l'URL du projet et de la clé publique (`anon`).
* Il faudra exécuter les scripts SQL (fournis dans le dossier `/sql` ou la documentation) pour créer les tables (`clients`, `chantiers`, `devis`, `articles`, etc.).

### 2. Google Cloud Console (Authentification)
Pour le bouton "Se connecter avec Google".
* Crée un projet sur [console.cloud.google.com](https://console.cloud.google.com/).
* Active l'API "Google OAuth".
* Configure l'écran de consentement (Type: Externe).
* Crée des identifiants OAuth 2.0.
* **Important** : Ajoute l'URL de callback de Supabase dans les redirections autorisées :
    `https://<TON_PROJET_ID>.supabase.co/auth/v1/callback`

### 3. Resend (Envoi d'emails)
Pour envoyer les factures par email.
* Crée un compte sur [resend.com](https://resend.com/).
* Génère une API Key.

---

## ⚙️ Installation

1.  **Cloner le dépôt :**
    ```bash
    git clone [https://github.com/votre-pseudo/trame.git](https://github.com/votre-pseudo/trame.git)
    cd trame
    ```

2.  **Installer les dépendances :**
    ```bash
    npm install
    # ou
    yarn install
    ```

3.  **Configurer les variables d'environnement :**
    Dupliquez le fichier `.env.local.example` (s'il existe) ou créez un fichier `.env.local` à la racine et remplissez-le avec vos clés :

    ```env
    # SUPABASE (Récupérer dans Project Settings > API)
    NEXT_PUBLIC_SUPABASE_URL=[https://votre-projet.supabase.co](https://votre-projet.supabase.co)
    NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-publique-longue

    # RESEND (Pour les emails - Optionnel en dev si simulé)
    RESEND_API_KEY=re_123456...
    ```

4.  **Initialiser la Base de Données :**
    Allez dans l'interface SQL de Supabase et exécutez les scripts de création de tables (Profiles, Clients, Chantiers, Articles, Devis, Factures).

5.  **Lancer le serveur de développement :**
    ```bash
    npm run dev
    ```

    Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 📂 Structure du Projet
