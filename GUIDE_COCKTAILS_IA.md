# 🍹 Guide IA Cocktails - Amphore

## Nouvelle Fonctionnalité : Suggestions de Cocktails Intelligentes

L'IA d'Amphore peut maintenant analyser votre stock et vous suggérer des recettes de cocktails parfaitement adaptées à vos produits disponibles !

## 🎯 Fonctionnalités

### ✨ **Analyse Intelligente du Stock**
- Correspondance automatique entre vos produits et les ingrédients de cocktails
- Calcul des coûts et marges bénéficiaires
- Estimation du nombre de cocktails réalisables

### 🍹 **Base de Données Complète**
- **25+ recettes** de cocktails classiques et modernes
- Cocktails français (Kir Royal, Monaco)
- Grands classiques internationaux (Mojito, Negroni, Old Fashioned)
- Cocktails de saison et tendance
- Options sans alcool

### 🧠 **IA Spécialisée Mixologie**
- Suggestions basées sur la disponibilité réelle
- Recommandations saisonnières
- Analyse de rentabilité
- Liste d'achats stratégiques

## 🚀 Comment Utiliser

### 1. **Via les Prompts Prédéfinis**
Dans la page IA, cliquez sur :
- 🍹 **"Suggestions cocktails"** - Cocktails avec votre stock actuel
- 🌿 **"Cocktails de saison"** - Adaptés à la période actuelle

### 2. **Via Questions Personnalisées**
Exemples de questions :
```
"Quels cocktails puis-je faire avec mon stock actuel ?"
"Propose-moi des cocktails d'été rafraîchissants"
"Cocktails simples pour débutants avec mes produits"
"Quels achats pour élargir ma carte cocktails ?"
```

### 3. **Préférences Avancées**
L'IA comprend vos préférences :
- **Difficulté** : "cocktails simples", "faciles à préparer"
- **Saison** : "été", "hiver", "tropical", "chaud"
- **Style** : "classique", "moderne", "français"

## 📊 Format des Réponses IA

L'IA structure ses réponses en sections claires :

### 🍹 **TOP COCKTAILS RÉALISABLES**
Cocktails avec 100% des ingrédients disponibles
- Nom et description
- Difficulté (⭐ à ⭐⭐⭐⭐⭐)
- Temps de préparation (⏱️)
- Coût estimé (💰)
- Nombre possible avec le stock

### 🌟 **COCKTAILS PRESQUE POSSIBLES**
Cocktails nécessitant 1-2 ingrédients supplémentaires
- Score de correspondance (%)
- Ingrédients manquants
- Suggestions d'adaptations

### 📊 **ANALYSE RENTABILITÉ**
- Coût des ingrédients
- Prix de vente suggéré
- Marge bénéficiaire (%)
- Quantité réalisable

### 🛒 **ACHATS STRATÉGIQUES**
Ingrédients prioritaires qui débloquent le plus de nouvelles recettes
- Impact sur le nombre de cocktails possibles
- Retour sur investissement

### 🎯 **RECOMMANDATIONS SAISONNIÈRES**
Cocktails adaptés à la saison actuelle et tendances du moment

## 🔧 Architecture Technique

### Base de Données Cocktails
```typescript
// Structure complète des recettes
interface CocktailRecipe {
  id: string;
  name: string;
  category: 'classique' | 'moderne' | 'aperitif' | 'tropical' | 'hiver';
  difficulty: 1 | 2 | 3 | 4 | 5;
  ingredients: CocktailIngredient[];
  instructions: string[];
  cost: number;
  profitMargin: number;
}
```

### Algorithme de Correspondance
1. **Correspondance exacte** : Nom identique
2. **Correspondance partielle** : Contient le nom
3. **Correspondance par synonymes** : Base de synonymes étendue
4. **Score de correspondance** : 0-100% selon disponibilité

### Calculs Intelligents
- **Coût cocktail** : Basé sur prix d'achat et quantités utilisées
- **Marge** : Estimation industrie (300-400% markup)
- **Quantité possible** : Stock limité par ingrédient le plus rare

## 🎨 Exemples Concrets

### Stock Exemple :
- Gin Bombay (75cl)
- Tonic Schweppes (1L)
- Rhum Havana Club (70cl)
- Champagne (75cl)
- Crème de cassis (50cl)

### Réponse IA :
```
🍹 TOP COCKTAILS RÉALISABLES

1. **Gin Tonic** ⭐ | ⏱️ 1min | 💰 2.50€
   💡 Classique intemporel, marge excellente (75%)
   📊 Possible: 25 cocktails

2. **Kir Royal** ⭐⭐ | ⏱️ 2min | 💰 4.20€
   💡 Apéritif français élégant, forte marge
   📊 Possible: 15 cocktails

🛒 ACHATS STRATÉGIQUES
1. **Citron vert** → Débloque 8 nouveaux cocktails
2. **Menthe fraîche** → Permet Mojito et variantes
```

## 🚀 Prochaines Améliorations

- **Carte cocktails automatique** : Génération PDF
- **Intégration photos** : Images des cocktails
- **Historique préférences** : IA qui apprend vos goûts
- **Calcul stocks optimal** : Pour événements spéciaux

## 🔍 Debug et Logs

Toutes les interactions sont loggées dans Firebase :
- Collection `ai-logs` avec détails complets
- Tracking des performances et erreurs
- Analyse des patterns de demandes

---

## 💡 Conseils d'Utilisation

1. **Mettez à jour vos stocks** régulièrement pour des suggestions précises
2. **Soyez spécifique** dans vos questions pour de meilleurs résultats
3. **Utilisez les préférences** pour personnaliser les suggestions
4. **Testez différents prompts** pour explorer toutes les possibilités

**L'IA Amphore transforme votre gestion de stock en véritable assistant mixologue ! 🍹✨** 