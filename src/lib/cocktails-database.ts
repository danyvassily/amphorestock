export interface CocktailIngredient {
  name: string;
  category: 'spiritueux' | 'liqueur' | 'vin' | 'biere' | 'soft' | 'autre';
  quantity: number;
  unit: 'cl' | 'ml' | 'trait' | 'cuillère' | 'pièce';
  optional?: boolean;
}

export interface CocktailRecipe {
  id: string;
  name: string;
  category: 'classique' | 'moderne' | 'digestif' | 'aperitif' | 'tropical' | 'hiver';
  difficulty: 1 | 2 | 3 | 4 | 5;
  glassType: string;
  preparationTime: number; // en minutes
  ingredients: CocktailIngredient[];
  instructions: string[];
  garnish?: string;
  description: string;
  tags: string[];
}

export const COCKTAILS_DATABASE: CocktailRecipe[] = [
  // CLASSIQUES FRANÇAIS
  {
    id: 'kir-royal',
    name: 'Kir Royal',
    category: 'aperitif',
    difficulty: 1,
    glassType: 'Flûte à champagne',
    preparationTime: 2,
    ingredients: [
      { name: 'Champagne', category: 'vin', quantity: 12, unit: 'cl' },
      { name: 'Crème de cassis', category: 'liqueur', quantity: 1, unit: 'cl' }
    ],
    instructions: [
      'Verser la crème de cassis dans la flûte',
      'Compléter délicatement avec le champagne bien frais',
      'Remuer très légèrement'
    ],
    description: 'L\'apéritif français par excellence, élégant et rafraîchissant',
    tags: ['apéritif', 'français', 'élégant', 'festif']
  },
  {
    id: 'monaco',
    name: 'Monaco',
    category: 'aperitif',
    difficulty: 1,
    glassType: 'Chope',
    preparationTime: 1,
    ingredients: [
      { name: 'Bière blonde', category: 'biere', quantity: 25, unit: 'cl' },
      { name: 'Grenadine', category: 'soft', quantity: 2, unit: 'cl' }
    ],
    instructions: [
      'Verser la grenadine dans le fond du verre',
      'Ajouter la bière blonde très fraîche',
      'Servir immédiatement'
    ],
    description: 'Cocktail populaire français, rafraîchissant et coloré',
    tags: ['bière', 'français', 'coloré', 'désaltérant']
  },

  // COCKTAILS CLASSIQUES INTERNATIONAUX
  {
    id: 'mojito',
    name: 'Mojito',
    category: 'tropical',
    difficulty: 2,
    glassType: 'Highball',
    preparationTime: 3,
    ingredients: [
      { name: 'Rhum blanc', category: 'spiritueux', quantity: 6, unit: 'cl' },
      { name: 'Menthe fraîche', category: 'autre', quantity: 8, unit: 'pièce' },
      { name: 'Citron vert', category: 'autre', quantity: 0.5, unit: 'pièce' },
      { name: 'Sucre de canne', category: 'autre', quantity: 2, unit: 'cuillère' },
      { name: 'Eau gazeuse', category: 'soft', quantity: 10, unit: 'cl' },
      { name: 'Glace pilée', category: 'autre', quantity: 1, unit: 'pièce' }
    ],
    instructions: [
      'Mettre les feuilles de menthe et le sucre dans le verre',
      'Presser le demi citron vert et ajouter le jus',
      'Piler délicatement pour libérer les arômes',
      'Ajouter le rhum et mélanger',
      'Remplir de glace pilée',
      'Compléter avec l\'eau gazeuse'
    ],
    garnish: 'Brin de menthe fraîche',
    description: 'Le cocktail cubain emblématique, frais et mentholé',
    tags: ['rhum', 'menthe', 'rafraîchissant', 'tropical', 'cubain']
  },
  {
    id: 'caipirinha',
    name: 'Caïpirinha',
    category: 'tropical',
    difficulty: 2,
    glassType: 'Old Fashioned',
    preparationTime: 3,
    ingredients: [
      { name: 'Cachaça', category: 'spiritueux', quantity: 6, unit: 'cl' },
      { name: 'Citron vert', category: 'autre', quantity: 0.5, unit: 'pièce' },
      { name: 'Sucre blanc', category: 'autre', quantity: 2, unit: 'cuillère' },
      { name: 'Glace pilée', category: 'autre', quantity: 1, unit: 'pièce' }
    ],
    instructions: [
      'Couper le demi citron vert en quartiers',
      'Mettre les quartiers et le sucre dans le verre',
      'Piler énergiquement pour extraire le jus',
      'Ajouter la cachaça',
      'Remplir de glace pilée et mélanger'
    ],
    description: 'Le cocktail national brésilien, authentique et puissant',
    tags: ['cachaça', 'brésilien', 'citron vert', 'authentique']
  },
  {
    id: 'piña-colada',
    name: 'Piña Colada',
    category: 'tropical',
    difficulty: 2,
    glassType: 'Hurricane',
    preparationTime: 3,
    ingredients: [
      { name: 'Rhum blanc', category: 'spiritueux', quantity: 6, unit: 'cl' },
      { name: 'Lait de coco', category: 'soft', quantity: 6, unit: 'cl' },
      { name: 'Jus d\'ananas', category: 'soft', quantity: 12, unit: 'cl' },
      { name: 'Glace pilée', category: 'autre', quantity: 1, unit: 'pièce' }
    ],
    instructions: [
      'Mixer tous les ingrédients avec la glace',
      'Verser dans le verre hurricane',
      'Décorer avec l\'ananas et la cerise'
    ],
    garnish: 'Tranche d\'ananas et cerise',
    description: 'L\'évasion tropicale en verre, crémeuse et exotique',
    tags: ['rhum', 'coco', 'ananas', 'crémeux', 'tropical']
  },

  // COCKTAILS AU WHISKY
  {
    id: 'old-fashioned',
    name: 'Old Fashioned',
    category: 'classique',
    difficulty: 2,
    glassType: 'Old Fashioned',
    preparationTime: 3,
    ingredients: [
      { name: 'Whisky bourbon', category: 'spiritueux', quantity: 6, unit: 'cl' },
      { name: 'Sucre de canne', category: 'autre', quantity: 1, unit: 'cuillère' },
      { name: 'Angostura bitters', category: 'liqueur', quantity: 2, unit: 'trait' },
      { name: 'Orange', category: 'autre', quantity: 1, unit: 'pièce' }
    ],
    instructions: [
      'Mettre le sucre et l\'Angostura dans le verre',
      'Ajouter quelques gouttes d\'eau et mélanger',
      'Ajouter le whisky et quelques glaçons',
      'Remuer délicatement',
      'Exprimer l\'huile de zeste d\'orange au-dessus'
    ],
    garnish: 'Zeste d\'orange',
    description: 'Le grand classique américain, pure expression du whisky',
    tags: ['whisky', 'classique', 'simple', 'authentique']
  },
  {
    id: 'whisky-sour',
    name: 'Whisky Sour',
    category: 'classique',
    difficulty: 2,
    glassType: 'Rocks',
    preparationTime: 3,
    ingredients: [
      { name: 'Whisky bourbon', category: 'spiritueux', quantity: 6, unit: 'cl' },
      { name: 'Jus de citron', category: 'autre', quantity: 3, unit: 'cl' },
      { name: 'Sirop de sucre', category: 'autre', quantity: 2, unit: 'cl' },
      { name: 'Blanc d\'œuf', category: 'autre', quantity: 1, unit: 'pièce', optional: true }
    ],
    instructions: [
      'Shaker tous les ingrédients avec de la glace',
      'Filtrer dans le verre avec des glaçons',
      'Décorer avec la cerise et l\'orange'
    ],
    garnish: 'Cerise et demi-tranche d\'orange',
    description: 'L\'équilibre parfait entre force et acidité',
    tags: ['whisky', 'aigre-doux', 'classique', 'équilibré']
  },

  // COCKTAILS À LA VODKA
  {
    id: 'moscow-mule',
    name: 'Moscow Mule',
    category: 'moderne',
    difficulty: 1,
    glassType: 'Mug en cuivre',
    preparationTime: 2,
    ingredients: [
      { name: 'Vodka', category: 'spiritueux', quantity: 6, unit: 'cl' },
      { name: 'Ginger beer', category: 'soft', quantity: 15, unit: 'cl' },
      { name: 'Jus de citron vert', category: 'autre', quantity: 2, unit: 'cl' }
    ],
    instructions: [
      'Remplir le mug de glace',
      'Ajouter la vodka et le jus de citron vert',
      'Compléter avec la ginger beer',
      'Remuer délicatement'
    ],
    garnish: 'Quartier de citron vert',
    description: 'Rafraîchissant et épicé, servi traditionnellement dans un mug en cuivre',
    tags: ['vodka', 'gingembre', 'pétillant', 'rafraîchissant']
  },
  {
    id: 'bloody-mary',
    name: 'Bloody Mary',
    category: 'classique',
    difficulty: 3,
    glassType: 'Highball',
    preparationTime: 4,
    ingredients: [
      { name: 'Vodka', category: 'spiritueux', quantity: 6, unit: 'cl' },
      { name: 'Jus de tomate', category: 'soft', quantity: 12, unit: 'cl' },
      { name: 'Jus de citron', category: 'autre', quantity: 1, unit: 'cl' },
      { name: 'Sauce Worcestershire', category: 'autre', quantity: 3, unit: 'trait' },
      { name: 'Tabasco', category: 'autre', quantity: 2, unit: 'trait' },
      { name: 'Sel de céleri', category: 'autre', quantity: 1, unit: 'trait' }
    ],
    instructions: [
      'Mélanger tous les ingrédients dans un shaker',
      'Secouer délicatement',
      'Verser sur glace dans le verre',
      'Décorer généreusement'
    ],
    garnish: 'Branche de céleri, olive, citron',
    description: 'Le cocktail brunch par excellence, savoureux et revigorant',
    tags: ['vodka', 'tomate', 'épicé', 'brunch', 'salé']
  },

  // COCKTAILS AU GIN
  {
    id: 'gin-tonic',
    name: 'Gin Tonic',
    category: 'classique',
    difficulty: 1,
    glassType: 'Highball',
    preparationTime: 1,
    ingredients: [
      { name: 'Gin', category: 'spiritueux', quantity: 6, unit: 'cl' },
      { name: 'Tonic', category: 'soft', quantity: 15, unit: 'cl' },
      { name: 'Citron vert', category: 'autre', quantity: 0.25, unit: 'pièce' }
    ],
    instructions: [
      'Remplir le verre de glace',
      'Ajouter le gin',
      'Compléter avec le tonic',
      'Presser le quartier de citron vert et le déposer'
    ],
    garnish: 'Quartier de citron vert',
    description: 'Le classique britannique intemporel, simple et rafraîchissant',
    tags: ['gin', 'tonic', 'simple', 'britannique', 'désaltérant']
  },
  {
    id: 'negroni',
    name: 'Negroni',
    category: 'aperitif',
    difficulty: 1,
    glassType: 'Old Fashioned',
    preparationTime: 2,
    ingredients: [
      { name: 'Gin', category: 'spiritueux', quantity: 3, unit: 'cl' },
      { name: 'Campari', category: 'liqueur', quantity: 3, unit: 'cl' },
      { name: 'Vermouth rouge', category: 'vin', quantity: 3, unit: 'cl' }
    ],
    instructions: [
      'Verser tous les ingrédients dans le verre avec de la glace',
      'Remuer délicatement',
      'Garnir avec le zeste d\'orange'
    ],
    garnish: 'Zeste d\'orange',
    description: 'L\'apéritif italien emblématique, amer et complexe',
    tags: ['gin', 'italien', 'amer', 'apéritif', 'élégant']
  },

  // COCKTAILS FESTIFS & CRÉATIFS
  {
    id: 'aperol-spritz',
    name: 'Aperol Spritz',
    category: 'aperitif',
    difficulty: 1,
    glassType: 'Ballon à vin',
    preparationTime: 2,
    ingredients: [
      { name: 'Aperol', category: 'liqueur', quantity: 6, unit: 'cl' },
      { name: 'Prosecco', category: 'vin', quantity: 9, unit: 'cl' },
      { name: 'Eau gazeuse', category: 'soft', quantity: 3, unit: 'cl' }
    ],
    instructions: [
      'Remplir le verre de glace',
      'Ajouter l\'Aperol',
      'Verser le Prosecco',
      'Compléter avec l\'eau gazeuse',
      'Remuer délicatement'
    ],
    garnish: 'Tranche d\'orange',
    description: 'L\'apéritif italien tendance, léger et coloré',
    tags: ['aperol', 'prosecco', 'italien', 'pétillant', 'orange']
  },
  {
    id: 'french-75',
    name: 'French 75',
    category: 'classique',
    difficulty: 2,
    glassType: 'Flûte à champagne',
    preparationTime: 3,
    ingredients: [
      { name: 'Gin', category: 'spiritueux', quantity: 3, unit: 'cl' },
      { name: 'Jus de citron', category: 'autre', quantity: 1.5, unit: 'cl' },
      { name: 'Sirop de sucre', category: 'autre', quantity: 1, unit: 'cl' },
      { name: 'Champagne', category: 'vin', quantity: 6, unit: 'cl' }
    ],
    instructions: [
      'Shaker gin, citron et sirop avec de la glace',
      'Filtrer dans la flûte',
      'Compléter avec le champagne'
    ],
    garnish: 'Zeste de citron',
    description: 'L\'élégance française pétillante, raffiné et festif',
    tags: ['gin', 'champagne', 'français', 'élégant', 'pétillant']
  },

  // COCKTAILS SANS ALCOOL
  {
    id: 'virgin-mojito',
    name: 'Virgin Mojito',
    category: 'moderne',
    difficulty: 2,
    glassType: 'Highball',
    preparationTime: 3,
    ingredients: [
      { name: 'Menthe fraîche', category: 'autre', quantity: 8, unit: 'pièce' },
      { name: 'Citron vert', category: 'autre', quantity: 0.5, unit: 'pièce' },
      { name: 'Sucre de canne', category: 'autre', quantity: 2, unit: 'cuillère' },
      { name: 'Eau gazeuse', category: 'soft', quantity: 20, unit: 'cl' },
      { name: 'Glace pilée', category: 'autre', quantity: 1, unit: 'pièce' }
    ],
    instructions: [
      'Piler menthe, citron vert et sucre',
      'Ajouter la glace pilée',
      'Compléter avec l\'eau gazeuse',
      'Remuer délicatement'
    ],
    garnish: 'Brin de menthe',
    description: 'Toute la fraîcheur du mojito sans alcool',
    tags: ['sans-alcool', 'menthe', 'rafraîchissant', 'healthy']
  },
  {
    id: 'shirley-temple',
    name: 'Shirley Temple',
    category: 'moderne',
    difficulty: 1,
    glassType: 'Highball',
    preparationTime: 1,
    ingredients: [
      { name: 'Limonade', category: 'soft', quantity: 15, unit: 'cl' },
      { name: 'Grenadine', category: 'soft', quantity: 1, unit: 'cl' }
    ],
    instructions: [
      'Remplir le verre de glace',
      'Ajouter la limonade',
      'Verser délicatement la grenadine',
      'Décorer avec la cerise'
    ],
    garnish: 'Cerise au marasquin',
    description: 'Le cocktail des enfants, coloré et sucré',
    tags: ['sans-alcool', 'sucré', 'coloré', 'enfants']
  },

  // COCKTAILS DE FÊTE ET HIVER
  {
    id: 'mulled-wine',
    name: 'Vin Chaud',
    category: 'hiver',
    difficulty: 3,
    glassType: 'Mug',
    preparationTime: 15,
    ingredients: [
      { name: 'Vin rouge', category: 'vin', quantity: 20, unit: 'cl' },
      { name: 'Cannelle', category: 'autre', quantity: 1, unit: 'pièce' },
      { name: 'Clous de girofle', category: 'autre', quantity: 3, unit: 'pièce' },
      { name: 'Orange', category: 'autre', quantity: 0.25, unit: 'pièce' },
      { name: 'Miel', category: 'autre', quantity: 1, unit: 'cuillère' }
    ],
    instructions: [
      'Chauffer le vin sans le faire bouillir',
      'Ajouter les épices et l\'orange',
      'Laisser infuser 10 minutes',
      'Sucrer avec le miel',
      'Filtrer et servir chaud'
    ],
    garnish: 'Bâton de cannelle et tranche d\'orange',
    description: 'Le réconfort de l\'hiver, épicé et chaleureux',
    tags: ['vin-rouge', 'épices', 'chaud', 'hiver', 'réconfortant']
  },
  {
    id: 'eggnog',
    name: 'Lait de Poule',
    category: 'hiver',
    difficulty: 3,
    glassType: 'Mug',
    preparationTime: 5,
    ingredients: [
      { name: 'Rhum', category: 'spiritueux', quantity: 3, unit: 'cl' },
      { name: 'Cognac', category: 'spiritueux', quantity: 2, unit: 'cl' },
      { name: 'Lait', category: 'soft', quantity: 15, unit: 'cl' },
      { name: 'Jaune d\'œuf', category: 'autre', quantity: 1, unit: 'pièce' },
      { name: 'Sucre', category: 'autre', quantity: 1, unit: 'cuillère' },
      { name: 'Noix de muscade', category: 'autre', quantity: 1, unit: 'trait' }
    ],
    instructions: [
      'Battre le jaune d\'œuf avec le sucre',
      'Ajouter les alcools',
      'Incorporer le lait tiède',
      'Bien mélanger',
      'Servir avec la muscade râpée'
    ],
    garnish: 'Noix de muscade râpée',
    description: 'La tradition de Noël crémeuse et réconfortante',
    tags: ['rhum', 'cognac', 'crémeux', 'noël', 'tradition']
  }
];

