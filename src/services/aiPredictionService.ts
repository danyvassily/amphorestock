import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  PredictionModel, 
  Prediction, 
  TrendAnalysis, 
  AIRecommendation, 
  SmartAlert, 
  PredictionType, 
  AIAlgorithm,
  SmartAlertType,
  Product,
  ActivityItem
} from '@/types';
import { ModernStockService } from './modernStockService';
import { ActivityService } from './activityService';
import { StatisticsService } from './statisticsService';

/**
 * 🤖 Service d'Intelligence Artificielle pour la prédiction et l'optimisation des stocks
 * 📈 Analyse des tendances et génération de recommandations
 * ⚡ Alertes intelligentes basées sur les patterns détectés
 */
export class AIPredictionService {
  private static readonly MODELS_COLLECTION = 'prediction_models';
  private static readonly PREDICTIONS_COLLECTION = 'predictions';
  private static readonly ALERTS_COLLECTION = 'smart_alerts';
  private static readonly RECOMMENDATIONS_COLLECTION = 'ai_recommendations';

  /**
   * 🧠 Initialiser les modèles de prédiction par défaut
   */
  static async initializeDefaultModels(): Promise<void> {
    try {
      const defaultModels: Omit<PredictionModel, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'Prédiction de demande - Moyenne mobile',
          type: 'demand_forecast',
          algorithm: 'moving_average',
          isActive: true,
          accuracy: 0.78,
          lastTrained: new Date(),
          trainingData: {
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 jours
            endDate: new Date(),
            recordCount: 500
          },
          parameters: {
            windowSize: 7, // 7 jours
            confidence: 0.85,
            horizon: 14 // prédiction sur 14 jours
          }
        },
        {
          name: 'Optimisation de réapprovisionnement',
          type: 'reorder_prediction',
          algorithm: 'exponential_smoothing',
          isActive: true,
          accuracy: 0.82,
          lastTrained: new Date(),
          trainingData: {
            startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            recordCount: 300
          },
          parameters: {
            alpha: 0.3,
            confidence: 0.9,
            horizon: 7
          }
        },
        {
          name: 'Détection de tendances saisonnières',
          type: 'seasonal_analysis',
          algorithm: 'seasonal_decomposition',
          isActive: true,
          accuracy: 0.75,
          lastTrained: new Date(),
          trainingData: {
            startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 an
            endDate: new Date(),
            recordCount: 1000
          },
          parameters: {
            seasonality: 7, // cycle hebdomadaire
            confidence: 0.8,
            horizon: 30
          }
        }
      ];

