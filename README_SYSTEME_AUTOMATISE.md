# 🧠 Système Automatisé de Gestion des Fichiers de Stock

## 📋 Vue d'ensemble

Ce système SaaS complet permet la gestion automatisée des fichiers de stock avec intelligence artificielle, selon le schéma technique suivant :

```
UTILISATEUR
     │
     ▼
[ Interface Web SaaS ]
 (Drag & Drop / Upload)
     │
     ▼
[ Webhook N8N (Fichier Upload) ]
     │
     ▼
[ Détection Type de Fichier ]
 (.xlsx / .csv / .pdf / .txt / .jpg)
     │
     ├──> [ Convertisseur XLS/CSV → JSON ]
     │
     ├──> [ OCR (PDF/Image) → Texte brut ]
     │
     └──> [ Extraction Texte (TXT/Word) ]
     │
     ▼
[ Envoi vers IA (OpenAI / Claude) ]
   "Structure-moi ce fichier de stock"
     │
     ▼
[ Réponse IA en JSON structuré ]
     │
     ▼
[ Nettoyage / Mapping des données ]
     │
     ▼
[ Enregistrement dans Firestore ]
     │
     └──> [ Stock utilisateur dynamique ]
               (modif / suppr / ajout)
     ▼
[ Timeline des actions (historique) ]
     │
     ▼
[ Interface de gestion visuelle ]
 (Filtrage, scan code-barre, export, etc.)
```

## 🏗️ Architecture Technique

### Composants Principaux

| Composant | Technologie | Objectif |
|-----------|-------------|----------|
| **Frontend App** | React + Tailwind | Interface utilisateur moderne avec drag & drop |
| **Webhook N8N** | n8n webhook node | Point d'entrée pour les fichiers utilisateurs |
| **Détection de format** | Node IF dans n8n | Redirige vers le bon pipeline |
| **Parsing Excel/CSV** | Node Spreadsheet File | Convertit en JSON brut |
| **OCR** | Tesseract.js ou API Google Vision | Pour les PDF, images, scans |
| **Parsing TXT / PDF** | Node "Read Binary File" + regex | Lecture brute et filtrage |
| **IA (OpenAI)** | GPT-4 via API key dans n8n | Génère un JSON structuré de l'inventaire |
| **Nettoyage / mapping** | Node Function dans n8n | Adapter le format pour Firestore |
| **Sauvegarde Firestore** | Node HTTP Request vers Firebase REST API | Stocke les données de l'utilisateur |
| **Gestion temps réel** | Firestore (realtime DB) | Permet mise à jour en live dans la page |
| **Timeline historique** | Collection "mouvements" dans Firestore | Historique des actions (ajout, suppr, modif) |
| **Scan code-barre mobile** | QuaggaJS ou Web Barcode API | Ajout rapide via scan dans interface mobile |
| **Export / Intégration externe** | n8n + Node Google Sheets ou CSV Export | Envoie des rapports de stock automatisés |

## 🚀 Installation et Configuration

### Prérequis

```bash
# Dépendances système
Node.js 18+
npm ou yarn
Firebase CLI
n8n (optionnel pour l'automatisation)

# Variables d'environnement
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
FIREBASE_PROJECT_ID=your-project-id
OPENAI_API_KEY=your-openai-key
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/stock-upload
```

### Installation

```bash
# Cloner le projet
git clone https://github.com/your-username/stock-management-saas.git
cd stock-management-saas

# Installer les dépendances
npm install

# Configuration Firebase
firebase login
firebase init

# Démarrer en développement
npm run dev
```

## 📁 Structure des Fichiers

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── stock/
│   │   │   └── page.tsx              # Page principale de gestion
│   │   └── import-ai/
│   │       └── page.tsx              # Interface d'import IA
│   └── api/
│       ├── webhook/
│       │   └── upload/
│       │       └── route.ts          # Endpoint webhook N8N
│       └── gemini/
│           └── route.ts              # API IA Gemini
├── components/
│   ├── file-upload-zone.tsx          # Zone de drop moderne
│   ├── timeline-actions.tsx          # Timeline des actions
│   └── barcode-scanner.tsx           # Scanner code-barres
├── lib/
│   ├── importAIService.ts            # Service d'import IA
│   └── fileProcessor.ts              # Traitement des fichiers
└── types/
    └── index.ts                      # Types TypeScript
```

## 🔧 Configuration N8N

### Workflow Automatisé

Le fichier `n8n-workflow-config.json` contient la configuration complète du workflow N8N :

1. **Webhook Trigger** : Point d'entrée pour les fichiers
2. **File Type Router** : Détection et routage selon le type
3. **Readers** : CSV, Excel, PDF selon le type détecté
4. **Data Normalizer** : Normalisation des données extraites
5. **AI Processor** : Traitement IA via API Gemini
6. **Firestore Saver** : Sauvegarde dans la base de données
7. **Response** : Réponse au webhook

### Déploiement N8N

```bash
# Installer N8N
npm install -g n8n

# Démarrer N8N
n8n start

