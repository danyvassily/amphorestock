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

// Nouveau type moderne pour les produits
export interface Product {
  id: string;
  nom: string; // Nom du produit
  categorie: ProductCategory; // Catégorie du produit
  type: 'vins' | 'general'; // Type principal : vins ou stock général
  quantite: number; // Quantité en stock
  unite: ProductUnit; // Unité de mesure
  prixAchat: number; // Prix d'achat principal
  prixVente: number; // Prix de vente principal
  
  // Prix spécifiques pour les vins
  prixVerre?: number; // Prix au verre (pour les vins/spiritueux)
  prixBouteille?: number; // Prix bouteille (si différent du prix de vente)
  
  // Informations détaillées (optionnelles)
  description?: string;
  fournisseur?: string;
  codeBarre?: string;
  seuilAlerte: number; // Seuil minimum pour les alertes de stock
  isActive: boolean;
  
  // Métadonnées
  source: string; // 'vins' | 'boissons' - pour tracking origine
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // UID de l'utilisateur qui a créé
  modifiedBy?: string; // UID de l'utilisateur qui a modifié
}

// Type legacy pour rétro-compatibilité avec l'ancien système
export interface LegacyProduct {
  id: string;
  nom: string;
  categorie: ProductCategory;
  subcategory?: string;
  quantite: number;
  unite: ProductUnit;
  prixAchat: number;
  prixVente: number;
  
  // Champs spécifiques pour les vins (structure détaillée legacy)
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
  
  prixVerre?: number;
  prixBouteille?: number;
  description?: string;
  fournisseur?: string;
  codeBarre?: string;
  seuilAlerte: number;
  source: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy?: string;
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

// Nouveaux types pour l'interface moderne
export interface FilterOptions {
  search?: string;
  category?: ProductCategory | 'all';
  type?: 'vins' | 'general' | 'all';
  stockStatus?: 'all' | 'normal' | 'low' | 'out';
  sortBy?: 'nom' | 'quantite' | 'prixAchat' | 'prixVente' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductFormData {
  nom: string;
  categorie: ProductCategory;
  type: 'vins' | 'general';
  quantite: number;
  unite: ProductUnit;
  prixAchat: number;
  prixVente: number;
  prixVerre?: number;
  prixBouteille?: number;
  description?: string;
  fournisseur?: string;
  seuilAlerte: number;
}

export interface RealtimeConnectionStatus {
  isConnected: boolean;
  lastSync: Date | null;
  error?: string;
}

export interface BulkImportResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    product: string;
    error: string;
  }>;
  importedProducts: Product[];
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

// === TYPES POUR LES STATISTIQUES AVANCEES ===

export interface SalesStatistics {
  id: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: Date; // Date de début de la période
  totalSales: number; // Nombre total de ventes
  totalRevenue: number; // Chiffre d'affaires total
  totalCost: number; // Coût total des produits vendus
  totalProfit: number; // Bénéfice total
  
  // Ventes par catégorie
  salesByCategory: { [category: string]: CategorySales };
  
  // Ventes par produit (top 10)
  topProducts: ProductSales[];
  
  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
}

export interface CategorySales {
  category: ProductCategory;
  salesCount: number;
  revenue: number;
  cost: number;
  profit: number;
  percentage: number; // Pourcentage du CA total
}

export interface ProductSales {
  productId: string;
  productName: string;
  category: ProductCategory;
  salesCount: number;
  revenue: number;
  cost: number;
  profit: number;
  averagePrice: number;
}

export interface GlobalStatistics {
  id: 'global'; // ID fixe pour les stats globales
  totalSalesAllTime: number;
  totalRevenueAllTime: number;
  totalProfitAllTime: number;
  
  // Moyennes
  averageDailySales: number;
  averageDailyRevenue: number;
  
  // Historique par mois (12 derniers mois)
  monthlyHistory: MonthlyStats[];
  
  // Produits stars
  topSellingProducts: ProductSales[];
  mostProfitableProducts: ProductSales[];
  
