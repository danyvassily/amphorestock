import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  SalesStatistics, 
  GlobalStatistics, 
  ProductSales, 
  CategorySales, 
  MonthlyStats,
  StockMovement,
  Product,
  ProductCategory
} from '../types';

// Fonction utilitaire pour nettoyer les objets avant Firebase
function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return Timestamp.fromDate(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item));
  }
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanForFirestore(value);
    }
  }
  
  return cleaned;
}

/**
 * Service de gestion des statistiques avancées
 * 📊 Gestion complète des stats de ventes et analyses
 * 💾 Sauvegarde persistante dans Firebase
 * 🔄 Calculs automatiques et mise à jour temps réel
 */
export class StatisticsService {
  private static readonly SALES_COLLECTION = 'sales_statistics';
  private static readonly GLOBAL_COLLECTION = 'global_statistics';
  private static readonly MOVEMENTS_COLLECTION = 'movements';

  /**
   * 📈 Enregistrer une vente et mettre à jour les statistiques
   */
  static async recordSale(
    product: Product, 
    quantity: number, 
    salePrice: number,
    saleType: 'verre' | 'bouteille' | 'unite' = 'unite',
    userId: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date();
      const today = this.getDateString(now);
      
      // 1. Enregistrer le mouvement de stock
      const movementRef = doc(collection(db, this.MOVEMENTS_COLLECTION));
      const movement: Omit<StockMovement, 'id'> = {
        productId: product.id,
        productName: product.nom,
        type: 'sortie',
        quantity: quantity,
        previousQuantity: product.quantite + quantity, // Avant la vente
        newQuantity: product.quantite, // Après la vente
        reason: `Vente ${saleType}`,
        notes: `Prix: ${salePrice}€`,
        createdAt: now,
        createdBy: userId
      };
      batch.set(movementRef, cleanForFirestore(movement));

      // 2. Mettre à jour les statistiques journalières
      await this.updateDailyStats(today, product, quantity, salePrice, batch);

      // 3. Mettre à jour les statistiques globales
      await this.updateGlobalStats(product, quantity, salePrice, now, batch);

      await batch.commit();
      console.log('📊 Vente enregistrée et statistiques mises à jour');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la vente:', error);
      throw error;
    }
  }

  /**
   * 📅 Mettre à jour les statistiques journalières
   */
  private static async updateDailyStats(
    dateString: string,
    product: Product,
    quantity: number,
    salePrice: number,
    batch: any
  ): Promise<void> {
    const statsRef = doc(db, this.SALES_COLLECTION, dateString);
    const statsDoc = await getDoc(statsRef);
    
    const cost = product.prixAchat * quantity;
    const revenue = salePrice * quantity;
    const profit = revenue - cost;

    if (statsDoc.exists()) {
      // Mettre à jour les stats existantes
      const currentStats = statsDoc.data() as SalesStatistics;
      
      const updatedStats: Partial<SalesStatistics> = {
        totalSales: currentStats.totalSales + quantity,
        totalRevenue: currentStats.totalRevenue + revenue,
        totalCost: currentStats.totalCost + cost,
        totalProfit: currentStats.totalProfit + profit,
        updatedAt: new Date()
      };

      // Mettre à jour les ventes par catégorie
      const categoryKey = product.categorie;
      const currentCategorySales = currentStats.salesByCategory[categoryKey] || {
        category: product.categorie,
        salesCount: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        percentage: 0
      };

      const updatedCategorySales: CategorySales = {
        ...currentCategorySales,
        salesCount: currentCategorySales.salesCount + quantity,
        revenue: currentCategorySales.revenue + revenue,
        cost: currentCategorySales.cost + cost,
        profit: currentCategorySales.profit + profit
      };

      updatedStats.salesByCategory = {
        ...currentStats.salesByCategory,
        [categoryKey]: updatedCategorySales
      };

      // Recalculer les pourcentages
      const totalRevenue = updatedStats.totalRevenue!;
      Object.keys(updatedStats.salesByCategory).forEach(key => {
        updatedStats.salesByCategory![key].percentage = 
          (updatedStats.salesByCategory![key].revenue / totalRevenue) * 100;
      });

      batch.update(statsRef, {
        ...updatedStats,
        updatedAt: serverTimestamp()
      });
    } else {
      // Créer de nouvelles stats
      const newStats: Omit<SalesStatistics, 'id'> = {
        period: 'daily',
        date: new Date(dateString),
        totalSales: quantity,
        totalRevenue: revenue,
        totalCost: cost,
        totalProfit: profit,
        salesByCategory: {
          [product.categorie]: {
            category: product.categorie,
            salesCount: quantity,
            revenue: revenue,
            cost: cost,
            profit: profit,
            percentage: 100
          }
        },
        topProducts: [{
          productId: product.id,
          productName: product.nom,
          category: product.categorie,
          salesCount: quantity,
          revenue: revenue,
          cost: cost,
          profit: profit,
          averagePrice: salePrice
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      batch.set(statsRef, cleanForFirestore({
        ...newStats,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));
    }
  }

  /**
   * 🌍 Mettre à jour les statistiques globales
   */
  private static async updateGlobalStats(
    product: Product,
    quantity: number,
    salePrice: number,
    saleDate: Date,
    batch: any
  ): Promise<void> {
    const globalRef = doc(db, this.GLOBAL_COLLECTION, 'global');
    const globalDoc = await getDoc(globalRef);
    
    const cost = product.prixAchat * quantity;
    const revenue = salePrice * quantity;
    const profit = revenue - cost;

    if (globalDoc.exists()) {
      const currentGlobalStats = globalDoc.data() as GlobalStatistics;
      
      const updatedGlobalStats: Partial<GlobalStatistics> = {
        totalSalesAllTime: currentGlobalStats.totalSalesAllTime + quantity,
        totalRevenueAllTime: currentGlobalStats.totalRevenueAllTime + revenue,
        totalProfitAllTime: currentGlobalStats.totalProfitAllTime + profit,
        updatedAt: new Date()
      };

      // Mettre à jour l'historique mensuel
      const monthKey = `${saleDate.getFullYear()}-${saleDate.getMonth() + 1}`;
      const monthlyHistory = [...currentGlobalStats.monthlyHistory];
      const existingMonthIndex = monthlyHistory.findIndex(
        m => m.year === saleDate.getFullYear() && m.month === saleDate.getMonth() + 1
      );

      if (existingMonthIndex >= 0) {
        monthlyHistory[existingMonthIndex] = {
          ...monthlyHistory[existingMonthIndex],
          sales: monthlyHistory[existingMonthIndex].sales + quantity,
          revenue: monthlyHistory[existingMonthIndex].revenue + revenue,
          profit: monthlyHistory[existingMonthIndex].profit + profit
        };
      } else {
        monthlyHistory.push({
          year: saleDate.getFullYear(),
          month: saleDate.getMonth() + 1,
          sales: quantity,
          revenue: revenue,
          profit: profit,
          date: new Date(saleDate.getFullYear(), saleDate.getMonth(), 1)
        });
      }

      // Garder seulement les 12 derniers mois
      monthlyHistory.sort((a, b) => b.year - a.year || b.month - a.month);
      updatedGlobalStats.monthlyHistory = monthlyHistory.slice(0, 12);

      batch.update(globalRef, {
        ...updatedGlobalStats,
        updatedAt: serverTimestamp()
      });
    } else {
      // Créer les premières stats globales
      const newGlobalStats: Omit<GlobalStatistics, 'id'> = {
        totalSalesAllTime: quantity,
        totalRevenueAllTime: revenue,
        totalProfitAllTime: profit,
        averageDailySales: quantity,
        averageDailyRevenue: revenue,
        monthlyHistory: [{
          year: saleDate.getFullYear(),
          month: saleDate.getMonth() + 1,
          sales: quantity,
          revenue: revenue,
          profit: profit,
          date: new Date(saleDate.getFullYear(), saleDate.getMonth(), 1)
        }],
        topSellingProducts: [],
        mostProfitableProducts: [],
        firstSaleDate: saleDate,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      batch.set(globalRef, cleanForFirestore({
        ...newGlobalStats,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));
    }
  }

  /**
   * 📊 Récupérer les statistiques globales
   */
  static async getGlobalStatistics(): Promise<GlobalStatistics | null> {
    try {
      const globalRef = doc(db, this.GLOBAL_COLLECTION, 'global');
      const globalDoc = await getDoc(globalRef);
      
      if (globalDoc.exists()) {
        const data = globalDoc.data();
        return {
          id: 'global',
          ...data,
          firstSaleDate: data.firstSaleDate?.toDate() || new Date(),
          lastResetDate: data.lastResetDate?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          monthlyHistory: data.monthlyHistory?.map((m: any) => ({
            ...m,
            date: m.date?.toDate() || new Date(m.year, m.month - 1, 1)
          })) || []
        } as GlobalStatistics;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération des stats globales:', error);
      return null;
    }
  }

  /**
   * 📅 Récupérer les statistiques pour une période
   */
  static async getStatisticsByPeriod(
    startDate: Date, 
    endDate: Date
  ): Promise<SalesStatistics[]> {
    try {
      const startString = this.getDateString(startDate);
      const endString = this.getDateString(endDate);
      
      const q = query(
        collection(db, this.SALES_COLLECTION),
        where('__name__', '>=', startString),
        where('__name__', '<=', endString),
        orderBy('__name__', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as SalesStatistics[];
    } catch (error) {
      console.error('Erreur lors de la récupération des stats par période:', error);
      return [];
    }
  }

  /**
   * 🔄 Remettre à zéro toutes les statistiques
   */
  static async resetAllStatistics(): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // 1. Supprimer toutes les stats journalières
      const salesQuery = query(collection(db, this.SALES_COLLECTION));
      const salesSnapshot = await getDocs(salesQuery);
      salesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // 2. Supprimer tous les mouvements
      const movementsQuery = query(collection(db, this.MOVEMENTS_COLLECTION));
      const movementsSnapshot = await getDocs(movementsQuery);
      movementsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // 3. Remettre à zéro les stats globales
      const globalRef = doc(db, this.GLOBAL_COLLECTION, 'global');
      const resetGlobalStats: Partial<GlobalStatistics> = {
        totalSalesAllTime: 0,
        totalRevenueAllTime: 0,
        totalProfitAllTime: 0,
        averageDailySales: 0,
        averageDailyRevenue: 0,
        monthlyHistory: [],
        topSellingProducts: [],
        mostProfitableProducts: [],
        lastResetDate: new Date(),
        updatedAt: new Date()
      };

      batch.set(globalRef, cleanForFirestore({
        ...resetGlobalStats,
        lastResetDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      }), { merge: true });

      await batch.commit();
      console.log('🔄 Toutes les statistiques ont été remises à zéro');
    } catch (error) {
      console.error('Erreur lors de la remise à zéro des statistiques:', error);
      throw error;
    }
  }

  /**
   * 🛠️ Utilitaires
   */
  private static getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 📈 Calculer les moyennes sur une période
   */
  static calculateAverages(stats: SalesStatistics[]): {
    avgDailySales: number;
    avgDailyRevenue: number;
    avgDailyProfit: number;
  } {
    if (stats.length === 0) {
      return { avgDailySales: 0, avgDailyRevenue: 0, avgDailyProfit: 0 };
    }

    const totals = stats.reduce((acc, stat) => ({
      sales: acc.sales + stat.totalSales,
      revenue: acc.revenue + stat.totalRevenue,
      profit: acc.profit + stat.totalProfit
    }), { sales: 0, revenue: 0, profit: 0 });

    return {
      avgDailySales: totals.sales / stats.length,
      avgDailyRevenue: totals.revenue / stats.length,
      avgDailyProfit: totals.profit / stats.length
    };
  }
}