// Fonction utilitaire pour rechercher des cocktails par ingrédients disponibles
export function findCocktailsByAvailableIngredients(
  availableProducts: string[],
  minMatchPercentage: number = 0.7
): CocktailRecipe[] {
  return COCKTAILS_DATABASE.filter(cocktail => {
    const requiredIngredients = cocktail.ingredients.filter(ing => !ing.optional);
    const availableCount = requiredIngredients.filter(ingredient => 
      availableProducts.some(product => 
        product.toLowerCase().includes(ingredient.name.toLowerCase()) ||
        ingredient.name.toLowerCase().includes(product.toLowerCase())
      )
    ).length;
    
    const matchPercentage = availableCount / requiredIngredients.length;
    return matchPercentage >= minMatchPercentage;
  });
}

// Fonction pour catégoriser les produits en stock
export function categorizeStockForCocktails(products: Array<{nom: string, categorie: string}>) {
  return products.map(product => ({
    name: product.nom,
    category: mapCategoryToCocktailCategory(product.categorie)
  }));
}

function mapCategoryToCocktailCategory(category: string): CocktailIngredient['category'] {
  const categoryMap: Record<string, CocktailIngredient['category']> = {
    'spiritueux': 'spiritueux',
    'liqueur': 'liqueur', 
    'vin': 'vin',
    'biere': 'biere',
    'soft': 'soft',
    'champagne': 'vin',
    'vins-rouge': 'vin',
    'vins-blanc': 'vin',
    'vins-rose': 'vin'
  };
  
  return categoryMap[category] || 'autre';
} 