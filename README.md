# 🍷 Amphore - Gestion de Stock SaaS

**Application SaaS moderne pour la gestion de stock de boissons et vins dans les restaurants et bars.**

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Firebase](https://img.shields.io/badge/Firebase-10.0-FFCA28?style=flat-square&logo=firebase)

## ✨ Fonctionnalités

### 🏪 **Dashboard Moderne**
- Vue synthétique des stocks en temps réel
- Statistiques détaillées par catégories
- Alertes de stock faible automatiques
- Interface inspirée de ChatSendUI en thème sombre

### ⚡ **Service Rapide**
- Décrémentation rapide du stock pendant le service
- Interface optimisée pour une utilisation mobile
- Validation des quantités en temps réel
- Mode batch pour appliquer plusieurs changements

### 📦 **Gestion Complète du Stock**
- CRUD complet pour tous les produits
- Catégorisation avancée (vins, spiritueux, bières, softs, etc.)
- Filtres et recherche multicritères
- Suivi des prix d'achat et de vente

### 🔐 **Authentification Sécurisée**
- Connexion Google intégrée
- Authentification email/password
- Gestion des rôles utilisateurs (admin, manager, staff)
- Profils utilisateurs personnalisables

### 📊 **Historique et Traçabilité**
- Historique complet des mouvements de stock
- Suivi des entrées, sorties, inventaires et pertes
- Exports possibles vers Excel/CSV
- Filtrage par période et type de mouvement

### 💡 **Fonctionnalités Avancées**
- Import de données Excel (vins et boissons)
- Interface responsive mobile-first
- Thème sombre par défaut
- Système d'alertes intelligent

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18.17+ 
- npm ou yarn
- Compte Firebase avec projet configuré

### Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd amphore
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Firebase**
   
   Le projet est déjà configuré avec Firebase. Les identifiants sont dans `src/lib/firebase.ts` :
   
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDx4gKFQtbDFqhZDpZ6gFEJ7JhPeSXPhEc",
  authDomain: "amphore-stock.firebaseapp.com",
  projectId: "amphore-stock",
  storageBucket: "amphore-stock.firebasestorage.app",
  messagingSenderId: "698312579475",
  appId: "1:698312579475:web:f650d691e1ed210e93b066",
  measurementId: "G-7LMYPEWM0T"
};
```

4. **Lancer l'application**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🏗️ Architecture Technique

### Stack Technologique

- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + ShadCN UI (thème sombre)
- **Backend:** Firebase (Authentication + Firestore)
- **Validation:** Zod + React Hook Form
- **Icons:** Lucide React

### Structure du Projet

```
src/
├── app/                          # App Router de Next.js
│   ├── (dashboard)/             # Groupe de routes protégées
│   │   ├── dashboard/           # Page dashboard principal
│   │   ├── service/             # Page service rapide
│   │   ├── stock/               # Gestion du stock
│   │   ├── produits/add/        # Ajout de produits
│   │   ├── historique/          # Historique des mouvements
│   │   ├── profil/              # Profil utilisateur
│   │   └── layout.tsx           # Layout avec sidebar
│   ├── login/                   # Page de connexion
│   ├── layout.tsx               # Layout racine
│   ├── page.tsx                 # Page d'accueil (redirection)
│   └── globals.css              # Styles globaux
├── components/
│   ├── ui/                      # Composants ShadCN UI
│   └── app-sidebar.tsx          # Sidebar principale
├── contexts/
│   └── auth-context.tsx         # Contexte d'authentification
├── lib/
│   ├── firebase.ts              # Configuration Firebase
│   └── utils.ts                 # Utilitaires
└── types/
    └── index.ts                 # Types TypeScript
