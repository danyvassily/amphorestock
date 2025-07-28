import { COCKTAILS_DATABASE, CocktailRecipe, CocktailIngredient } from './cocktails-database';
import { Product } from '@/types';

/**
 * Fonction améliorée pour trouver les correspondances de cocktails
 * avec scoring avancé et suggestions intelligentes
 */
export interface CocktailMatch {
  recipe: CocktailRecipe;
  matchScore: number; // 0-100
  availableIngredients: string[];
  missingIngredients: CocktailIngredient[];
  canMakeCount: number; // Nombre de cocktails possibles avec le stock
  cost: number; // Coût estimé d'un cocktail
  profitMargin: number; // Marge bénéficiaire estimée
}

export interface SmartCocktailAnalysis {
  perfectMatches: CocktailMatch[];
  nearMatches: CocktailMatch[];
  seasonal: CocktailMatch[];
  trending: CocktailMatch[];
  highMargin: CocktailMatch[];
  easyToMake: CocktailMatch[];
  shoppingList: {
    ingredient: string;
    category: string;
    unlocksCocktails: string[];
    priority: number;
  }[];
}

/**
 * Analyse intelligente des cocktails possibles
 */
export function analyzeSmartCocktails(
  availableProducts: Product[],
  preferences: {
    difficulty?: number; // 1-5, max difficulty wanted
    priceRange?: 'economique' | 'moyen' | 'premium';
    season?: 'spring' | 'summer' | 'autumn' | 'winter';
    style?: 'classique' | 'moderne' | 'tropical';
  } = {}
): SmartCocktailAnalysis {
  
  const productNames = availableProducts.map(p => p.nom.toLowerCase());
  const productMap = new Map(availableProducts.map(p => [p.nom.toLowerCase(), p]));
  
  // Analyser chaque cocktail
  const allMatches: CocktailMatch[] = COCKTAILS_DATABASE.map(recipe => {
    return analyzeCocktailMatch(recipe, availableProducts, productMap);
  }).filter(match => match.matchScore > 0);

  // Trier par score
  allMatches.sort((a, b) => b.matchScore - a.matchScore);

  // Filtrer selon les préférences
  const filteredMatches = allMatches.filter(match => {
    if (preferences.difficulty && match.recipe.difficulty > preferences.difficulty) return false;
    if (preferences.style && match.recipe.category !== preferences.style) return false;
    return true;
  });

  return {
    perfectMatches: filteredMatches.filter(m => m.matchScore === 100).slice(0, 8),
    nearMatches: filteredMatches.filter(m => m.matchScore >= 70 && m.matchScore < 100).slice(0, 10),
    seasonal: getSeasonalCocktails(filteredMatches, getCurrentSeason()),
    trending: getTrendingCocktails(filteredMatches),
    highMargin: filteredMatches.filter(m => m.profitMargin > 60).slice(0, 6),
    easyToMake: filteredMatches.filter(m => m.recipe.difficulty <= 2 && m.matchScore >= 80).slice(0, 6),
    shoppingList: generateSmartShoppingList(allMatches, availableProducts)
  };
}

/**
 * Analyse un cocktail spécifique par rapport au stock
 */
