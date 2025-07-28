import { 
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, StockMovement, AIRequest, AIResponse } from '@/types';

export class AIService {
  private static GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  private static GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  /**
   * Envoie une requête à l'API Gemini
   */
  static async sendRequest(request: AIRequest): Promise<AIResponse> {
    try {
      if (!this.GEMINI_API_KEY) {
        throw new Error('Clé API Gemini manquante');
      }

      const response = await fetch(`${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: request.prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur API (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Aucune réponse générée');
      }

      const content = data.candidates[0].content;
      if (!content || !content.parts || content.parts.length === 0) {
        throw new Error('Contenu de réponse invalide');
      }

      return {
        success: true,
        response: content.parts[0].text,
        usage: data.usageMetadata,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erreur AIService:', error);
      return {
        success: false,
        response: '',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Récupère les données de stock avec gestion d'erreurs améliorée
   */
  static async getStockData(): Promise<{ products: Product[], movements: StockMovement[] }> {
    try {
      // Récupération des produits - requête simple sans orderBy pour éviter les erreurs d'index
      const stockSnapshot = await getDocs(collection(db, 'stocks'));
      const products = stockSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Product[];

      // Récupération des mouvements récents - requête simple avec limite
      let movements: StockMovement[] = [];
      try {
        const movementsQuery = query(
          collection(db, 'stock-movements'),
          limit(50) // Limiter pour éviter les timeouts
        );
        const movementsSnapshot = await getDocs(movementsQuery);
        movements = movementsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as StockMovement[];
      } catch (movError) {
        console.warn('Erreur lors de la récupération des mouvements:', movError);
        // Continuer sans les mouvements plutôt que d'échouer complètement
      }

      return { products, movements };
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      throw new Error(`Impossible de récupérer les données: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Analyse les données de stock avec une période donnée
   */
  static async analyzeStockData(startDate: Date, endDate: Date): Promise<{
    products: Product[];
    movements: StockMovement[];
    summary: string;
  }> {
    try {
      // Récupération des produits
      const stockSnapshot = await getDocs(collection(db, 'stocks'));
      const products = stockSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Product[];

      // Récupération des mouvements pour la période - requête simplifiée
      let movements: StockMovement[] = [];
      try {
        // Faire deux requêtes séparées pour éviter les erreurs d'index composé
        const movementsQuery = query(
          collection(db, 'stock-movements'),
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          limit(100) // Limiter les résultats
        );
        const movementsSnapshot = await getDocs(movementsQuery);
        
        // Filtrer côté client pour la date de fin
        movements = movementsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          }))
          .filter(movement => movement.createdAt <= endDate) as StockMovement[];
      } catch (movError) {
        console.warn('Erreur lors de la récupération des mouvements par période:', movError);
      }

      // Générer un résumé
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.isActive).length;
      const lowStockProducts = products.filter(p => p.quantite <= p.seuilAlerte).length;
      const totalMovements = movements.length;

      const summary = `Période du ${startDate.toLocaleDateString()} au ${endDate.toLocaleDateString()}:\n` +
        `- Total produits: ${totalProducts} (${activeProducts} actifs)\n` +
        `- Produits en stock faible: ${lowStockProducts}\n` +
        `- Mouvements de stock: ${totalMovements}`;

      return {
        products,
        movements,
        summary
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse des données:', error);
      throw new Error(`Erreur d'analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Génère un rapport de stock avec gestion d'erreurs
   */
  static async generateStockReport(): Promise<string> {
    try {
      const stockSnapshot = await getDocs(collection(db, 'stocks'));
      const products = stockSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Product[];

      if (products.length === 0) {
        return "Aucun produit trouvé dans la base de données.";
      }

      // Calculer les statistiques
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.isActive).length;
      const lowStockProducts = products.filter(p => p.quantite <= p.seuilAlerte);
      const totalValue = products.reduce((sum, p) => sum + (p.quantite * p.prixAchat), 0);

      // Grouper par catégorie
      const categoriesStats = products.reduce((stats: any, product) => {
        const category = product.categorie;
        if (!stats[category]) {
          stats[category] = { count: 0, value: 0, lowStock: 0 };
        }
        stats[category].count += 1;
        stats[category].value += product.quantite * product.prixAchat;
        if (product.quantite <= product.seuilAlerte) {
          stats[category].lowStock += 1;
        }
        return stats;
      }, {});

      return `📊 RAPPORT DE STOCK\n\n` +
        `📦 Vue d'ensemble:\n` +
        `• Total produits: ${totalProducts}\n` +
        `• Produits actifs: ${activeProducts}\n` +
        `• Valeur totale: €${totalValue.toFixed(2)}\n\n` +
        `⚠️ Alertes:\n` +
        `• Produits en stock faible: ${lowStockProducts.length}\n\n` +
        `📋 Par catégorie:\n` +
        Object.entries(categoriesStats)
          .map(([cat, stats]: [string, any]) => 
            `• ${cat}: ${stats.count} produits (€${stats.value.toFixed(2)}) - ${stats.lowStock} en stock faible`)
          .join('\n');

    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      return `Erreur lors de la génération du rapport: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
    }
  }

  /**
   * Analyse les ventes avec requête optimisée
   */
  static async analyzeSales(days: number = 30): Promise<string> {
    try {
      const stockSnapshot = await getDocs(collection(db, 'stocks'));
      const products = stockSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);

      // Requête simplifiée pour les ventes
      let salesMovements: StockMovement[] = [];
      try {
        const recentMovementsQuery = query(
          collection(db, 'stock-movements'),
          where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
          limit(200) // Limiter les résultats
        );
        const movementsSnapshot = await getDocs(recentMovementsQuery);
        
        // Filtrer les ventes côté client
        salesMovements = movementsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          }))
          .filter(mov => mov.type === 'sortie') as StockMovement[];
      } catch (movError) {
        console.warn('Erreur lors de la récupération des ventes:', movError);
      }

      if (salesMovements.length === 0) {
        return `Aucune vente trouvée sur les ${days} derniers jours.`;
      }

      const totalSales = salesMovements.reduce((sum, mov) => sum + mov.quantity, 0);
      const uniqueProducts = new Set(salesMovements.map(mov => mov.productId)).size;

      // Top produits vendus
      const productSales = salesMovements.reduce((acc: any, mov) => {
        if (!acc[mov.productName]) {
          acc[mov.productName] = 0;
        }
        acc[mov.productName] += mov.quantity;
        return acc;
      }, {});

      const topProducts = Object.entries(productSales)
        .sort(([,a]: [string, any], [,b]: [string, any]) => b - a)
        .slice(0, 5);

      return `📈 ANALYSE DES VENTES (${days} derniers jours)\n\n` +
        `📊 Résumé:\n` +
        `• Total unités vendues: ${totalSales}\n` +
        `• Produits différents vendus: ${uniqueProducts}\n` +
        `• Moyenne par jour: ${(totalSales / days).toFixed(1)} unités\n\n` +
        `🏆 Top 5 des ventes:\n` +
        topProducts.map(([name, qty]: [string, any], idx) => 
          `${idx + 1}. ${name}: ${qty} unités`).join('\n');

    } catch (error) {
      console.error('Erreur lors de l\'analyse des ventes:', error);
      return `Erreur lors de l'analyse des ventes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
    }
  }
} 