# Importer le workflow
# Copier le contenu de n8n-workflow-config.json dans l'interface N8N
```

## 🎯 Fonctionnalités Principales

### 1. Import IA Intelligent

- **Support multi-format** : Excel, CSV, PDF, images, TXT
- **OCR automatique** : Extraction de texte depuis PDF/images
- **Analyse IA** : Structuration automatique des données
- **Validation** : Détection de doublons et incohérences
- **Import automatique** : Mode confiance élevée pour import direct

### 2. Scanner de Code-barres

- **Scan automatique** : Utilisation de la caméra mobile
- **Saisie manuelle** : Fallback pour codes non détectés
- **Recherche produit** : Intégration avec la base de données
- **Historique** : Suivi des scans effectués

### 3. Timeline des Actions

- **Historique complet** : Toutes les actions utilisateur
- **Filtres avancés** : Par type, date, utilisateur
- **Statistiques** : Métriques d'utilisation
- **Export** : Génération de rapports

### 4. Interface Moderne

- **Drag & Drop** : Upload intuitif de fichiers
- **Progress bars** : Suivi en temps réel
- **Notifications** : Feedback utilisateur
- **Responsive** : Optimisé mobile/desktop

## 🔌 API Endpoints

### Webhook Upload
```http
POST /api/webhook/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "files": [File],
  "metadata": {
    "minConfidence": 80,
    "autoImport": true
  }
}
```

### IA Processing
```http
POST /api/gemini
Content-Type: application/json

{
  "prompt": "string",
  "data": "object",
  "userId": "string",
  "action": "import_parse"
}
```

## 📊 Base de Données Firestore

### Collections

```javascript
// stocks - Produits en stock
{
  id: "string",
  nom: "string",
  categorie: "vins-rouge|vins-blanc|spiritueux|...",
  quantite: number,
  unite: "bouteille|litre|cl",
  prixAchat: number,
  prixVente: number,
  fournisseur: "string",
  seuilAlerte: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// import-history - Historique des imports
{
  id: "string",
  timestamp: Timestamp,
  userId: "string",
  userEmail: "string",
  fileNames: ["string"],
  productsCount: number,
  success: boolean,
  addedCount: number,
  updatedCount: number,
  aiAnalysisLog: "string"
}

// timeline-actions - Actions utilisateur
{
  id: "string",
  timestamp: Timestamp,
  userId: "string",
  actionType: "import|export|create|update|delete",
  entityType: "product|category|supplier",
  description: "string",
  metadata: object,
  success: boolean
}
```

## 🎨 Interface Utilisateur

### Composants Principaux

1. **FileUploadZone** : Zone de drop moderne avec validation
2. **TimelineActions** : Affichage chronologique des actions
3. **BarcodeScanner** : Scanner de code-barres intégré
4. **StockPage** : Interface principale de gestion

### UX/UI Features

- ✅ **Message de confirmation** dès que l'IA a compris le fichier
- ✅ **Option de correction manuelle** avant enregistrement définitif
- ✅ **Alertes automatiques** si doublons ou incohérences
- ✅ **Progress bar et étapes visuelles** quand l'upload se transforme en stock

## 🔒 Sécurité

### Authentification
- Firebase Auth pour l'authentification utilisateur
- Tokens JWT pour les API calls
- Règles Firestore pour la sécurité des données

### Validation
- Validation des types de fichiers
- Limitation de taille (10MB par fichier)
- Sanitisation des données avant import
- Détection de contenu malveillant

## 📈 Monitoring et Analytics

### Métriques Suivies
- Nombre d'imports par jour/semaine
- Taux de succès des imports IA
- Temps de traitement moyen
- Types de fichiers les plus utilisés
- Erreurs fréquentes

### Logs
```javascript
// Exemple de log d'import
{
  timestamp: "2024-01-15T10:30:00Z",
  userId: "user123",
  action: "import_ia",
  files: ["facture.pdf", "stock.xlsx"],
  productsCount: 25,
  success: true,
  processingTime: 15000,
  aiConfidence: 87
}
```

## 🚀 Déploiement

### Production
```bash
# Build de production
npm run build

# Déploiement Vercel
vercel --prod

# Configuration Firebase
firebase deploy
```

### Variables d'environnement
```env
# Production
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
OPENAI_API_KEY=your-openai-key
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/stock-upload
```

## 🔄 Intégrations

### N8N Automations
- Import automatique depuis Google Drive
- Export vers Google Sheets
- Notifications Slack/Discord
- Rapports automatiques par email

### APIs Externes
- Google Vision API (OCR)
- OpenAI GPT-4 (Analyse IA)
- Google Sheets API (Export)
- Email API (Notifications)

## 🐛 Dépannage

### Problèmes Courants

1. **Erreur OCR** : Vérifier les permissions caméra
2. **Import échoué** : Vérifier le format du fichier
3. **IA non responsive** : Vérifier la clé API OpenAI
4. **Webhook timeout** : Augmenter le timeout N8N

### Logs de Debug
```bash
# Activer les logs détaillés
DEBUG=* npm run dev

# Vérifier les logs Firebase
firebase functions:log

# Tester le webhook
curl -X POST https://your-domain.com/api/webhook/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.csv"
```

## 📚 Documentation API

### Endpoints Principaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/webhook/upload` | POST | Webhook pour N8N |
| `/api/gemini` | POST | Traitement IA |
| `/api/stocks` | GET | Liste des stocks |
| `/api/import-history` | GET | Historique imports |

### Exemples d'Usage

```javascript
// Import de fichier via webhook
const formData = new FormData();
formData.append('files', file);
formData.append('metadata', JSON.stringify({
  minConfidence: 80,
  autoImport: true
}));

fetch('/api/webhook/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

## 🤝 Contribution

### Guidelines
1. Fork le projet
2. Créer une branche feature
3. Commit avec messages clairs
4. Pull request avec description détaillée

### Tests
```bash
# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration

# Tests E2E
npm run test:e2e
```

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## 📞 Support

- **Documentation** : [Wiki du projet](https://github.com/your-username/stock-management-saas/wiki)
- **Issues** : [GitHub Issues](https://github.com/your-username/stock-management-saas/issues)
- **Discord** : [Serveur communautaire](https://discord.gg/your-server)

---

**🎯 Objectif** : Automatiser complètement la gestion des stocks avec IA pour réduire le temps de saisie de 90% tout en garantissant la précision des données.