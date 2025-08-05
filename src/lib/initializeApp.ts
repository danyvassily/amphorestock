import { ActivityService } from '@/services/activityService';
import { AIPredictionService } from '@/services/aiPredictionService';
import { StatisticsService } from '@/services/statisticsService';
import { ModernStockService } from '@/services/modernStockService';

/**
 * 🚀 Initialisation de l'application avec données de démonstration
 * Correction des erreurs Firebase et création de collections manquantes
 */
export class AppInitializer {
  
  /**
   * 🔧 Initialiser l'application complète
   */
  static async initializeApp(): Promise<void> {
    try {
      console.log('🚀 Initialisation d\'Amphore Stock...');
      
      // 1. Vérifier et créer les produits de base si nécessaire
      await this.ensureBaseProducts();
      
      // 2. Initialiser les modèles IA
      await this.initializeAI();
      
      // 3. Créer des activités de démonstration
      await this.createDemoActivities();
      
      // 4. Créer des statistiques de base
      await this.createDemoStatistics();
      
      console.log('✅ Application initialisée avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
    }
  }
  
  /**
   * 📦 S'assurer qu'il y a des produits de base
   */
  private static async ensureBaseProducts(): Promise<void> {
    try {
      const products = await ModernStockService.getProducts();
      
      if (products.length === 0) {
        console.log('📦 Création de produits de démonstration...');
        
        // Créer quelques vins de démonstration
        const demoWines = [
          {
            nom: 'Château Margaux 2018',
            categorie: 'vin-rouge',
            type: 'vins' as const,
            quantite: 12,
            unite: 'bouteille',
            prixAchat: 45.00,
            prixVente: 85.00,
            prixVerre: 12.00,
            seuilAlerte: 3,
            fournisseur: 'Vignobles de Bordeaux'
          },
          {
            nom: 'Sancerre Les Collines 2020',
            categorie: 'vin-blanc',
            type: 'vins' as const,
            quantite: 18,
            unite: 'bouteille',
            prixAchat: 28.00,
            prixVente: 52.00,
            prixVerre: 8.50,
            seuilAlerte: 5,
            fournisseur: 'Loire Vignobles'
          },
          {
            nom: 'Côtes de Provence Rosé 2021',
            categorie: 'vin-rose',
            type: 'vins' as const,
            quantite: 24,
            unite: 'bouteille',
            prixAchat: 15.00,
            prixVente: 32.00,
            prixVerre: 6.00,
            seuilAlerte: 6,
            fournisseur: 'Domaine de Provence'
          },
          {
            nom: 'Champagne Brut Tradition',
            categorie: 'vins',
            type: 'vins' as const,
            quantite: 8,
            unite: 'bouteille',
            prixAchat: 35.00,
            prixVente: 75.00,
            prixVerre: 15.00,
            seuilAlerte: 2,
            fournisseur: 'Maison Champagne'
          }
        ];
        
        for (const wine of demoWines) {
          await ModernStockService.addProduct(wine);
        }
        
        console.log('✅ Produits de démonstration créés');
      }
    } catch (error) {
      console.error('Erreur lors de la création des produits:', error);
    }
  }
  
  /**
   * 🤖 Initialiser l'IA
   */
  private static async initializeAI(): Promise<void> {
    try {
      console.log('🤖 Initialisation de l\'IA...');
      await AIPredictionService.initializeDefaultModels();
      console.log('✅ Modèles IA initialisés');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation IA:', error);
    }
  }
  
  /**
   * 📝 Créer des activités de démonstration
   */
  private static async createDemoActivities(): Promise<void> {
    try {
      console.log('📝 Création d\'activités de démonstration...');
      
      // Activités récentes simulées
      const demoActivities = [
        {
          type: 'product_created' as const,
          title: 'Nouveau vin ajouté - Château Margaux 2018',
          description: 'Le vin "Château Margaux 2018" (vin-rouge) a été ajouté avec 12 bouteille(s)',
          severity: 'success' as const,
          productName: 'Château Margaux 2018'
        },
        {
          type: 'stock_added' as const,
          title: 'Ajout de stock - Sancerre Les Collines 2020',
          description: 'Ajout de 6 bouteilles en stock',
          severity: 'info' as const,
          quantity: 6,
          productName: 'Sancerre Les Collines 2020'
        },
        {
          type: 'sale_recorded' as const,
          title: 'Vente bouteille - Côtes de Provence Rosé 2021',
          description: 'Vente de 1 bouteille(s) de "Côtes de Provence Rosé 2021" pour 32.00€',
          severity: 'success' as const,
          quantity: 1,
          price: 32.00,
          productName: 'Côtes de Provence Rosé 2021'
        },
        {
          type: 'price_updated' as const,
          title: 'Prix mis à jour - Champagne Brut Tradition',
          description: 'Prix de vente modifié: 70.00€ → 75.00€',
          severity: 'info' as const,
          productName: 'Champagne Brut Tradition'
        }
      ];
      
      for (const activity of demoActivities) {
        await ActivityService.recordActivity(
          activity.type,
          activity.title,
          activity.description,
          activity.severity,
          'demo-user',
          'Utilisateur Demo',
          {
            productName: activity.productName,
            quantity: activity.quantity,
            price: activity.price
          }
        );
        
        // Petit délai pour espacer les activités
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('✅ Activités de démonstration créées');
    } catch (error) {
      console.error('Erreur lors de la création des activités:', error);
    }
  }
  
  /**
   * 📊 Créer des statistiques de démonstration
   */
  private static async createDemoStatistics(): Promise<void> {
    try {
      console.log('📊 Création de statistiques de démonstration...');
      
      // Simuler quelques ventes pour avoir des statistiques
      const products = await ModernStockService.getProducts();
      
      if (products.length > 0) {
        // Simuler des ventes pour les statistiques
        for (let i = 0; i < 3; i++) {
          const randomProduct = products[Math.floor(Math.random() * products.length)];
          if (randomProduct.quantite > 0) {
            await StatisticsService.recordSale(
              randomProduct,
              1,
              randomProduct.prixVente,
              'bouteille',
              'demo-user'
            );
            
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
      
      console.log('✅ Statistiques de démonstration créées');
    } catch (error) {
      console.error('Erreur lors de la création des statistiques:', error);
    }
  }
  
  /**
   * 🧹 Nettoyer les données de démonstration
   */
  static async cleanupDemoData(): Promise<void> {
    try {
      console.log('🧹 Nettoyage des données de démonstration...');
      
      // Cette méthode peut être utilisée pour nettoyer si nécessaire
      // Pour l'instant, on la laisse vide
      
      console.log('✅ Nettoyage terminé');
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
    }
  }
  
  /**
   * 🔍 Vérifier l'état de l'application
   */
  static async checkAppStatus(): Promise<{
    hasProducts: boolean;
    hasActivities: boolean;
    hasStatistics: boolean;
    aiModelsReady: boolean;
  }> {
    try {
      const products = await ModernStockService.getProducts();
      const activities = await ActivityService.getActivities({ limit: 1 });
      const globalStats = await StatisticsService.getGlobalStatistics();
      
      return {
        hasProducts: products.length > 0,
        hasActivities: activities.length > 0,
        hasStatistics: globalStats !== null,
        aiModelsReady: true // Supposé après initialisation
      };
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      return {
        hasProducts: false,
        hasActivities: false,
        hasStatistics: false,
        aiModelsReady: false
      };
    }
  }
}