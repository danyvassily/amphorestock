/**
 * Classification automatique des produits par catégorie
 * Basé sur les noms des produits et les données Excel
 */

import { ProductCategory } from '@/types';

// Listes de mots-clés pour chaque catégorie
const VIN_KEYWORDS = [
  'vin', 'wine', 'château', 'domaine', 'cuvée', 'vintage', 'millésime',
  'bordeaux', 'bourgogne', 'champagne', 'chablis', 'merlot', 'cabernet',
  'sauvignon', 'chardonnay', 'pinot', 'syrah', 'shiraz', 'grenache',
  'riesling', 'gewürztraminer', 'albariño', 'tempranillo', 'sangiovese',
  'chianti', 'barolo', 'rioja', 'priorat', 'côtes', 'valley', 'reserve',
  'blanc', 'rouge', 'rosé', 'rose', 'blanc de blancs', 'blanc de noirs',
  'brut', 'sec', 'demi-sec', 'mousseux', 'effervescent', 'pétillant',
  'crémant', 'cava', 'prosecco', 'spumante', 'sekt'
];

const SPIRITUEUX_KEYWORDS = [
  'whisky', 'whiskey', 'bourbon', 'scotch', 'rye', 'irish',
  'vodka', 'gin', 'rum', 'rhum', 'tequila', 'mezcal',
  'brandy', 'cognac', 'armagnac', 'calvados', 'marc',
  'grappa', 'schnapps', 'aquavit', 'sake', 'shochu',
  'liqueur', 'liquor', 'amaretto', 'sambuca', 'ouzo',
  'pastis', 'absinthe', 'chartreuse', 'bénédictine',
  'cointreau', 'grand marnier', 'kahlua', 'baileys',
  'drambuie', 'jägermeister', 'fernet', 'aperol',
  'campari', 'vermouth', 'porto', 'sherry', 'madère',
  'hennessy', 'rémy martin', 'martell', 'macallan',
  'glenlivet', 'glenfiddich', 'johnnie walker', 'jameson',
  'jack daniels', 'jim beam', 'maker\'s mark', 'buffalo trace',
  'grey goose', 'belvedere', 'absolut', 'smirnoff',
  'hendricks', 'tanqueray', 'bombay', 'gordons',
  'bacardi', 'captain morgan', 'mount gay', 'havana club',
  'don julio', 'patron', 'jose cuervo', 'herradura'
];

const BIERE_KEYWORDS = [
  'bière', 'beer', 'ale', 'lager', 'stout', 'porter',
  'pils', 'pilsner', 'weizen', 'hefeweizen', 'witbier',
  'ipa', 'pale ale', 'brown ale', 'amber', 'blonde',
  'brune', 'blanche', 'triple', 'dubbel', 'quadrupel',
  'guinness', 'heineken', 'stella artois', 'corona',
  'budweiser', 'carlsberg', 'leffe', 'hoegaarden',
  'chimay', 'duvel', 'orval', 'westmalle'
];

const SOFT_KEYWORDS = [
  'coca', 'pepsi', 'sprite', 'fanta', 'orangina', 'schweppes',
  'perrier', 'san pellegrino', 'vittel', 'evian', 'volvic',
  'badoit', 'eau', 'water', 'jus', 'juice', 'nectar',
  'sirop', 'syrup', 'soda', 'cola', 'limonade', 'citronnade',
  'thé', 'tea', 'café', 'coffee', 'tisane', 'infusion',
  'energy', 'red bull', 'monster', 'kombucha',
  'smoothie', 'milkshake', 'chocolat chaud'
];

/**
 * Classifie automatiquement un produit selon sa catégorie
 */
export function classifyProduct(nom: string, categorieExistante?: string): ProductCategory {
  const nomLower = nom.toLowerCase();
  
  // Si une catégorie existe déjà, on la respecte si elle semble correcte
  if (categorieExistante) {
    const catLower = categorieExistante.toLowerCase();
    if (catLower.includes('vin') || catLower.includes('wine')) return 'vins';
    if (catLower.includes('rouge')) return 'vin-rouge';
    if (catLower.includes('blanc')) return 'vin-blanc';
    if (catLower.includes('rosé') || catLower.includes('rose')) return 'vin-rose';
    if (catLower.includes('spiritueux') || catLower.includes('spirit')) return 'spiritueux';
    if (catLower.includes('biere') || catLower.includes('bière') || catLower.includes('beer')) return 'bieres';
    if (catLower.includes('soft') || catLower.includes('soda')) return 'softs';
    if (catLower.includes('eau') || catLower.includes('water')) return 'eaux';
    if (catLower.includes('jus') || catLower.includes('juice')) return 'jus';
  }
  
  // Classification basée sur les mots-clés du nom
  // Vérifier les vins en premier (plus spécifique)
  if (VIN_KEYWORDS.some(keyword => nomLower.includes(keyword))) {
    // Sous-classification des vins
    if (nomLower.includes('rouge') || nomLower.includes('red')) return 'vin-rouge';
    if (nomLower.includes('blanc') || nomLower.includes('white')) return 'vin-blanc';
    if (nomLower.includes('rosé') || nomLower.includes('rose') || nomLower.includes('rosado')) return 'vin-rose';
    return 'vins'; // Vin générique si pas de sous-catégorie détectée
  }
  
  // Vérifier les spiritueux
  if (SPIRITUEUX_KEYWORDS.some(keyword => nomLower.includes(keyword))) {
    return 'spiritueux';
  }
  
  // Vérifier les bières
  if (BIERE_KEYWORDS.some(keyword => nomLower.includes(keyword))) {
    return 'bieres';
  }
  
  // Vérifier les softs
  if (SOFT_KEYWORDS.some(keyword => nomLower.includes(keyword))) {
    if (nomLower.includes('eau') || nomLower.includes('water')) return 'eaux';
    if (nomLower.includes('jus') || nomLower.includes('juice')) return 'jus';
    return 'softs';
  }
  
  // Classification par défaut basée sur des indices contextuels
  if (nomLower.includes('°') || nomLower.includes('vol') || nomLower.includes('alc')) {
    // Probablement un spiritueux si mention du degré d'alcool
    return 'spiritueux';
  }
  
  // Si aucune classification n'est trouvée, retourner 'autres'
  return 'autres';
}

/**
 * Obtient une couleur d'affichage pour chaque catégorie
 */
export function getCategoryColor(category: ProductCategory): string {
  switch (category) {
    case 'vins':
    case 'vin-rouge':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'vin-blanc':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'vin-rose':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'spiritueux':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'bieres':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'softs':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'jus':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'eaux':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'cocktails':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Obtient un label français pour chaque catégorie
 */
export function getCategoryLabel(category: ProductCategory): string {
  switch (category) {
    case 'vins': return 'Vins';
    case 'vin-rouge': return 'Vins Rouges';
    case 'vin-blanc': return 'Vins Blancs';
    case 'vin-rose': return 'Vins Rosés';
    case 'spiritueux': return 'Spiritueux';
    case 'bieres': return 'Bières';
    case 'softs': return 'Softs';
    case 'jus': return 'Jus';
    case 'eaux': return 'Eaux';
    case 'cocktails': return 'Cocktails';
    case 'autres': return 'Autres';
    default: return category.charAt(0).toUpperCase() + category.slice(1);
  }
} 