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
  nom: string; // Renommé de 'name' pour correspondre aux besoins
  categorie: ProductCategory; // Renommé de 'category' pour correspondre aux besoins
  subcategory?: string;
  quantite: number; // Renommé de 'quantity' pour correspondre aux besoins
  unite: ProductUnit; // Renommé de 'unit' pour correspondre aux besoins
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
  createdBy: string; // UID de l'utilisateur
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