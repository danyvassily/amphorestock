// Types pour l'application Amphore

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'manager' | 'staff';
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  nom: string; // Nom du produit
  categorie: ProductCategory; // Catégorie du produit
  subcategory?: string;
  quantite: number; // Quantité en stock
  unite: ProductUnit; // Unité de mesure
  prixAchat: number; // Prix d'achat principal
  prixVente: number; // Prix de vente principal
  
  // Champs spécifiques pour les vins (structure détaillée)
  auVerre?: {
    prixAchatHT: number;
    prixAchatTTC: number;
    prixVenteHT: number;
    prixVenteTTC: number;
  };
  aLaBouteille?: {
    prixAchatHT: number;
    prixAchatTTC: number;
    prixVenteHT: number;
    prixVenteTTC: number;
  };
  
  // Champs legacy pour compatibilité
  prixVerre?: number; // Prix au verre (pour les vins/spiritueux)
  prixBouteille?: number; // Prix bouteille (si différent du prix de vente)
  
  description?: string;
  fournisseur?: string;
  codeBarre?: string;
  seuilAlerte: number; // Seuil minimum pour les alertes de stock
  source: string; // "boissons" ou "vins" - obligatoire pour tracking
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // UID de l'utilisateur qui a créé
  modifiedBy?: string; // UID de l'utilisateur qui a modifié (optionnel car pas présent sur les anciens produits)
}

export type ProductCategory = 
  | 'vins'
  | 'vin-rouge'
  | 'vin-blanc'
  | 'vin-rose'
  | 'spiritueux'
  | 'bieres'
  | 'softs'
  | 'jus'
  | 'eaux'
  | 'cocktails'
  | 'autres';

export type ProductUnit = 
  | 'bouteille'
  | 'litre'
  | 'centilitre'
  | 'verre'
  | 'cannette'
  | 'piece'
  | 'kilogramme'
  | 'gramme';

export interface StockMovement {
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
  createdBy: string; // UID de l'utilisateur
}

export type MovementType = 
  | 'entree' // Ajout de stock
  | 'sortie' // Vente/consommation
  | 'inventaire' // Correction d'inventaire
  | 'perte' // Casse/vol/péremption
  | 'transfert'; // Transfert entre lieux

export interface DashboardStats {
  totalProducts: number;
  totalValue: number; // Valeur totale du stock
  lowStockCount: number; // Nombre de produits en stock faible
  categoriesStats: CategoryStats[];
  recentMovements: StockMovement[];
}

export interface CategoryStats {
  category: ProductCategory;
  count: number;
  value: number;
}

// Type pour l'import Excel
export interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: string[];
  summary: {
    boissons: number;
    vins: number;
    total: number;
  };
}

// Types pour l'IA
export interface AIRequest {
  prompt: string;
  data?: any;
  userId?: string;
  action?: AIAction;
}

export interface AIResponse {
  success: boolean;
  response: string;
  usage?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
  timestamp: string;
  error?: string;
  details?: string;
}

export type AIAction = 
  | 'analyze_stock'
  | 'generate_report'
  | 'import_file'
  | 'categorize_product'
  | 'restock_suggestion'
  | 'update_data'
  | 'summarize_sales'
  | 'general';

export interface AILog {
  id?: string;
  prompt: string;
  action: AIAction;
  response?: string;
  userId: string;
  dataSize?: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface PresetPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  action: AIAction;
  icon: string;
  requiresData?: boolean;
  category: 'analysis' | 'import' | 'management' | 'reporting';
}

export interface FileUploadResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  processedData?: any;
  error?: string;
}

// Types pour les cocktails
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