```

### Architecture des Données

#### Types Principaux

```typescript
interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  subcategory?: string;
  quantity: number;
  unit: ProductUnit;
  prixAchat: number;
  prixVente: number;
  prixVerre?: number;
  seuilAlerte: number;
  fournisseur?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'manager' | 'staff';
  createdAt: Date;
  updatedAt: Date;
}
```

#### Collections Firestore

- **`users`** - Profils utilisateurs avec rôles
- **`products`** - Inventaire des produits
- **`stock_movements`** - Historique des mouvements
- **`categories`** - Configuration des catégories (optionnel)

## 🎨 Interface Utilisateur

### Design System

L'application utilise **ShadCN UI** avec un **thème sombre** par défaut, inspiré de l'interface **ChatSendUI** :

- **Palette de couleurs** : Tons sombres avec accents colorés
- **Typography** : Geist Sans & Geist Mono
- **Layout** : Sidebar fixe + contenu principal responsive
- **Composants** : Consistance via ShadCN UI

### Navigation

- **Sidebar principale** avec navigation par catégories
- **Dashboard** - Vue d'ensemble et statistiques
- **Service Rapide** - Gestion temps réel du stock
- **Stock** - Vue complète et CRUD produits
- **Historique** - Suivi des mouvements
- **Profil** - Gestion du compte utilisateur

## 🔐 Authentification et Sécurité

### Méthodes d'Authentification

1. **Google OAuth** - Connexion rapide via compte Google
2. **Email/Password** - Authentification classique Firebase

### Gestion des Rôles

- **Admin** : Accès complet + gestion des utilisateurs
- **Manager** : Gestion stock + ajout/modification produits
- **Staff** : Consultation + service rapide uniquement

### Protection des Routes

- Routes protégées via `AuthProvider` et `useAuth` hook
- Redirection automatique vers `/login` si non connecté
- Vérification des permissions selon le rôle

## 📱 Responsive Design

L'application est **mobile-first** et s'adapte à tous les écrans :

- **Mobile** (320px+) : Navigation simplifiée, actions touch-friendly
- **Tablet** (768px+) : Layout intermédiaire avec sidebar collapsible  
- **Desktop** (1024px+) : Interface complète avec sidebar fixe

## 🚀 Déploiement

### Développement

```bash
npm run dev     # Serveur de développement
npm run build   # Build de production
npm run start   # Serveur de production
npm run lint    # Vérification du code
```

### Production

L'application peut être déployée sur :

- **Vercel** (recommandé pour Next.js)
- **Netlify** 
- **Firebase Hosting**
- **Docker** (avec Dockerfile custom)

### Variables d'Environnement

Créer un `.env.local` pour la personnalisation :

```bash
# Optionnel - déjà configuré dans le code
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
# etc.
```

## 📄 Import de Données Excel

### Format Attendu

Le système peut importer des données depuis vos fichiers Excel existants. Format attendu :

#### Vins
```
Nom | Catégorie | Quantité | Unité | Prix Achat | Prix Vente | Prix Verre | Fournisseur
```

#### Boissons
```
Nom | Catégorie | Quantité | Unité | Prix Achat | Prix Vente | Seuil Alerte | Fournisseur
```

### Script d'Import

Un script d'import sera créé pour transférer vos données Excel vers Firestore automatiquement au premier lancement.

## 🛠️ Développement et Contribution

### Scripts de Développement

```bash
npm run dev        # Développement avec hot-reload
npm run build      # Build optimisé
npm run type-check # Vérification TypeScript
npm run lint       # ESLint + Prettier
```

### Conventions de Code

- **TypeScript** strict avec types explicites
- **ESLint** + **Prettier** pour la cohérence
- **Conventional Commits** pour les messages de commit
- **Composants** réutilisables et bien documentés

### Structure des Composants

```typescript
// Exemple de composant type
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

interface ComponentProps {
  title: string;
  // ... autres props
}

export default function Component({ title }: ComponentProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  // ... logique du composant
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* ... contenu */}
      </CardContent>
    </Card>
  );
}
```

## 📋 Roadmap et Évolutions

### Version Actuelle (v1.0)
- ✅ Dashboard et gestion de stock
- ✅ Authentification complète
- ✅ Service rapide
- ✅ Historique des mouvements
- ✅ Import de données Excel

### Prochaines Fonctionnalités (v1.1)
- 📊 Graphiques et analytics avancés
- 🔔 Notifications push en temps réel
- 📱 Application mobile native
- 🏪 Gestion multi-établissements
- 💳 Intégration avec systèmes de caisse

### Fonctionnalités Futures (v2.0)
- 🤖 Prédictions de stock par IA
- 📦 Gestion des fournisseurs et commandes
- 💰 Comptabilité intégrée
- 📈 Business intelligence avancée

## 🤝 Support et Contact

Pour toute question ou support technique :

- **Documentation** : Consultez ce README
- **Issues** : Créez une issue GitHub
- **Email** : contact@amphore-app.com

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**Amphore** - Simplifiez la gestion de votre stock de boissons et vins 🍷✨
