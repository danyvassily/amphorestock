# Guide des Index Firebase pour Amphore

## Index Requis pour les Requêtes Firestore

Pour éviter les erreurs d'index dans votre application, vous devez créer les index composés suivants dans la console Firebase.

### 1. Index pour les Stocks avec Filtres

```javascript
// Collection: stocks
// Champs à indexer:
{
  "collectionGroup": "stocks",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "categorie",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "source",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "nom",
      "order": "ASCENDING"
    }
  ]
}
```

### 2. Index pour les Mouvements de Stock par Date

```javascript
// Collection: stock-movements
// Champs à indexer:
{
  "collectionGroup": "stock-movements",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "createdAt",
      "order": "DESCENDING"
    },
    {
      "fieldPath": "type",
      "order": "ASCENDING"
    }
  ]
}
```

### 3. Index pour les Mouvements par Période et Type

```javascript
// Collection: stock-movements
// Champs à indexer:
{
  "collectionGroup": "stock-movements",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "type",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "createdAt",
      "order": "ASCENDING"
    }
  ]
}
```

## Comment Créer ces Index

### Option 1: Via la Console Firebase

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com)
2. Sélectionnez votre projet `amphore-stock`
3. Dans le menu latéral, cliquez sur **Firestore Database**
4. Allez dans l'onglet **Index**
5. Cliquez sur **Créer un index**
6. Remplissez les champs selon les configurations ci-dessus

### Option 2: Via le CLI Firebase

Créez un fichier `firestore.indexes.json` à la racine du projet :

```json
{
  "indexes": [
    {
      "collectionGroup": "stocks",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "categorie",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "source",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "nom",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "stock-movements",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        },
        {
          "fieldPath": "type",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "stock-movements",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "type",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Puis exécutez :
```bash
firebase deploy --only firestore:indexes
```

## Optimisations Appliquées dans le Code

### 1. Requêtes Séparées au lieu d'Index Composés
- **Avant** : `query(collection, where(...), where(...), orderBy(...))`
- **Après** : Requêtes simples + tri côté client

### 2. Limitation des Résultats
- Ajout de `limit()` sur toutes les requêtes pour éviter les timeouts
- Pagination côté client si nécessaire

### 3. Gestion d'Erreurs Robuste
- Try/catch sur toutes les opérations Firebase
- Fallback gracieux en cas d'erreur
- Messages d'erreur informatifs

### 4. Requêtes Conditionnelles
- Construction dynamique des requêtes selon les filtres
- Éviter les index composés quand possible

## Vérification des Index

Pour vérifier que vos index sont bien créés :

1. **Console Firebase** : Vérifiez l'état dans l'onglet Index
2. **Logs de développement** : Les erreurs d'index apparaissent dans la console
3. **Mode émulateur** : Testez localement avec l'émulateur Firestore

## Règles de Sécurité Firestore Recommandées

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour les stocks
    match /stocks/{stockId} {
      allow read, write: if request.auth != null;
    }
    
    // Règles pour les mouvements de stock
    match /stock-movements/{movementId} {
      allow read, write: if request.auth != null;
    }
    
    // Règles pour l'historique d'import
    match /import-history/{importId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## Monitoring et Performance

### Métriques à Surveiller
- Temps de réponse des requêtes
- Nombre de lectures par requête
- Erreurs d'index
- Utilisation de la bande passante

### Outils Recommandés
- Firebase Performance Monitoring
- Google Cloud Monitoring
- Logs Firebase Functions

## Troubleshooting

### Erreur "Missing Index"
1. Copiez l'URL de l'erreur dans la console
2. Créez l'index suggéré automatiquement
3. Attendez la création (peut prendre quelques minutes)

### Requêtes Lentes
1. Vérifiez les index utilisés
2. Limitez les résultats avec `limit()`
3. Utilisez la pagination si nécessaire

### Dépassement de Quota
1. Implémentez un cache côté client
2. Réduisez la fréquence des requêtes temps réel
3. Utilisez des requêtes batch quand possible 