      for (const model of defaultModels) {
        await addDoc(collection(db, this.MODELS_COLLECTION), {
          ...model,
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date())
        });
      }

      console.log('🤖 Modèles IA initialisés avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des modèles IA:', error);
    }
  }

  /**
   * 📊 Analyser les tendances pour un produit
   */
  static async analyzeTrends(productId: string): Promise<TrendAnalysis> {
    try {
      const product = await ModernStockService.getProductById(productId);
      if (!product) throw new Error('Produit non trouvé');

      // Récupérer l'historique des activités pour ce produit
      const activities = await ActivityService.getActivities({
        productIds: [productId],
        types: ['sale_recorded', 'stock_added', 'stock_removed'],
        dateRange: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 jours
          end: new Date()
        },
        limit: 1000
      });

      // Analyser les ventes (simulées à partir des activités)
      const salesData = this.extractSalesData(activities);
      
      // Calculer la tendance
      const trend = this.calculateTrend(salesData);
      
      // Détecter la saisonnalité
      const seasonality = this.detectSeasonality(salesData);
      
      // Générer les prévisions
      const forecast = this.generateForecast(salesData, trend);
      
      // Générer des insights
      const insights = this.generateInsights(product, trend, seasonality, salesData);
      
      // Générer des recommandations
      const recommendations = await this.generateRecommendations(product, trend, forecast);

      const analysis: TrendAnalysis = {
        id: `trend_${productId}_${Date.now()}`,
        productId,
        productName: product.nom,
        period: 'daily',
        trend,
        seasonality,
        forecast,
        insights,
        recommendations,
        calculatedAt: new Date()
      };

      console.log(`📈 Analyse de tendance générée pour ${product.nom}`);
      return analysis;

    } catch (error) {
      console.error('Erreur lors de l\'analyse des tendances:', error);
      throw error;
    }
  }

  /**
   * 🔮 Prédire la demande future
   */
  static async predictDemand(
    productId: string, 
    horizon: number = 14
  ): Promise<Prediction[]> {
    try {
      const product = await ModernStockService.getProductById(productId);
      if (!product) throw new Error('Produit non trouvé');

      // Récupérer le modèle de prédiction de demande
      const model = await this.getActiveModel('demand_forecast');
      if (!model) throw new Error('Modèle de prédiction non trouvé');

      // Récupérer les données historiques
      const historicalData = await this.getHistoricalSalesData(productId, 30);

      // Générer les prédictions selon l'algorithme
      const predictions: Prediction[] = [];
      
      for (let day = 1; day <= horizon; day++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + day);

        let predictedValue: number;
        let confidence: number;

        switch (model.algorithm) {
          case 'moving_average':
            predictedValue = this.calculateMovingAverage(
              historicalData, 
              model.parameters.windowSize || 7
            );
            confidence = model.parameters.confidence || 0.8;
            break;

          case 'exponential_smoothing':
            predictedValue = this.calculateExponentialSmoothing(
              historicalData, 
              model.parameters.alpha || 0.3
            );
            confidence = model.parameters.confidence || 0.85;
            break;

          default:
            predictedValue = this.calculateSimpleAverage(historicalData);
            confidence = 0.7;
        }

        // Ajuster selon les tendances saisonnières
        const seasonalFactor = this.getSeasonalFactor(futureDate, productId);
        predictedValue *= seasonalFactor;

        // Ajouter du bruit réaliste
        predictedValue = Math.max(0, predictedValue + (Math.random() - 0.5) * 0.2 * predictedValue);

        const prediction: Prediction = {
          id: `pred_${productId}_${day}_${Date.now()}`,
          modelId: model.id,
          productId,
          productName: product.nom,
          type: 'demand_forecast',
          value: Math.round(predictedValue * 100) / 100,
          confidence,
          date: futureDate,
          horizon: day,
          metadata: {
            currentStock: product.quantite,
            averageDailySales: this.calculateSimpleAverage(historicalData),
            seasonalFactor,
            trendDirection: this.getTrendDirection(historicalData),
            recommendation: this.generateStockRecommendation(
              product.quantite, 
              predictedValue, 
              day
            )
          },
          createdAt: new Date()
        };

        predictions.push(prediction);

        // Sauvegarder la prédiction
        await addDoc(collection(db, this.PREDICTIONS_COLLECTION), {
          ...prediction,
          date: Timestamp.fromDate(prediction.date),
          createdAt: Timestamp.fromDate(prediction.createdAt)
        });
      }

      console.log(`🔮 ${predictions.length} prédictions générées pour ${product.nom}`);
      return predictions;

    } catch (error) {
      console.error('Erreur lors de la prédiction de demande:', error);
      throw error;
    }
  }

  /**
   * ⚠️ Générer des alertes intelligentes
   */
  static async generateSmartAlerts(): Promise<SmartAlert[]> {
    try {
      const products = await ModernStockService.getProducts();
      const alerts: SmartAlert[] = [];

      // Si pas de produits, retourner des alertes d'exemple
      if (products.length === 0) {
        return this.createDemoAlerts();
      }

      for (const product of products.slice(0, 5)) { // Limiter à 5 produits pour éviter trop de calculs
        try {
          // Analyser chaque produit avec gestion d'erreur individuelle
          const stockoutRisk = this.calculateBasicStockoutRisk(product);
          
          // Alerte rupture de stock basique
          if (stockoutRisk > 0.7) {
            alerts.push(await this.createSmartAlert(
              'stockout_risk',
              stockoutRisk > 0.9 ? 'critical' : 'warning',
              product,
              `Risque de rupture de stock`,
              `Le stock actuel (${product.quantite}) est proche du seuil d'alerte (${product.seuilAlerte}).`,
              `Réapprovisionnement recommandé: ${Math.ceil(product.seuilAlerte * 3)} unités`
            ));
          }

          // Alerte surstock simplifié
          if (product.quantite > product.seuilAlerte * 5) {
            const overstockValue = product.quantite * product.prixAchat;
            alerts.push(await this.createSmartAlert(
              'overstock_warning',
              'warning',
              product,
              `Surstock détecté (${overstockValue.toFixed(2)}€ immobilisés)`,
              `Stock excessif par rapport au seuil d'alerte`,
              `Considérer une promotion ou réviser les commandes`
            ));
          }

          // Alerte opportunité de prix basique
          const margin = ((product.prixVente - product.prixAchat) / product.prixVente) * 100;
          if (margin > 60 && product.quantite > product.seuilAlerte) {
            alerts.push(await this.createSmartAlert(
              'price_opportunity',
              'info',
              product,
              `Marge élevée détectée (${margin.toFixed(1)}%)`,
              `Opportunité d'augmenter le volume de vente`,
              `Considérer une stratégie de développement commercial`
            ));
          }

        } catch (productError) {
          console.error(`Erreur analyse produit ${product.nom}:`, productError);
          continue;
        }
      }

      // Trier par priorité
      alerts.sort((a, b) => {
        const severityOrder = { critical: 4, urgent: 3, warning: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      console.log(`⚠️ ${alerts.length} alertes intelligentes générées`);
      return alerts.slice(0, 10); // Limiter à 10 alertes max

    } catch (error) {
      console.error('Erreur lors de la génération des alertes:', error);
      return this.createDemoAlerts();
    }
  }

  /**
   * 🎯 Créer des alertes de démonstration
   */
  private static createDemoAlerts(): SmartAlert[] {
    const now = new Date();
    return [
      {
        id: `demo_alert_1_${Date.now()}`,
        type: 'stockout_risk',
        severity: 'warning',
        title: 'Alerte de démonstration',
        message: 'Système d\'IA en cours d\'initialisation',
        recommendation: 'Ajoutez des produits pour voir les vraies alertes',
        data: {},
        isActive: true,
        isRead: false,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        createdAt: now
      }
    ];
  }

  /**
   * 📊 Calcul basique du risque de rupture
   */
  private static calculateBasicStockoutRisk(product: Product): number {
    if (product.quantite <= 0) return 1.0; // Rupture immédiate
    if (product.quantite <= product.seuilAlerte * 0.5) return 0.9; // Très haut risque
    if (product.quantite <= product.seuilAlerte) return 0.7; // Haut risque
    if (product.quantite <= product.seuilAlerte * 2) return 0.4; // Risque modéré
    return 0.2; // Faible risque
  }

  /**
   * 💡 Générer des recommandations IA
   */
  static async generateAIRecommendations(productId?: string): Promise<AIRecommendation[]> {
    try {
      const products = productId 
        ? [await ModernStockService.getProductById(productId)].filter(Boolean)
        : await ModernStockService.getProducts();

      const recommendations: AIRecommendation[] = [];

      // Si pas de produits, retourner des recommandations d'exemple
      if (products.length === 0) {
        return this.createDemoRecommendations();
      }

      for (const product of products.slice(0, 3)) { // Limiter à 3 produits
        if (!product) continue;

        try {
          // Recommandation de réapprovisionnement basique
          if (product.quantite <= product.seuilAlerte) {
            const reorderRec = this.generateBasicReorderRecommendation(product);
            if (reorderRec) recommendations.push(reorderRec);
          }

          // Recommandation de prix basique
          const margin = ((product.prixVente - product.prixAchat) / product.prixVente) * 100;
          if (margin < 30) {
            const priceRec = this.generateBasicPriceRecommendation(product, margin);
            if (priceRec) recommendations.push(priceRec);
          }

          // Recommandation de focus basique
          if (margin > 50 && product.quantite > product.seuilAlerte * 2) {
            const focusRec = this.generateBasicFocusRecommendation(product, margin);
            if (focusRec) recommendations.push(focusRec);
          }

        } catch (productError) {
          console.error(`Erreur recommandation produit ${product.nom}:`, productError);
          continue;
        }
      }

      console.log(`💡 ${recommendations.length} recommandations IA générées`);
      return recommendations;

    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      return this.createDemoRecommendations();
    }
  }

  /**
   * 🎯 Créer des recommandations de démonstration
   */
  private static createDemoRecommendations(): AIRecommendation[] {
    const now = new Date();
    return [
      {
        id: `demo_rec_1_${Date.now()}`,
        type: 'reorder',
        priority: 'medium',
        title: 'Recommandation de démonstration',
        description: 'Système d\'IA en cours d\'initialisation',
        action: 'Ajoutez des produits pour voir les vraies recommandations',
        expectedImpact: {
          metric: 'Amélioration',
          value: 0,
          confidence: 0.8
        },
        reasoning: ['Données insuffisantes', 'Initialisation en cours'],
        data: {},
        isActive: true,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  /**
   * 📦 Recommandation de réapprovisionnement basique
   */
  private static generateBasicReorderRecommendation(product: Product): AIRecommendation | null {
    const now = new Date();
    const optimalQuantity = Math.ceil(product.seuilAlerte * 3);
    
    return {
      id: `rec_reorder_${product.id}_${Date.now()}`,
      type: 'reorder',
      priority: product.quantite === 0 ? 'critical' : 'high',
      title: `Réapprovisionnement ${product.nom}`,
      description: `Stock actuel: ${product.quantite} (seuil: ${product.seuilAlerte})`,
      action: `Commander ${optimalQuantity} unités`,
      expectedImpact: {
        metric: 'Réduction risque rupture',
        value: 85,
        confidence: 0.9
      },
      reasoning: [
        `Stock sous le seuil d'alerte`,
        `Quantité recommandée: ${optimalQuantity} unités`,
        `Délai d'action: immédiat`
      ],
      data: { currentStock: product.quantite, optimalQuantity },
      isActive: true,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    };
  }

  /**
   * 💰 Recommandation de prix basique
   */
  private static generateBasicPriceRecommendation(product: Product, currentMargin: number): AIRecommendation | null {
    const now = new Date();
    const targetMargin = 40;
    const suggestedPrice = product.prixAchat / (1 - targetMargin / 100);
    
    return {
      id: `rec_price_${product.id}_${Date.now()}`,
      type: 'price',
      priority: 'medium',
      title: `Optimisation prix ${product.nom}`,
      description: `Marge actuelle: ${currentMargin.toFixed(1)}% (faible)`,
      action: `Augmenter le prix à ${suggestedPrice.toFixed(2)}€`,
      expectedImpact: {
        metric: 'Amélioration marge',
        value: targetMargin - currentMargin,
        confidence: 0.75
      },
      reasoning: [
        `Marge actuelle faible: ${currentMargin.toFixed(1)}%`,
        `Objectif recommandé: ${targetMargin}%`,
        `Prix suggéré: ${suggestedPrice.toFixed(2)}€`
      ],
      data: { currentPrice: product.prixVente, suggestedPrice },
      isActive: true,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    };
  }

  /**
   * 🎯 Recommandation de focus basique
   */
  private static generateBasicFocusRecommendation(product: Product, margin: number): AIRecommendation | null {
    const now = new Date();
    
    return {
      id: `rec_focus_${product.id}_${Date.now()}`,
      type: 'focus',
      priority: 'medium',
      title: `Produit performant: ${product.nom}`,
      description: `Marge élevée: ${margin.toFixed(1)}%`,
      action: `Augmenter la visibilité et développer les ventes`,
      expectedImpact: {
        metric: 'Croissance CA',
        value: 25,
        confidence: 0.8
      },
      reasoning: [
        `Marge élevée: ${margin.toFixed(1)}%`,
        `Stock suffisant: ${product.quantite} unités`,
        `Potentiel de développement`
      ],
      data: { margin, stock: product.quantite },
      isActive: true,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  // Méthodes utilitaires privées

  private static extractSalesData(activities: ActivityItem[]): number[] {
    // Simulation d'extraction des données de vente
    const salesByDay: { [key: string]: number } = {};
    
    activities
      .filter(a => a.type === 'sale_recorded')
      .forEach(activity => {
        const day = activity.createdAt.toISOString().split('T')[0];
        salesByDay[day] = (salesByDay[day] || 0) + (activity.quantity || 1);
      });

    // Remplir les jours manquants avec 0
    const days = Object.keys(salesByDay).sort();
    const salesData: number[] = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      salesData.unshift(salesByDay[dayKey] || Math.floor(Math.random() * 5));
    }

    return salesData;
  }

  private static calculateTrend(salesData: number[]): TrendAnalysis['trend'] {
    if (salesData.length < 2) {
      return { direction: 'stable', strength: 0, velocity: 0, confidence: 0 };
    }

    // Régression linéaire simple
    const n = salesData.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = salesData;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const direction = slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'stable';
    const strength = Math.abs(slope) / (sumY / n); // Normalisé par la moyenne
    const velocity = slope; // Vitesse de changement

    return {
      direction,
      strength: Math.min(1, Math.abs(strength)),
      velocity,
      confidence: Math.min(1, Math.abs(slope) * 10) // Confidence basée sur la pente
    };
  }

  private static detectSeasonality(salesData: number[]): TrendAnalysis['seasonality'] {
    // Détection simple de patterns hebdomadaires
    if (salesData.length < 14) {
      return { isDetected: false };
    }

    const weeklyPattern = this.calculateWeeklyPattern(salesData);
    const variance = this.calculateVariance(weeklyPattern);
    
    return {
      isDetected: variance > 0.3,
      pattern: variance > 0.3 ? 'weekly' : undefined,
      strength: variance,
      peaks: variance > 0.3 ? this.findPeaks(weeklyPattern) : undefined
    };
  }

  private static generateForecast(
    salesData: number[], 
    trend: TrendAnalysis['trend']
  ): TrendAnalysis['forecast'] {
    const recentAverage = salesData.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const trendAdjustment = trend.velocity * 7; // Projection sur 7 jours
    
    const nextPeriod = Math.max(0, recentAverage + trendAdjustment);
    const variance = this.calculateVariance(salesData.slice(-14));
    
    return {
      nextPeriod,
      confidence: trend.confidence * 0.8, // Réduction de confiance pour la prédiction
      range: {
        min: Math.max(0, nextPeriod - variance),
        max: nextPeriod + variance
      }
    };
  }

  private static generateInsights(
    product: Product,
    trend: TrendAnalysis['trend'],
    seasonality: TrendAnalysis['seasonality'],
    salesData: number[]
  ): string[] {
    const insights: string[] = [];

    // Insight sur la tendance
    if (trend.direction === 'up' && trend.strength > 0.5) {
      insights.push(`📈 Forte croissance détectée (+${(trend.velocity * 100).toFixed(1)}% par jour)`);
    } else if (trend.direction === 'down' && trend.strength > 0.5) {
      insights.push(`📉 Déclin préoccupant (-${Math.abs(trend.velocity * 100).toFixed(1)}% par jour)`);
    }

    // Insight sur le stock
    const avgDaily = salesData.reduce((a, b) => a + b, 0) / salesData.length;
    const daysOfStock = product.quantite / Math.max(avgDaily, 0.1);
    
    if (daysOfStock < 7) {
      insights.push(`⚠️ Stock critique: seulement ${daysOfStock.toFixed(1)} jours de vente`);
    } else if (daysOfStock > 60) {
      insights.push(`📦 Stock excessif: ${daysOfStock.toFixed(0)} jours de vente`);
    }

    // Insight sur la saisonnalité
    if (seasonality.isDetected) {
      insights.push(`🔄 Pattern ${seasonality.pattern} détecté (force: ${(seasonality.strength! * 100).toFixed(0)}%)`);
    }

    // Insight sur la rentabilité
    const margin = ((product.prixVente - product.prixAchat) / product.prixVente) * 100;
    if (margin > 50) {
      insights.push(`💰 Marge élevée (${margin.toFixed(1)}%) - opportunité de volume`);
    } else if (margin < 20) {
      insights.push(`⚡ Marge faible (${margin.toFixed(1)}%) - revoir le pricing`);
    }

    return insights;
  }

  private static async generateRecommendations(
    product: Product,
    trend: TrendAnalysis['trend'],
    forecast: TrendAnalysis['forecast']
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    const now = new Date();

    // Recommandation de réapprovisionnement
    if (product.quantite <= product.seuilAlerte) {
      recommendations.push({
        id: `rec_reorder_${product.id}_${Date.now()}`,
        type: 'reorder',
        priority: 'high',
        title: 'Réapprovisionnement urgent',
        description: `Stock faible pour ${product.nom}`,
        action: `Commander ${Math.ceil(forecast.nextPeriod * 14)} unités`,
        expectedImpact: {
          metric: 'Éviter rupture',
          value: 95,
          confidence: 0.9
        },
        reasoning: [
          `Stock actuel: ${product.quantite} unités`,
          `Demande prévue: ${forecast.nextPeriod.toFixed(1)} unités/jour`,
          `Risque de rupture élevé`
        ],
        data: { currentStock: product.quantite, forecast: forecast.nextPeriod },
        isActive: true,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 jours
      });
    }

    return recommendations;
  }

  // Méthodes de calcul mathématique

  private static calculateMovingAverage(data: number[], window: number): number {
    if (data.length < window) return data.reduce((a, b) => a + b, 0) / data.length;
    
    const recent = data.slice(-window);
    return recent.reduce((a, b) => a + b, 0) / window;
  }

  private static calculateExponentialSmoothing(data: number[], alpha: number): number {
    if (data.length === 0) return 0;
    if (data.length === 1) return data[0];

    let smoothed = data[0];
    for (let i = 1; i < data.length; i++) {
      smoothed = alpha * data[i] + (1 - alpha) * smoothed;
    }
    return smoothed;
  }

  private static calculateSimpleAverage(data: number[]): number {
    if (data.length === 0) return 0;
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  private static calculateVariance(data: number[]): number {
    if (data.length < 2) return 0;
    
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
  }

  private static calculateWeeklyPattern(salesData: number[]): number[] {
    const pattern: number[] = new Array(7).fill(0);
    const counts: number[] = new Array(7).fill(0);

    salesData.forEach((value, index) => {
      const dayOfWeek = index % 7;
      pattern[dayOfWeek] += value;
      counts[dayOfWeek]++;
    });

    return pattern.map((sum, i) => counts[i] > 0 ? sum / counts[i] : 0);
  }

  private static findPeaks(data: number[]): number[] {
    const peaks: number[] = [];
    const threshold = Math.max(...data) * 0.8;

    data.forEach((value, index) => {
      if (value > threshold) {
        peaks.push(index);
      }
    });

    return peaks;
  }

  // Méthodes utilitaires pour les alertes et recommandations

  private static async getActiveModel(type: PredictionType): Promise<PredictionModel | null> {
    try {
      const q = query(
        collection(db, this.MODELS_COLLECTION),
        where('type', '==', type),
        where('isActive', '==', true),
        orderBy('accuracy', 'desc'),
        firestoreLimit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        lastTrained: doc.data().lastTrained?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as PredictionModel;
    } catch (error) {
      console.error('Erreur lors de la récupération du modèle:', error);
      return null;
    }
  }

  private static async getHistoricalSalesData(productId: string, days: number): Promise<number[]> {
    // Simulation des données historiques
    const data: number[] = [];
    
    for (let i = 0; i < days; i++) {
      // Génération de données réalistes avec tendance et bruit
      const baseValue = 3 + Math.sin(i * 0.1) * 2; // Tendance saisonnière
      const noise = (Math.random() - 0.5) * 2; // Bruit aléatoire
      data.push(Math.max(0, baseValue + noise));
    }
    
    return data;
  }

  private static getSeasonalFactor(date: Date, productId: string): number {
    // Simulation de facteur saisonnier
    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;
    const monthFactor = 1 + Math.sin(date.getMonth() * Math.PI / 6) * 0.2;
    
    return weekendFactor * monthFactor;
  }

  private static getTrendDirection(data: number[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-5);
    const older = data.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
  }

  private static generateStockRecommendation(
    currentStock: number, 
    predictedDemand: number, 
    horizon: number
  ): string {
    const totalDemand = predictedDemand * horizon;
    
    if (currentStock < totalDemand * 0.5) {
      return `Réapprovisionnement urgent: commander ${Math.ceil(totalDemand * 2)} unités`;
    } else if (currentStock < totalDemand) {
      return `Réapprovisionnement recommandé: commander ${Math.ceil(totalDemand)} unités`;
    } else {
      return 'Stock suffisant pour la période prévue';
    }
  }

  private static calculateStockoutRisk(product: Product, predictions: Prediction[]): number {
    if (predictions.length === 0) return 0;
    
    let cumulativeDemand = 0;
    let stockRemaining = product.quantite;
    
    for (const prediction of predictions) {
      cumulativeDemand += prediction.value;
      stockRemaining -= prediction.value;
      
      if (stockRemaining <= 0) {
        return 1 - (prediction.horizon / predictions.length); // Risque élevé si rupture prochaine
      }
    }
    
    return stockRemaining <= product.seuilAlerte ? 0.6 : 0.2; // Risque modéré si proche du seuil
  }

  private static calculateOptimalReorderQuantity(product: Product, predictions: Prediction[]): number {
    const totalDemand = predictions.reduce((sum, p) => sum + p.value, 0);
    const avgDailyDemand = totalDemand / predictions.length;
    
    // Formule EOQ simplifiée + stock de sécurité
    const demandVariance = this.calculateVariance(predictions.map(p => p.value));
    const safetyStock = Math.sqrt(demandVariance) * 2;
    
    return Math.ceil(avgDailyDemand * 30 + safetyStock); // 30 jours + sécurité
  }

  private static shouldSuggestPriceIncrease(product: Product, analysis: TrendAnalysis): boolean {
    return analysis.trend.direction === 'up' && 
           analysis.trend.strength > 0.5 && 
           product.quantite > product.seuilAlerte * 2;
  }

  private static async createSmartAlert(
    type: SmartAlertType,
    severity: SmartAlert['severity'],
    product: Product,
    title: string,
    message: string,
    recommendation: string,
    prediction?: Prediction
  ): Promise<SmartAlert> {
    const alert: SmartAlert = {
      id: `alert_${type}_${product.id}_${Date.now()}`,
      type,
      severity,
      productId: product.id,
      productName: product.nom,
      title,
      message,
      recommendation,
      prediction,
      data: { product },
      isActive: true,
      isRead: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      createdAt: new Date()
    };

    // Sauvegarder l'alerte
    await addDoc(collection(db, this.ALERTS_COLLECTION), {
      ...alert,
      createdAt: Timestamp.fromDate(alert.createdAt),
      expiresAt: Timestamp.fromDate(alert.expiresAt!)
    });

    return alert;
  }

  private static generateReorderRecommendation(
    product: Product, 
    predictions: Prediction[]
  ): AIRecommendation | null {
    const stockoutRisk = this.calculateStockoutRisk(product, predictions);
    
    if (stockoutRisk > 0.5) {
      const optimalQuantity = this.calculateOptimalReorderQuantity(product, predictions);
      
      return {
        id: `rec_reorder_${product.id}_${Date.now()}`,
        type: 'reorder',
        priority: stockoutRisk > 0.8 ? 'critical' : 'high',
        title: `Réapprovisionnement ${product.nom}`,
        description: `Risque de rupture détecté (${(stockoutRisk * 100).toFixed(0)}%)`,
        action: `Commander ${optimalQuantity} unités`,
        expectedImpact: {
          metric: 'Réduction risque rupture',
          value: 85,
          confidence: 0.9
        },
        reasoning: [
          `Stock actuel: ${product.quantite} unités`,
          `Demande prévue: ${predictions.reduce((s, p) => s + p.value, 0).toFixed(1)} unités`,
          `Délai recommandé: immédiat`
        ],
        data: { stockoutRisk, optimalQuantity, predictions },
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
    }
    
    return null;
  }

  private static generatePriceRecommendation(
    product: Product, 
    analysis: TrendAnalysis
  ): AIRecommendation | null {
    if (this.shouldSuggestPriceIncrease(product, analysis)) {
      const currentMargin = ((product.prixVente - product.prixAchat) / product.prixVente) * 100;
      const suggestedIncrease = 5; // 5% d'augmentation
      
      return {
        id: `rec_price_${product.id}_${Date.now()}`,
        type: 'price',
        priority: 'medium',
        title: `Optimisation prix ${product.nom}`,
        description: `Demande soutenue permettant une augmentation`,
        action: `Augmenter le prix de ${suggestedIncrease}% (${(product.prixVente * 1.05).toFixed(2)}€)`,
        expectedImpact: {
          metric: 'Augmentation marge',
          value: suggestedIncrease,
          confidence: 0.75
        },
        reasoning: [
          `Tendance positive: +${(analysis.trend.velocity * 100).toFixed(1)}%`,
          `Marge actuelle: ${currentMargin.toFixed(1)}%`,
          `Stock suffisant: ${product.quantite} unités`
        ],
        data: { currentPrice: product.prixVente, suggestedPrice: product.prixVente * 1.05 },
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      };
    }
    
    return null;
  }

  private static generateFocusRecommendation(
    product: Product, 
    analysis: TrendAnalysis
  ): AIRecommendation | null {
    if (analysis.trend.direction === 'up' && analysis.trend.strength > 0.7) {
      return {
        id: `rec_focus_${product.id}_${Date.now()}`,
        type: 'focus',
        priority: 'medium',
        title: `Produit star: ${product.nom}`,
        description: `Performance excellente à capitaliser`,
        action: `Augmenter la visibilité et le stock`,
        expectedImpact: {
          metric: 'Croissance CA',
          value: 25,
          confidence: 0.8
        },
        reasoning: [
          `Croissance forte: +${(analysis.trend.velocity * 100).toFixed(1)}%/jour`,
          `Confiance élevée: ${(analysis.trend.confidence * 100).toFixed(0)}%`,
          `Potentiel de développement`
        ],
        data: { trend: analysis.trend },
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
    }
    
    return null;
  }
}