function analyzeCocktailMatch(
  recipe: CocktailRecipe, 
  availableProducts: Product[],
  productMap: Map<string, Product>
): CocktailMatch {
  
  const requiredIngredients = recipe.ingredients.filter(ing => !ing.optional);
  const allIngredients = recipe.ingredients;
  
  let availableCount = 0;
  let availableIngredients: string[] = [];
  let missingIngredients: CocktailIngredient[] = [];
  let totalCost = 0;
  let canMakeCount = Infinity;

  for (const ingredient of allIngredients) {
    const matchingProduct = findMatchingProduct(ingredient, availableProducts);
    
    if (matchingProduct && matchingProduct.quantite > 0) {
      availableCount++;
      availableIngredients.push(ingredient.name);
      
      // Calculer coût et quantité possible
      const unitCost = calculateIngredientCost(ingredient, matchingProduct);
      totalCost += unitCost;
      
      const possibleMakes = Math.floor(matchingProduct.quantite / getIngredientUsage(ingredient));
      if (possibleMakes < canMakeCount) {
        canMakeCount = possibleMakes;
      }
    } else if (!ingredient.optional) {
      missingIngredients.push(ingredient);
    }
  }

  // Calcul du score de correspondance
  const baseScore = (availableCount / allIngredients.length) * 100;
  const requiredScore = requiredIngredients.every(ing => 
    (findMatchingProduct(ing, availableProducts)?.quantite || 0) > 0
  ) ? 100 : (availableCount / requiredIngredients.length) * 70;

  const matchScore = Math.max(baseScore, requiredScore);
  
  // Estimation du prix de vente (marge typique 300-400%)
  const sellingPrice = totalCost * 3.5;
  const profitMargin = ((sellingPrice - totalCost) / sellingPrice) * 100;

  if (canMakeCount === Infinity) canMakeCount = 0;

  return {
    recipe,
    matchScore: Math.round(matchScore),
    availableIngredients,
    missingIngredients,
    canMakeCount,
    cost: Math.round(totalCost * 100) / 100,
    profitMargin: Math.round(profitMargin)
  };
}

/**
 * Trouve un produit correspondant à un ingrédient
 */
function findMatchingProduct(ingredient: CocktailIngredient, products: Product[]): Product | null {
  const ingredientName = ingredient.name.toLowerCase();
  
  // Correspondance exacte
  let match = products.find(p => p.nom.toLowerCase() === ingredientName);
  if (match) return match;
  
  // Correspondance partielle
  match = products.find(p => 
    p.nom.toLowerCase().includes(ingredientName) || 
    ingredientName.includes(p.nom.toLowerCase())
  );
  if (match) return match;
  
  // Correspondance par catégorie et synonymes
  const synonyms = getIngredientSynonyms(ingredient);
  for (const synonym of synonyms) {
    match = products.find(p => 
      p.nom.toLowerCase().includes(synonym.toLowerCase()) ||
      synonym.toLowerCase().includes(p.nom.toLowerCase())
    );
    if (match) return match;
  }
  
  return null;
}

/**
 * Obtient les synonymes pour un ingrédient
 */
function getIngredientSynonyms(ingredient: CocktailIngredient): string[] {
  const synonymMap: Record<string, string[]> = {
    'rhum blanc': ['rhum', 'rum', 'ron blanco'],
    'rhum brun': ['rhum', 'rum', 'ron añejo'],
    'whisky bourbon': ['whisky', 'whiskey', 'bourbon'],
    'gin': ['genièvre'],
    'vodka': ['wodka'],
    'champagne': ['crémant', 'prosecco', 'cava'],
    'vin rouge': ['rouge', 'cabernet', 'merlot', 'pinot noir'],
    'vin blanc': ['blanc', 'chardonnay', 'sauvignon'],
    'bière blonde': ['bière', 'beer', 'blonde'],
    'tonic': ['schweppes', 'eau tonique'],
    'ginger beer': ['ginger ale', 'boisson gingembre'],
    'jus d\'ananas': ['ananas'],
    'jus de citron': ['citron'],
    'crème de cassis': ['cassis', 'liqueur cassis']
  };
  
  const name = ingredient.name.toLowerCase();
  return synonymMap[name] || [name];
}

/**
 * Calcule le coût d'un ingrédient dans un cocktail
 */
function calculateIngredientCost(ingredient: CocktailIngredient, product: Product): number {
  const usageAmount = getIngredientUsage(ingredient);
  const unitCost = product.prixAchat / product.quantite;
  return usageAmount * unitCost;
}

/**
 * Convertit la quantité d'ingrédient en unité du stock
 */