  // Dates importantes
  firstSaleDate: Date;
  lastResetDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyStats {
  year: number;
  month: number; // 1-12
  sales: number;
  revenue: number;
  profit: number;
  date: Date;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  date?: Date;
  category?: string;
  color?: string;
}

export interface StatsPeriod {
  label: string;
  value: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
  days: number;
}

// === TYPES POUR LES WIDGETS ET DASHBOARD PERSONNALISABLE ===

export interface DashboardWidget {
  id: string;
  type: 'stats_overview' | 'sales_chart' | 'category_chart' | 'recent_activity' | 'low_stock_alerts' | 'quick_actions' | 'top_products' | 'ai_alerts' | 'report_generator';
  title: string;
  position: {
    x: number;
    y: number;
    w: number; // largeur en unités de grille
    h: number; // hauteur en unités de grille
  };
  isVisible: boolean;
  config: WidgetConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetConfig {
  // Configuration générale
  showTitle?: boolean;
  backgroundColor?: string;
  textColor?: string;
  
  // Configuration spécifique par type
  statsConfig?: {
    showPeriodSelector?: boolean;
    defaultPeriod?: StatsPeriod['value'];
    metricsToShow?: ('sales' | 'revenue' | 'profit' | 'avgDaily')[];
  };
  
  chartConfig?: {
    height?: number;
    showLegend?: boolean;
    animationEnabled?: boolean;
    colorScheme?: string[];
  };
  
  activityConfig?: {
    maxItems?: number;
    showUserActions?: boolean;
    showSystemActions?: boolean;
    groupByDate?: boolean;
  };
  
  alertsConfig?: {
    maxItems?: number;
    severityFilter?: ActivitySeverity[];
    autoRefresh?: boolean;
  };
}

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  widgets: DashboardWidget[];
  gridConfig: {
    cols: number;
    rowHeight: number;
    margin: [number, number];
    containerPadding: [number, number];
  };
  createdAt: Date;
  updatedAt: Date;
}

// === TYPES POUR L'HISTORIQUE D'ACTIVITES ===

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  severity: ActivitySeverity;
  userId: string;
  userName: string;
  
  // Données spécifiques selon le type
  productId?: string;
  productName?: string;
  categoryId?: string;
  categoryName?: string;
  
  // Détails de l'action
  oldValue?: any;
  newValue?: any;
  quantity?: number;
  price?: number;
  
  // Métadonnées
  ipAddress?: string;
  userAgent?: string;
  source: 'web' | 'mobile' | 'api' | 'system';
  
  // Possibilité d'annulation
  canUndo: boolean;
  undoExpiry?: Date;
  undoneAt?: Date;
  undoneBy?: string;
  
  createdAt: Date;
}

export type ActivityType = 
  | 'product_created'
  | 'product_updated' 
  | 'product_deleted'
  | 'stock_added'
  | 'stock_removed'
  | 'sale_recorded'
  | 'price_updated'
  | 'category_changed'
  | 'stats_reset'
  | 'user_login'
  | 'user_logout'
  | 'backup_created'
  | 'data_imported'
  | 'error_occurred'
  | 'system_update';

export type ActivitySeverity = 'info' | 'success' | 'warning' | 'error' | 'critical';

export interface ActivityFilter {
  types?: ActivityType[];
  severities?: ActivitySeverity[];
  userIds?: string[];
  productIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  source?: ActivityItem['source'];
  canUndo?: boolean;
  limit?: number;
  offset?: number;
}

// === TYPES POUR LA RECHERCHE UNIVERSELLE ===

export interface SearchResult {
  id: string;
  type: 'product' | 'category' | 'supplier' | 'activity' | 'user';
  title: string;
  description: string;
  subtitle?: string;
  thumbnail?: string;
  score: number; // Score de pertinence 0-1
  url: string;
  metadata: SearchMetadata;
}

export interface SearchMetadata {
  // Métadonnées spécifiques selon le type
  product?: {
    category: string;
    price: number;
    stock: number;
    isLowStock: boolean;
  };
  
  category?: {
    productCount: number;
    totalValue: number;
  };
  
  supplier?: {
    productCount: number;
    lastOrder?: Date;
  };
  
  activity?: {
    severity: ActivitySeverity;
    type: ActivityType;
    date: Date;
  };
}

export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  resultCount: number;
  selectedResult?: SearchResult;
  searchedAt: Date;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void | Promise<void>;
  shortcut?: string;
  category: 'product' | 'stock' | 'sales' | 'reports' | 'settings';
  isEnabled: boolean;
  requiresConfirmation?: boolean;
}

// === TYPES POUR LES RAPPORTS AUTOMATIQUES ===

export interface ReportConfig {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  frequency: ReportFrequency;
  isActive: boolean;
  filters: ReportFilters;
  template: ReportTemplate;
  recipients: string[]; // emails
  lastGenerated?: Date;
  nextScheduled?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ReportType = 
  | 'sales_summary'
  | 'stock_valuation'
  | 'profit_analysis'
  | 'low_stock_alert'
  | 'category_performance'
  | 'supplier_analysis'
  | 'monthly_overview'
  | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'both';

export type ReportFrequency = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'manual';

export interface ReportFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  suppliers?: string[];
  minAmount?: number;
  maxAmount?: number;
  includeZeroStock?: boolean;
  onlyLowStock?: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  styling: ReportStyling;
}

export interface ReportSection {
  id: string;
  type: 'header' | 'summary' | 'table' | 'chart' | 'text' | 'image';
  title: string;
  order: number;
  isVisible: boolean;
  config: SectionConfig;
}

export interface SectionConfig {
  // Configuration pour les tableaux
  table?: {
    columns: TableColumn[];
    showTotals: boolean;
    sortBy?: string;
    groupBy?: string;
  };
  
