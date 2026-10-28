# 🗺️ KOTA BTP SaaS — Cartographie des Liens, Pages & Architecture Multi-Tenant

Ce document répertorie l'intégralité des routes, liens visibles, liens cachés, endpoints d'API, ainsi que le fonctionnement du modèle **Multi-Tenant** et la création de nouvelles entreprises pour votre application.

---

## 📑 Sommaire
1. [Liens Publics & Authentification](#1-liens-publics--authentification)
2. [Liens du Dashboard Principaux (Pill Navbar)](#2-liens-du-dashboard-principaux-pill-navbar)
3. [Liens Contextuels & Sous-Pages ("Cachés")](#3-liens-contextuels--sous-pages-cachés)
4. [Endpoints API & Tâches Cron](#4-endpoints-api--tâches-cron)
5. [Comment un nouveau client crée son entreprise (Multi-Tenant SaaS)](#5-comment-un-nouveau-client-crée-son-entreprise-multi-tenant-saas)
6. [Plan d'implémentation de la page d'inscription (`/signup`)](#6-plan-dimplémentation-de-la-page-dinscription-signup)

---

## 1. Liens Publics & Authentification

| Route | Type | Description |
| :--- | :--- | :--- |
| `/` | **Page Publique** | **Page de connexion principale** (Formulaire email/mot de passe + Connexion Google OAuth). Grille de points architecturale interactive et logo KOTA. |
| `/auth/callback` | **Endpoint Auth** | Gère le retour OAuth (Google) et échange le code d'authentification contre une session utilisateur Supabase. |
| `/auth/signout` | **Endpoint Auth** | Déconnecte l'utilisateur en révoquant les cookies de session et redirige vers `/`. |

---

## 2. Liens du Dashboard Principaux (Pill Navbar)

Ces liens sont directement accessibles via la barre de navigation flottante supérieure :

| Route | Nom Navbar | Rôle requis | Description |
| :--- | :--- | :--- | :--- |
| `/dashboard` | **Dashboard** | Tous | Vue d'ensemble : Chiffre d'affaires, marges, chantiers en cours, relances urgentes et journal d'activité. |
| `/dashboard/chantiers` | **Chantiers** | Tous | Liste de tous les chantiers de l'entreprise avec statut, client, dates et budget. Bouton de création rapide. |
| `/dashboard/clients` | **Clients** | Tous | Répertoire des clients (Particuliers / Professionnels), coordonnées et historique des projets. |
| `/dashboard/devis` | **Devis** | Tous | Gestion des devis, suivi des statuts (Brouillon, Envoyé, Accepté, Refusé) et relances automatiques. |
| `/dashboard/factures` | **Factures** | Tous | Facturation, acomptes, situations de travaux et soldes avec suivi des règlements. |
| `/dashboard/planning` | **Planning** | Tous | Calendrier interactif hebdomadaire/mensuel des interventions de chantier. |
| `/dashboard/trello` | **Tâches** | Tous | Tableau Kanban interactif (À faire, En cours, Bloqué, Terminé) pour le suivi opérationnel. |
| `/dashboard/articles` | **Bibliothèque** | Tous | Catalogue des articles, matériaux et ouvrages BTP (prix HT, coût de revient, stock, TVA). |
| `/dashboard/equipe` | **Équipe** | Tous | **Organigramme hiérarchique réactif** de l'entreprise et suivi des performances des collaborateurs. |
| `/dashboard/utilisateurs` | **Utilisateurs** | **Admin uniquement** | Gestion de la liste blanche des emails autorisés, attribution des rôles et invitation de collaborateurs. |
| `/dashboard/annonces` | **Icône Cloche 🔔** | Tous | Centre de notifications d'entreprise et alertes de commandes automatiques. |
| `/dashboard/settings` | **Icône Rouage ⚙️** | Admin / Tous | Paramètres de l'entreprise (Nom, SIRET, logo, adresse, mentions légales de facturation). |

---

## 3. Liens Contextuels & Sous-Pages ("Cachés")

Ces pages ne figurent pas dans la barre de menu principale pour ne pas l'encombrer. Elles s'ouvrent dynamiquement depuis les tableaux ou via des boutons contextuels :

| Route | Accessible depuis | Description |
| :--- | :--- | :--- |
| `/dashboard/chantiers/[id]` | Clic sur une ligne de chantier | **Fiche détaillée du chantier** : Coordonnées du client, planning dédié, documents rattachés et équipe assignée. |
| `/dashboard/chantiers/[id]/suivi` | Bouton "Suivi financier" dans la fiche chantier | **Contrôle budgétaire avancé** : Dépenses réelles vs chiffrage initial, pointage des heures et rentabilité nette. |
| `/dashboard/devis/[id]/edit` | Clic sur "Modifier / Chiffrer" dans la liste des devis | **Éditeur de devis interactif** : Ajout d'ouvrages, sections, sous-totaux, calcul automatique des marges et remise. |
| `/dashboard/factures/[id]/edit` | Clic sur "Éditer facture" | **Éditeur de facturation** : Gestion des tranches de facturation (acompte, situation d'avancement, solde). |

---

## 4. Endpoints API & Tâches Cron

Ces URLs ne comportent pas d'interface visuelle et sont appelées par le code ou par des déclencheurs automatisés :

| Route | Méthode | Utilité |
| :--- | :--- | :--- |
| `/api/cron/relance-devis` | `GET` | Webhook de relance automatique (exécutable tous les matins via Vercel Cron ou cron externe pour relancer les devis en attente). |
| `/api/seed-pro-data` | `GET` | Route utilitaire de test : génère des données réalistes BTP (chantiers, clients, devis, factures). |
| `/api/seed-templates` | `GET` | Route utilitaire : injecte les modèles de devis types (Rénovation complète, Maçonnerie, Peinture, etc.). |

---

## 5. Comment un nouveau client crée son entreprise (Multi-Tenant SaaS)

### Le principe d'isolation :
Chaque table (`devis`, `factures`, `chantiers`, `clients`, `articles`, `authorized_users`, `company_settings`) possède une clé étrangère `company_id`. Les politiques de sécurité Supabase (**RLS - Row Level Security**) garantissent qu'un patron ou ses ouvriers ne peuvent lire et écrire **que** les lignes correspondant à leur `company_id`.

### Le flux actuel vs le flux SaaS public :
- **Actuellement** : La base est verrouillée par whitelist. Seul l'administrateur existant peut inviter des collaborateurs qui rejoignent son entreprise.
- **Pour accueillir des clients abonnés (SaaS)** : Un nouvel entrepreneur qui souscrit doit pouvoir créer son entreprise et son compte administrateur en totale autonomie.

---

## 6. Plan d'implémentation de la page d'inscription (`/signup`)

Pour que n'importe quel patron puisse s'inscrire et démarrer son entreprise :

### 1. La nouvelle page d'inscription (`app/signup/page.tsx` ou `/onboarding`)
Un formulaire moderne reprenant l'univers KOTA avec 2 étapes simples :
- **Étape 1 : Le Dirigeant**
  - Prénom, Nom
  - Email professionnel
  - Mot de passe
- **Étape 2 : L'Entreprise**
  - Nom de l'entreprise (ex: *Kuhn Maçonnerie générale*)
  - SIRET (optionnel à l'inscription)
  - Téléphone

### 2. L'Action Serveur (`registerNewCompanyAction`)
Lorsque le formulaire est validé :
1. Crée le compte dans Supabase Auth (`supabase.auth.signUp`).
2. Crée une nouvelle ligne dans `public.companies` :
   ```typescript
   {
       name: "Kuhn Maçonnerie",
       owner_id: newUser.id,
       email: "contact@kuhn-btp.fr"
   }
   ```
3. Ajoute automatiquement le dirigeant dans `public.authorized_users` avec :
   ```typescript
   {
       email: newUser.email,
       role: "admin",
       company_id: newCompany.id,
       status: "actif"
   }
   ```
4. Initialise `public.company_settings` rattaché à son `company_id`.
5. Connecte directement l'utilisateur et le redirige sur `/dashboard`.

---

*Document généré pour KOTA BTP SaaS — Conforme Next.js 16 (App Router) & Supabase Multi-Tenancy.*
