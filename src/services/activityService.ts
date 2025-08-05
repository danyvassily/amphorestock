import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  writeBatch,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  ActivityItem, 
  ActivityType, 
  ActivitySeverity, 
  ActivityFilter,
  Product
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
 * Service de gestion de l'historique des activités
 * 📝 Enregistrement de toutes les actions utilisateur
 * 🔄 Synchronisation temps réel
 * ⏪ Possibilité d'annulation des actions
 */
export class ActivityService {
  private static readonly COLLECTION_NAME = 'activities';
  private static readonly MAX_ACTIVITIES = 1000; // Limiter le nombre d'activités stockées

  /**
   * 📝 Enregistrer une nouvelle activité
   */
  static async recordActivity(
    type: ActivityType,
    title: string,
    description: string,
    severity: ActivitySeverity = 'info',
    userId: string = 'anonymous',
    userName: string = 'Utilisateur',
    additionalData: Partial<ActivityItem> = {}
  ): Promise<string> {
    try {
      const now = new Date();
      
      const activity: Omit<ActivityItem, 'id'> = {
        type,
        title,
        description,
        severity,
        userId,
        userName,
        source: 'web',
        canUndo: this.canBeUndone(type),
        undoExpiry: this.canBeUndone(type) 
          ? new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24h pour annuler
          : undefined,
        createdAt: now,
        ...additionalData
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), cleanForFirestore(activity));

      // Nettoyer les anciennes activités si nécessaire
      await this.cleanupOldActivities();

      console.log(`📝 Activité enregistrée: ${type} - ${title}`);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'activité:', error);
      throw error;
    }
  }

  /**
   * 📦 Enregistrer une activité liée à un produit
   */
  static async recordProductActivity(
    type: ActivityType,
    product: Product,
    action: string,
    severity: ActivitySeverity = 'info',
    userId: string = 'anonymous',
    userName: string = 'Utilisateur',
    additionalData: any = {}
  ): Promise<string> {
    const title = `${action} - ${product.nom}`;
    const description = `${action} pour le produit "${product.nom}" (${product.categorie})`;

    return this.recordActivity(
      type,
      title,
      description,
      severity,
      userId,
      userName,
      {
        productId: product.id,
        productName: product.nom,
        categoryId: product.categorie,
        categoryName: product.categorie,
        ...additionalData
      }
    );
  }

  /**
   * 🛒 Enregistrer une vente
   */
  static async recordSaleActivity(
    product: Product,
    quantity: number,
    price: number,
    saleType: 'verre' | 'bouteille' | 'unite',
    userId: string = 'anonymous',
    userName: string = 'Utilisateur'
  ): Promise<string> {
    const total = quantity * price;
    const title = `Vente ${saleType} - ${product.nom}`;
    const description = `Vente de ${quantity} ${saleType}(s) de "${product.nom}" pour ${total.toFixed(2)}€`;

    return this.recordActivity(
      'sale_recorded',
      title,
      description,
      'success',
      userId,
      userName,
      {
        productId: product.id,
        productName: product.nom,
        categoryId: product.categorie,
        quantity,
        price,
        newValue: { saleType, total },
        canUndo: false // Les ventes ne peuvent pas être annulées
      }
    );
  }

  /**
   * 📈 Enregistrer une modification de stock
   */
  static async recordStockActivity(
    product: Product,
    oldQuantity: number,
    newQuantity: number,
    reason: string,
    userId: string = 'anonymous',
    userName: string = 'Utilisateur'
  ): Promise<string> {
    const diff = newQuantity - oldQuantity;
    const action = diff > 0 ? 'Ajout de stock' : 'Retrait de stock';
    const type: ActivityType = diff > 0 ? 'stock_added' : 'stock_removed';
    
    const title = `${action} - ${product.nom}`;
    const description = `${action} de ${Math.abs(diff)} unité(s) pour "${product.nom}". ${reason}`;

    return this.recordActivity(
      type,
      title,
      description,
      'info',
      userId,
      userName,
      {
        productId: product.id,
        productName: product.nom,
        categoryId: product.categorie,
        quantity: Math.abs(diff),
        oldValue: oldQuantity,
        newValue: newQuantity
      }
    );
  }

  /**
   * 📋 Récupérer les activités avec filtres
   */
  static async getActivities(filter: ActivityFilter = {}): Promise<ActivityItem[]> {
    try {
      // Requête simple sans index complexes pour éviter les erreurs Firebase
      let q = collection(db, this.COLLECTION_NAME);
      const constraints: any[] = [];

      // Tri par date décroissante (toujours en premier)
      constraints.push(orderBy('createdAt', 'desc'));

      // Limite (appliquée côté serveur)
      const serverLimit = filter.limit || 50;
      constraints.push(firestoreLimit(serverLimit));

      const queryRef = query(q, ...constraints);
      const querySnapshot = await getDocs(queryRef);

      let activities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        undoExpiry: doc.data().undoExpiry?.toDate(),
        undoneAt: doc.data().undoneAt?.toDate()
      })) as ActivityItem[];

      // Filtres côté client pour éviter les erreurs d'index Firebase
      if (filter.types && filter.types.length > 0) {
        activities = activities.filter(activity => filter.types!.includes(activity.type));
      }

      if (filter.severities && filter.severities.length > 0) {
        activities = activities.filter(activity => filter.severities!.includes(activity.severity));
      }

      if (filter.userIds && filter.userIds.length > 0) {
        activities = activities.filter(activity => filter.userIds!.includes(activity.userId));
      }

      if (filter.productIds && filter.productIds.length > 0) {
        activities = activities.filter(activity => 
          activity.productId && filter.productIds!.includes(activity.productId)
        );
      }

      if (filter.source) {
        activities = activities.filter(activity => activity.source === filter.source);
      }

      if (filter.canUndo !== undefined) {
        activities = activities.filter(activity => activity.canUndo === filter.canUndo);
      }

      if (filter.dateRange) {
        const { start, end } = filter.dateRange;
        activities = activities.filter(activity => 
          activity.createdAt >= start && activity.createdAt <= end
        );
      }

      // Appliquer la limite finale côté client si nécessaire
      if (filter.limit && activities.length > filter.limit) {
        activities = activities.slice(0, filter.limit);
      }

      return activities;
    } catch (error) {
      console.error('Erreur lors de la récupération des activités:', error);
      // En cas d'erreur (collection n'existe pas), retourner un tableau vide
      return [];
    }
  }

  /**
   * 🔄 S'abonner aux activités en temps réel
   */
  static subscribeToActivities(
    callback: (activities: ActivityItem[]) => void,
    filter: ActivityFilter = {}
  ): () => void {
    try {
      let q = collection(db, this.COLLECTION_NAME);
      const constraints: any[] = [];

      // Appliquer les mêmes filtres que getActivities
      if (filter.types && filter.types.length > 0) {
        constraints.push(where('type', 'in', filter.types));
      }

      // Limiter à 50 activités récentes par défaut
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(firestoreLimit(filter.limit || 50));

      const queryRef = query(q, ...constraints);

      return onSnapshot(queryRef, (querySnapshot) => {
        const activities = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          undoExpiry: doc.data().undoExpiry?.toDate(),
          undoneAt: doc.data().undoneAt?.toDate()
        })) as ActivityItem[];

        callback(activities);
      });
    } catch (error) {
      console.error('Erreur lors de l\'abonnement aux activités:', error);
      return () => {};
    }
  }

  /**
   * ⏪ Annuler une activité
   */
  static async undoActivity(
    activityId: string,
    userId: string,
    userName: string
  ): Promise<boolean> {
    try {
      const activityRef = doc(db, this.COLLECTION_NAME, activityId);
      const activityDoc = await getDoc(activityRef);

      if (!activityDoc.exists()) {
        throw new Error('Activité non trouvée');
      }

      const activity = activityDoc.data() as ActivityItem;

      // Vérifier si l'annulation est possible
      if (!activity.canUndo) {
        throw new Error('Cette activité ne peut pas être annulée');
      }

      if (activity.undoneAt) {
        throw new Error('Cette activité a déjà été annulée');
      }

      if (activity.undoExpiry && new Date() > activity.undoExpiry.toDate()) {
        throw new Error('Le délai d\'annulation a expiré');
      }

      // Marquer comme annulée
      await updateDoc(activityRef, {
        undoneAt: Timestamp.fromDate(new Date()),
        undoneBy: userId
      });

      // Enregistrer l'annulation comme nouvelle activité
      await this.recordActivity(
        'system_update',
        `Annulation: ${activity.title}`,
        `L'activité "${activity.title}" a été annulée par ${userName}`,
        'warning',
        userId,
        userName,
        {
          productId: activity.productId,
          productName: activity.productName,
          oldValue: activity.newValue,
          newValue: activity.oldValue,
          canUndo: false
        }
      );

      console.log(`⏪ Activité annulée: ${activity.title}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      throw error;
    }
  }

  /**
   * 🧹 Nettoyer les anciennes activités
   */
  private static async cleanupOldActivities(): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        firestoreLimit(this.MAX_ACTIVITIES + 100) // Prendre un peu plus pour nettoyer
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.docs.length > this.MAX_ACTIVITIES) {
        const batch = writeBatch(db);
        const docsToDelete = querySnapshot.docs.slice(this.MAX_ACTIVITIES);

        docsToDelete.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`🧹 ${docsToDelete.length} anciennes activités supprimées`);
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des activités:', error);
    }
  }

  /**
   * 🔍 Rechercher dans les activités
   */
  static async searchActivities(searchTerm: string, limit: number = 20): Promise<ActivityItem[]> {
    try {
      // Note: Firestore ne supporte pas la recherche full-text
      // On fait une recherche approximative sur le titre et la description
      const activities = await this.getActivities({ limit: 500 });
      
      const searchTermLower = searchTerm.toLowerCase();
      
      return activities
        .filter(activity => 
          activity.title.toLowerCase().includes(searchTermLower) ||
          activity.description.toLowerCase().includes(searchTermLower) ||
          activity.productName?.toLowerCase().includes(searchTermLower) ||
          activity.userName.toLowerCase().includes(searchTermLower)
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la recherche d\'activités:', error);
      return [];
    }
  }

  /**
   * 📊 Obtenir des statistiques d'activité
   */
  static async getActivityStats(days: number = 7): Promise<{
    totalActivities: number;
    activitiesByType: { [key: string]: number };
    activitiesByDay: { date: string; count: number }[];
    topUsers: { userId: string; userName: string; count: number }[];
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activities = await this.getActivities({
        dateRange: { start: startDate, end: new Date() },
        limit: 1000
      });

      // Activités par type
      const activitiesByType: { [key: string]: number } = {};
      activities.forEach(activity => {
        activitiesByType[activity.type] = (activitiesByType[activity.type] || 0) + 1;
      });

      // Activités par jour
      const activitiesByDay: { [key: string]: number } = {};
      activities.forEach(activity => {
        const dateKey = activity.createdAt.toISOString().split('T')[0];
        activitiesByDay[dateKey] = (activitiesByDay[dateKey] || 0) + 1;
      });

      // Top utilisateurs
      const userCounts: { [key: string]: { userName: string; count: number } } = {};
      activities.forEach(activity => {
        if (!userCounts[activity.userId]) {
          userCounts[activity.userId] = { userName: activity.userName, count: 0 };
        }
        userCounts[activity.userId].count++;
      });

      const topUsers = Object.entries(userCounts)
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalActivities: activities.length,
        activitiesByType,
        activitiesByDay: Object.entries(activitiesByDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        topUsers
      };
    } catch (error) {
      console.error('Erreur lors du calcul des stats d\'activité:', error);
      return {
        totalActivities: 0,
        activitiesByType: {},
        activitiesByDay: [],
        topUsers: []
      };
    }
  }

  /**
   * ❓ Déterminer si un type d'activité peut être annulé
   */
  private static canBeUndone(type: ActivityType): boolean {
    const undoableTypes: ActivityType[] = [
      'product_created',
      'product_updated',
      'product_deleted',
      'stock_added',
      'stock_removed',
      'price_updated',
      'category_changed'
    ];

    return undoableTypes.includes(type);
  }

  /**
   * 🎨 Obtenir l'icône pour un type d'activité
   */
  static getActivityIcon(type: ActivityType): string {
    const icons: { [key in ActivityType]: string } = {
      product_created: '➕',
      product_updated: '✏️',
      product_deleted: '🗑️',
      stock_added: '📈',
      stock_removed: '📉',
      sale_recorded: '🛒',
      price_updated: '💰',
      category_changed: '🏷️',
      stats_reset: '🔄',
      user_login: '🔑',
      user_logout: '🚪',
      backup_created: '💾',
      data_imported: '📥',
      error_occurred: '❌',
      system_update: '⚙️'
    };

    return icons[type] || '📝';
  }

  /**
   * 🎨 Obtenir la couleur pour une sévérité
   */
  static getSeverityColor(severity: ActivitySeverity): string {
    const colors: { [key in ActivitySeverity]: string } = {
      info: 'text-blue-600',
      success: 'text-green-600',
      warning: 'text-orange-600',
      error: 'text-red-600',
      critical: 'text-red-800'
    };

    return colors[severity];
  }
}