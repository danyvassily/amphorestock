'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingCart, 
  Calendar,
  RotateCcw,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

import { SalesChart } from './SalesChart';
import { CategoryPieChart } from './CategoryPieChart';
import { TopProductsChart } from './TopProductsChart';
import { StatisticsService } from '@/services/statisticsService';
import { GlobalStatistics, SalesStatistics, ChartDataPoint, StatsPeriod } from '@/types';

const PERIODS: StatsPeriod[] = [
  { label: 'Aujourd\'hui', value: 'today', days: 1 },
  { label: '7 derniers jours', value: 'week', days: 7 },
  { label: '30 derniers jours', value: 'month', days: 30 },
  { label: '3 derniers mois', value: 'quarter', days: 90 },
  { label: 'Cette année', value: 'year', days: 365 },
  { label: 'Tout', value: 'all', days: 0 }
];

interface StatsDashboardProps {
  className?: string;
}

export function StatsDashboard({ className = '' }: StatsDashboardProps) {
  const [globalStats, setGlobalStats] = useState<GlobalStatistics | null>(null);
  const [periodStats, setPeriodStats] = useState<SalesStatistics[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<StatsPeriod>(PERIODS[2]); // 30 jours par défaut
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Charger les données
  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Charger les stats globales
      const global = await StatisticsService.getGlobalStatistics();
      setGlobalStats(global);

      // Charger les stats de la période sélectionnée
      if (selectedPeriod.value !== 'all') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - selectedPeriod.days);
        
        const periodData = await StatisticsService.getStatisticsByPeriod(startDate, endDate);
        setPeriodStats(periodData);
      } else {
        // Pour "tout", on peut utiliser les données globales
        setPeriodStats([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleResetStats = async () => {
    try {
      setResetting(true);
      await StatisticsService.resetAllStatistics();
      
      // Recharger les données
      await loadStatistics();
      
      setShowResetDialog(false);
      toast.success('Statistiques remises à zéro avec succès', {
        description: 'Toutes les données de vente ont été effacées'
      });
    } catch (error) {
      console.error('Erreur lors de la remise à zéro:', error);
      toast.error('Erreur lors de la remise à zéro', {
        description: 'Veuillez réessayer'
      });
    } finally {
      setResetting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Préparer les données pour les graphiques
  const prepareChartData = (): ChartDataPoint[] => {
    if (selectedPeriod.value === 'all' && globalStats) {
      return globalStats.monthlyHistory.map(month => ({
        name: `${month.month}/${month.year}`,
        value: month.revenue,
        revenue: month.revenue,
        profit: month.profit,
        sales: month.sales,
        date: month.date
      }));
    }
    
    return periodStats.map(stat => ({
      name: formatDate(stat.date),
      value: stat.totalRevenue,
      revenue: stat.totalRevenue,
      profit: stat.totalProfit,
      sales: stat.totalSales,
      date: stat.date
    }));
  };

  // Calculer les totaux pour la période sélectionnée
  const calculatePeriodTotals = () => {
    if (selectedPeriod.value === 'all' && globalStats) {
      return {
        totalSales: globalStats.totalSalesAllTime,
        totalRevenue: globalStats.totalRevenueAllTime,
        totalProfit: globalStats.totalProfitAllTime,
        avgDailyRevenue: globalStats.averageDailyRevenue
      };
    }

    const totals = periodStats.reduce((acc, stat) => ({
      totalSales: acc.totalSales + stat.totalSales,
      totalRevenue: acc.totalRevenue + stat.totalRevenue,
      totalProfit: acc.totalProfit + stat.totalProfit
    }), { totalSales: 0, totalRevenue: 0, totalProfit: 0 });

    return {
      ...totals,
      avgDailyRevenue: periodStats.length > 0 ? totals.totalRevenue / periodStats.length : 0
    };
  };

  // Récupérer les données de catégories pour la période
  const getCategoryData = () => {
    if (periodStats.length === 0) return [];
    
    const categoryMap = new Map();
    
    periodStats.forEach(stat => {
      Object.entries(stat.salesByCategory).forEach(([key, category]) => {
        const existing = categoryMap.get(key) || {
          category: category.category,
          salesCount: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          percentage: 0
        };
        
        categoryMap.set(key, {
          ...existing,
          salesCount: existing.salesCount + category.salesCount,
          revenue: existing.revenue + category.revenue,
          cost: existing.cost + category.cost,
          profit: existing.profit + category.profit
        });
      });
    });

    const categories = Array.from(categoryMap.values());
    const totalRevenue = categories.reduce((sum, cat) => sum + cat.revenue, 0);
    
    return categories.map(cat => ({
      ...cat,
      percentage: totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0
    }));
  };

  const totals = calculatePeriodTotals();
  const chartData = prepareChartData();
  const categoryData = getCategoryData();

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header avec contrôles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">📊 Statistiques de vente</h2>
          <p className="text-muted-foreground">
            Analyse complète de vos performances commerciales
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={selectedPeriod.value}
            onValueChange={(value) => {
              const period = PERIODS.find(p => p.value === value);
              if (period) setSelectedPeriod(period);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Remettre à zéro les statistiques
                </DialogTitle>
                <DialogDescription>
                  Cette action va supprimer définitivement toutes les données de vente et 
                  statistiques. Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowResetDialog(false)}
                  disabled={resetting}
                >
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleResetStats}
                  disabled={resetting}
                >
                  {resetting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Remise à zéro...
                    </>
                  ) : (
                    'Confirmer la remise à zéro'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod.label.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod.label.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéfice</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totals.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Marge: {totals.totalRevenue > 0 
                ? ((totals.totalProfit / totals.totalRevenue) * 100).toFixed(1)
                : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA moyen/jour</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.avgDailyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Moyenne quotidienne
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique d'évolution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Évolution des ventes
            </CardTitle>
            <CardDescription>
              Suivi du chiffre d'affaires et des bénéfices - {selectedPeriod.label.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart 
              data={chartData}
              height={300}
              showRevenue={true}
              showProfit={true}
              showSales={false}
            />
          </CardContent>
        </Card>

        {/* Répartition par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
            <CardDescription>
              Analyse des ventes par type de produit - {selectedPeriod.label.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryPieChart 
              data={categoryData}
              height={300}
              showPercentage={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Informations globales */}
      {globalStats && (
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Statistiques depuis le début de l'activité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Première vente</p>
                <p className="font-semibold">{formatDate(globalStats.firstSaleDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CA total</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(globalStats.totalRevenueAllTime)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Bénéfice total</p>
                <p className="font-semibold text-blue-600">
                  {formatCurrency(globalStats.totalProfitAllTime)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Ventes totales</p>
                <p className="font-semibold">{globalStats.totalSalesAllTime}</p>
              </div>
              {globalStats.lastResetDate && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Dernière remise à zéro</p>
                  <p className="font-semibold">{formatDate(globalStats.lastResetDate)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}