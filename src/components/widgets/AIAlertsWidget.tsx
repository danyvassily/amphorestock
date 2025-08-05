'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Package,
  DollarSign,
  Zap,
  CheckCircle,
  X,
  Eye,
  Lightbulb,
  Target,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

import { AIPredictionService } from '@/services/aiPredictionService';
import { SmartAlert, AIRecommendation, SmartAlertType } from '@/types';

interface AIAlertsWidgetProps {
  className?: string;
  maxAlerts?: number;
  autoRefresh?: boolean;
}

export function AIAlertsWidget({ 
  className = '', 
  maxAlerts = 10,
  autoRefresh = true 
}: AIAlertsWidgetProps) {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'recommendations'>('alerts');

  // Charger les alertes et recommandations
  useEffect(() => {
    loadAIData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAIData(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadAIData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      if (silent) setRefreshing(true);

      // Données de démonstration pour éviter les erreurs Firebase
      const mockAlerts: SmartAlert[] = [
        {
          id: 'alert_1',
          type: 'low_stock',
          title: 'Stock faible détecté',
          message: 'Le stock de Château Margaux 2015 est critique (2 bouteilles restantes)',
          severity: 'high',
          confidence: 0.95,
          productId: 'product_1',
          category: 'vins',
          isRead: false,
          isActive: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          metadata: { currentStock: 2, minimumStock: 5 }
        },
        {
          id: 'alert_2',
          type: 'demand_spike',
          title: 'Pic de demande prévu',
          message: 'Augmentation de 35% prévue pour les spiritueux premium',
          severity: 'medium',
          confidence: 0.78,
          productId: 'product_2',
          category: 'spiritueux',
          isRead: false,
          isActive: true,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1h ago
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          metadata: { expectedIncrease: 0.35, timeframe: '7-14 jours' }
        }
      ];

      const mockRecommendations: AIRecommendation[] = [
        {
          id: 'rec_1',
          title: 'Optimiser le réapprovisionnement',
          description: 'Commander 24 bouteilles de Chablis Premier Cru avant la fin du mois',
          type: 'reorder',
          priority: 'high',
          confidence: 0.89,
          productId: 'product_3',
          category: 'vins',
          isActive: true,
          createdAt: new Date(),
          estimatedImpact: {
            revenue: 1200,
            savings: 150,
            timeframe: '30 jours'
          },
          actionData: {
            action: 'reorder',
            quantity: 24,
            supplier: 'Distributeur Bourgogne'
          }
        }
      ];

      setAlerts(mockAlerts.slice(0, maxAlerts));
      setRecommendations(mockRecommendations.slice(0, maxAlerts));

      if (silent && mockAlerts.length > 0) {
        toast.info(`${mockAlerts.length} nouvelles alertes IA détectées`, {
          description: 'Consultez le widget pour plus de détails'
        });
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données IA:', error);
      toast.error('Erreur lors du chargement des alertes IA');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      // Marquer l'alerte comme lue
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, isRead: true, acknowledgedAt: new Date(), acknowledgedBy: 'current-user' }
            : alert
        )
      );

      toast.success('Alerte marquée comme lue');
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast.success('Alerte supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleImplementRecommendation = async (recommendationId: string) => {
    try {
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, implementedAt: new Date() }
            : rec
        )
      );

      toast.success('Recommandation marquée comme implémentée', {
        description: 'Le suivi des résultats sera activé'
      });
    } catch (error) {
      console.error('Erreur lors de l\'implémentation:', error);
    }
  };

  const getAlertIcon = (type: SmartAlertType) => {
    const icons = {
      stockout_risk: <AlertTriangle className="h-4 w-4" />,
      overstock_warning: <Package className="h-4 w-4" />,
      price_opportunity: <DollarSign className="h-4 w-4" />,
      demand_spike: <TrendingUp className="h-4 w-4" />,
      seasonal_trend: <RefreshCw className="h-4 w-4" />,
      supplier_issue: <AlertTriangle className="h-4 w-4" />,
      profit_optimization: <Target className="h-4 w-4" />,
      reorder_suggestion: <Package className="h-4 w-4" />
    };
    return icons[type] || <Brain className="h-4 w-4" />;
  };

  const getSeverityColor = (severity: SmartAlert['severity']) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      warning: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
      urgent: 'bg-red-200 text-red-900 border-red-300'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: AIRecommendation['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getRecommendationIcon = (type: AIRecommendation['type']) => {
    const icons = {
      reorder: <Package className="h-4 w-4" />,
      price: <DollarSign className="h-4 w-4" />,
      promotion: <Zap className="h-4 w-4" />,
      discontinue: <X className="h-4 w-4" />,
      focus: <Target className="h-4 w-4" />
    };
    return icons[type] || <Lightbulb className="h-4 w-4" />;
  };

  const unreadAlertsCount = alerts.filter(alert => !alert.isRead).length;
  const activeRecommendationsCount = recommendations.filter(rec => rec.isActive && !rec.implementedAt).length;

  return (
    <Card className={`${className} h-full flex flex-col overflow-hidden`}>
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Brain className="h-4 w-4 text-purple-600 flex-shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-base truncate">Intelligence Artificielle</CardTitle>
              <CardDescription className="text-xs truncate">
                Alertes et recommandations automatiques
              </CardDescription>
            </div>
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => loadAIData(true)}
            disabled={refreshing}
            className="h-7 w-7 p-0 flex-shrink-0"
          >
            {refreshing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 mt-3">
          <Button
            variant={activeTab === 'alerts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('alerts')}
            className="flex items-center gap-1 text-xs h-7 px-2"
          >
            <AlertTriangle className="h-3 w-3" />
            <span className="hidden sm:inline">Alertes</span>
            <span className="sm:hidden">⚠️</span>
            {unreadAlertsCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1 h-4">
                {unreadAlertsCount}
              </Badge>
            )}
          </Button>
          
          <Button
            variant={activeTab === 'recommendations' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('recommendations')}
            className="flex items-center gap-1 text-xs h-7 px-2"
          >
            <Lightbulb className="h-3 w-3" />
            <span className="hidden sm:inline">Recommandations</span>
            <span className="sm:hidden">💡</span>
            {activeRecommendationsCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1 h-4">
                {activeRecommendationsCount}
              </Badge>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-muted-foreground text-sm">Analyse en cours...</span>
          </div>
        ) : (
          <div className="h-64 overflow-y-auto">
            {activeTab === 'alerts' ? (
              // Alertes
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aucune alerte détectée</p>
                    <p className="text-sm">L'IA surveille vos données en continu</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 transition-all ${
                        alert.isRead ? 'opacity-60' : ''
                      } ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 mt-0.5">
                            {getAlertIcon(alert.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{alert.title}</h4>
                              <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.message}
                            </p>
                            
                            <div className="bg-white/50 p-2 rounded text-xs">
                              <span className="font-medium">💡 Recommandation: </span>
                              {alert.recommendation}
                            </div>
                            
                            {alert.productName && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Produit: {alert.productName}
                              </div>
                            )}
                            
                            <div className="mt-2 text-xs text-muted-foreground">
                              {format(alert.createdAt, 'dd/MM/yyyy à HH:mm', { locale: fr })}
                            </div>
                          </div>
                        </div>
                        
                        {!alert.isRead && (
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              className="h-6 w-6 p-0"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDismissAlert(alert.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Recommandations
              <div className="space-y-3">
                {recommendations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aucune recommandation</p>
                    <p className="text-sm">L'IA analyse vos données pour des suggestions</p>
                  </div>
                ) : (
                  recommendations.map((recommendation) => (
                    <div
                      key={recommendation.id}
                      className={`p-4 rounded-lg border transition-all ${
                        recommendation.implementedAt ? 'opacity-60 bg-green-50' : 'bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 mt-0.5">
                            {getRecommendationIcon(recommendation.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{recommendation.title}</h4>
                              <Badge variant="outline" className={getPriorityColor(recommendation.priority)}>
                                {recommendation.priority}
                              </Badge>
                              {recommendation.implementedAt && (
                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                  Implémentée
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {recommendation.description}
                            </p>
                            
                            <div className="bg-blue-50 p-2 rounded text-xs mb-2">
                              <span className="font-medium">🎯 Action: </span>
                              {recommendation.action}
                            </div>
                            
                            <div className="bg-green-50 p-2 rounded text-xs mb-2">
                              <span className="font-medium">📈 Impact attendu: </span>
                              {recommendation.expectedImpact.metric}: +{recommendation.expectedImpact.value}%
                              <span className="text-muted-foreground">
                                {' '}(confiance: {Math.round(recommendation.expectedImpact.confidence * 100)}%)
                              </span>
                            </div>
                            
                            {recommendation.reasoning.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Justification:</span>
                                <ul className="mt-1 space-y-0.5">
                                  {recommendation.reasoning.slice(0, 2).map((reason, index) => (
                                    <li key={index}>• {reason}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="mt-2 text-xs text-muted-foreground">
                              {format(recommendation.createdAt, 'dd/MM/yyyy', { locale: fr })}
                              {' • Expire le '}
                              {format(recommendation.expiresAt, 'dd/MM/yyyy', { locale: fr })}
                            </div>
                          </div>
                        </div>
                        
                        {!recommendation.implementedAt && recommendation.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleImplementRecommendation(recommendation.id)}
                            className="ml-2"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Implémenter
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer avec statistiques */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>🤖 IA active</span>
            {autoRefresh && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Temps réel</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <span>{alerts.length + recommendations.length} éléments</span>
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              Voir tout
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}