# 🍷 Amphore - Système de Gestion des Stocks

## Vue d'ensemble

Ce système permet d'importer et gérer vos stocks de boissons (vins, spiritueux, softs, etc.) depuis des fichiers Excel vers une base de données Firestore temps réel.

## 🚀 Import des données Excel

### Fichiers supportés
- **Vins** : `L'Almanach Montmartre - vins - coûts matières - 2024.xlsx`
- **Boissons** : `Stocks boisson juillet 2025.xlsx`

### Commande d'import
```bash
npm run import-stocks
```

Cette commande :
- Parse les fichiers Excel dans `/src/donnees/`
- Mappe les données vers le format standard
- Importe tout dans Firestore (collection `stocks`)
- Affiche un résumé détaillé

### Résultat de l'import
- ✅ **119 produits importés** (55 vins + 64 boissons)
- Chaque produit inclut : nom, catégorie, prix d'achat/vente, quantité, etc.
- Pour les vins : prix au verre et à la bouteille
- Source trackée (`vins` ou `boissons`)

## 📊 Pages de l'application

### 1. Dashboard (`/dashboard`)
- **Vue d'ensemble** : statistiques globales, graphiques
- **Stocks faibles** : alertes produits sous le seuil
- **Répartition par catégories** : vins, spiritueux, softs, etc.
- **Actions rapides** : liens vers les autres pages

### 2. Gestion des Stocks (`/stock`)
- **Liste complète** : tous les produits avec tri/filtrage
- **Recherche avancée** : par nom, fournisseur, catégorie
- **Actions en temps réel** :
  - Boutons `+/-` pour ajustement rapide
  - Modification/suppression de produits
  - État des stocks (normal/faible) avec alertes visuelles

### 3. Service Rapide (`/service`)
- **Interface optimisée** pour le service
- **Vente en un clic** : décrément automatique du stock
- **Boutons spécialisés** : "Verre" et "Bouteille" pour les vins
- **Quantités personnalisables** : saisie rapide
- **Recherche instantanée** par nom de produit

## 🔄 Fonctionnalités temps réel

### Synchronisation automatique
- **Firestore** : base de données temps réel
- **Mises à jour instantanées** sur toutes les pages
- **Historique des mouvements** : chaque action est trackée

### Types de mouvements
- `entree` : Ajout de stock (réapprovisionnement)
- `sortie` : Vente/consommation 
- `inventaire` : Correction d'inventaire
- `perte` : Casse, vol, péremption

### Notifications
- **Toast confirmations** pour chaque action
- **Alertes visuelles** pour stocks faibles
- **États de chargement** pour un feedback immédiat

## 📋 Structure des données

### Produit type
```typescript
{
  id: string;
  nom: string;
  categorie: 'vin-rouge' | 'vin-blanc' | 'softs' | 'spiritueux'...;
  quantite: number;
  unite: 'bouteille' | 'cannette' | 'verre'...;
  prixAchat: number;
  prixVente: number;
  
  // Pour les vins uniquement
  auVerre?: {
    prixAchatHT: number;
    prixAchatTTC: number;
    prixVenteHT: number;
    prixVenteTTC: number;
  };
  aLaBouteille?: { /* même structure */ };
  
  seuilAlerte: number; // Stock minimum
  source: 'vins' | 'boissons';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🛠️ Utilisation quotidienne

### Workflow recommandé

1. **Import initial** : `npm run import-stocks`
2. **Vérification** : Consultez le dashboard pour valider l'import
3. **Service** : Utilisez `/service` pour les ventes rapides
4. **Gestion** : `/stock` pour les ajustements et le suivi
5. **Réapprovisionnement** : Surveillez les alertes de stock faible

### Cas d'usage principaux

- **🍷 Vente au verre** : Bouton "Verre" sur `/service`
- **🍾 Vente bouteille** : Bouton "Bouteille" ou quantité personnalisée
- **📦 Réapprovisionnement** : Boutons `+` sur `/stock`
- **📊 Suivi** : Dashboard pour les tendances
- **🔍 Recherche** : Barre de recherche sur toutes les pages

## 🚨 Alertes et seuils

### Stocks faibles
- **Seuil par défaut** : 3 pour les vins, 5 pour les autres
- **Alertes visuelles** : icônes orange et badges
- **Compteur global** : affiché sur le dashboard

### Actions recommandées
- **Stock faible** : Commande fournisseur
- **Stock critique** : Retrait temporaire de la carte
- **Suivi régulier** : Vérification hebdomadaire des seuils

## 🔧 Développement

### Technologies utilisées
- **Frontend** : Next.js 15, React, TypeScript
- **UI** : ShadCN UI, Tailwind CSS
- **Backend** : Firestore (temps réel)
- **Import** : xlsx, uuid
- **Notifications** : Sonner (toast)

### Hooks principaux
- `useStocks()` : Récupération et filtrage des stocks
- `StockService` : Opérations CRUD et mouvements

### Re-import des données
Le script d'import **nettoie automatiquement** la collection avant de réimporter. Pour préserver les modifications manuelles, commentez la section "nettoyage" dans `scripts/importStocks.ts`.

---

🎉 **Votre système de gestion des stocks est maintenant opérationnel !** 