  // Configuration pour les graphiques
  chart?: {
    type: 'line' | 'bar' | 'pie' | 'doughnut';
    dataSource: string;
    xAxis?: string;
    yAxis?: string;
    showLegend: boolean;
    colors?: string[];
  };
  
  // Configuration pour le texte
  text?: {
    content: string;
    fontSize: number;
    alignment: 'left' | 'center' | 'right';
  };
}

export interface TableColumn {
  key: string;
  title: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'percentage';
  width?: number;
  isVisible: boolean;
  formatter?: string;
}

export interface ReportStyling {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: {
    title: number;
    subtitle: number;
    body: number;
    small: number;
  };
  logo?: string;
  watermark?: string;
}

export interface GeneratedReport {
  id: string;
  configId: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  filePath?: string;
  fileName: string;
  fileSize: number;
  generatedAt: Date;
  generatedBy: string;
  dataSnapshot: ReportDataSnapshot;
  downloadUrl?: string;
  emailSent: boolean;
  error?: string;
}

export interface ReportDataSnapshot {
  totalProducts: number;
  totalValue: number;
  totalSales: number;
  totalProfit: number;
  lowStockCount: number;
  categories: { [key: string]: number };
  topProducts: ProductSales[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

// === TYPES POUR L'IA PREDICTIVE ===

export interface PredictionModel {
  id: string;
  name: string;
  type: PredictionType;
  algorithm: AIAlgorithm;
  isActive: boolean;
  accuracy: number; // 0-1
  lastTrained: Date;
  trainingData: {
    startDate: Date;
    endDate: Date;
    recordCount: number;
  };
  parameters: ModelParameters;
  createdAt: Date;
  updatedAt: Date;
}

export type PredictionType = 
  | 'demand_forecast'
  | 'stock_optimization'
  | 'price_optimization'
  | 'reorder_prediction'
  | 'seasonal_analysis'
  | 'trend_detection';

export type AIAlgorithm = 
  | 'linear_regression'
  | 'moving_average'
  | 'exponential_smoothing'
  | 'seasonal_decomposition'
  | 'arima'
  | 'neural_network';

export interface ModelParameters {
  windowSize?: number; // pour moving average
  alpha?: number; // pour exponential smoothing
  seasonality?: number; // pour seasonal analysis
  confidence?: number; // niveau de confiance 0-1
  horizon?: number; // nombre de périodes à prédire
  features?: string[]; // variables utilisées
}

export interface Prediction {
  id: string;
  modelId: string;
  productId: string;
  productName: string;
  type: PredictionType;
  value: number;
  confidence: number;
  date: Date;
  horizon: number; // jours dans le futur
  actualValue?: number; // valeur réelle pour validation
  accuracy?: number; // précision de cette prédiction
  metadata: PredictionMetadata;
  createdAt: Date;
}

export interface PredictionMetadata {
  currentStock?: number;
  averageDailySales?: number;
  seasonalFactor?: number;
  trendDirection?: 'up' | 'down' | 'stable';
  volatility?: number;
  externalFactors?: string[];
  recommendation?: string;
}

export interface SmartAlert {
  id: string;
  type: SmartAlertType;
  severity: 'info' | 'warning' | 'critical' | 'urgent';
  productId?: string;
  productName?: string;
  title: string;
  message: string;
  recommendation: string;
  prediction?: Prediction;
  data: any;
  isActive: boolean;
  isRead: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export type SmartAlertType = 
  | 'stockout_risk'
  | 'overstock_warning'
  | 'price_opportunity'
  | 'demand_spike'
  | 'seasonal_trend'
  | 'supplier_issue'
  | 'profit_optimization'
  | 'reorder_suggestion';

export interface TrendAnalysis {
  id: string;
  productId: string;
  productName: string;
  period: 'daily' | 'weekly' | 'monthly';
  trend: {
    direction: 'up' | 'down' | 'stable';
    strength: number; // 0-1
    velocity: number; // vitesse du changement
    confidence: number;
  };
  seasonality: {
    isDetected: boolean;
    pattern?: 'weekly' | 'monthly' | 'yearly';
    strength?: number;
    peaks?: number[];
  };
  forecast: {
    nextPeriod: number;
    confidence: number;
    range: {
      min: number;
      max: number;
    };
  };
  insights: string[];
  recommendations: AIRecommendation[];
  calculatedAt: Date;
}

export interface AIRecommendation {
  id: string;
  type: 'reorder' | 'price' | 'promotion' | 'discontinue' | 'focus';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  expectedImpact: {
    metric: string;
    value: number;
    confidence: number;
  };
  reasoning: string[];
  data: any;
  isActive: boolean;
  implementedAt?: Date;
  results?: {
    actualImpact: number;
    success: boolean;
    notes: string;
  };
  createdAt: Date;
  expiresAt: Date;
} 