function getIngredientUsage(ingredient: CocktailIngredient): number {
  // Convertir tout en ml pour uniformiser
  switch (ingredient.unit) {
    case 'cl': return ingredient.quantity * 10;
    case 'ml': return ingredient.quantity;
    case 'trait': return 5; // ~5ml par trait
    case 'cuillère': return 15; // ~15ml par cuillère
    case 'pièce': return 30; // estimation moyenne
    default: return ingredient.quantity * 10;
  }
}

/**
 * Obtient les cocktails de saison
 */
function getSeasonalCocktails(matches: CocktailMatch[], season: string): CocktailMatch[] {
  const seasonalTags: Record<string, string[]> = {
    'spring': ['léger', 'floral', 'frais'],
    'summer': ['rafraîchissant', 'tropical', 'glacé', 'pétillant'],
    'autumn': ['épicé', 'réconfortant', 'fruits'],
    'winter': ['chaud', 'épices', 'réconfortant', 'tradition']
  };
  
  const tags = seasonalTags[season] || [];
  return matches
    .filter(match => 
      tags.some(tag => match.recipe.tags.includes(tag)) ||
      (season === 'summer' && match.recipe.category === 'tropical') ||
      (season === 'winter' && match.recipe.category === 'hiver')
    )
    .slice(0, 6);
}

/**
 * Obtient les cocktails tendance
 */
function getTrendingCocktails(matches: CocktailMatch[]): CocktailMatch[] {
  const trendingNames = [
    'aperol spritz', 'negroni', 'gin tonic', 'moscow mule', 
    'mojito', 'old fashioned', 'french 75'
  ];
  
  return matches
    .filter(match => 
      trendingNames.some(name => 
        match.recipe.name.toLowerCase().includes(name)
      )
    )
    .slice(0, 6);
}

/**
 * Génère une liste d'achats intelligente
 */
function generateSmartShoppingList(
  allMatches: CocktailMatch[], 
  currentStock: Product[]
): SmartCocktailAnalysis['shoppingList'] {
  
  const ingredientImpact = new Map<string, {
    unlocks: Set<string>,
    priority: number,
    category: string
  }>();

  // Analyser l'impact de chaque ingrédient manquant
  allMatches.forEach(match => {
    match.missingIngredients.forEach(ingredient => {
      const key = ingredient.name.toLowerCase();
      if (!ingredientImpact.has(key)) {
        ingredientImpact.set(key, {
          unlocks: new Set(),
          priority: 0,
          category: ingredient.category
        });
      }
      
      const impact = ingredientImpact.get(key)!;
      impact.unlocks.add(match.recipe.name);
      impact.priority += match.matchScore;
    });
  });

  // Convertir en liste triée
  return Array.from(ingredientImpact.entries())
    .map(([ingredient, data]) => ({
      ingredient,
      category: data.category,
      unlocksCocktails: Array.from(data.unlocks),
      priority: Math.round(data.priority / data.unlocks.size)
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10);
}

/**
 * Obtient la saison actuelle
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

/**
 * Formate les données pour l'IA Gemini
 */
export function formatCocktailDataForAI(analysis: SmartCocktailAnalysis): any {
  return {
    perfectMatches: analysis.perfectMatches.map(m => ({
      name: m.recipe.name,
      category: m.recipe.category,
      difficulty: m.recipe.difficulty,
      preparationTime: m.recipe.preparationTime,
      cost: m.cost,
      profitMargin: m.profitMargin,
      canMake: m.canMakeCount,
      description: m.recipe.description
    })),
    nearMatches: analysis.nearMatches.map(m => ({
      name: m.recipe.name,
      matchScore: m.matchScore,
      missingIngredients: m.missingIngredients.map(ing => ing.name),
      cost: m.cost
    })),
    recommendations: {
      seasonal: analysis.seasonal.map(m => m.recipe.name),
      trending: analysis.trending.map(m => m.recipe.name),
      highMargin: analysis.highMargin.map(m => ({
        name: m.recipe.name,
        margin: m.profitMargin
      }))
    },
    shoppingPriorities: analysis.shoppingList.slice(0, 5)
  };
} 