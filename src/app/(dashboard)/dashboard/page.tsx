"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Package, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Wine,
  Coffee,
  Plus,
  Zap,
  Loader2,
  Activity,
  Search,
  Settings,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useStocks } from "@/hooks/useStocks";
import { Product } from "@/types";
import { AppInitializer } from "@/lib/initializeApp";

// Import des nouveaux composants graphiques
import { StockTrendChart } from "@/components/charts/StockTrendChart";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { PopularProductsChart } from "@/components/charts/PopularProductsChart";
import { StatCardSparkline } from "@/components/charts/SparklineChart";

// UniversalSearch chargée dynamiquement aussi pour éviter les problèmes SSR
const UniversalSearch = dynamic(
  () => import("@/components/search/UniversalSearch").then(mod => ({ default: mod.UniversalSearch })),
  {
    ssr: false,
    loading: () => null
  }
);

// Charger DraggableDashboard dynamiquement pour éviter les erreurs SSR
const DraggableDashboard = dynamic(
  () => import("@/components/dashboard/DraggableDashboard").then(mod => ({ default: mod.DraggableDashboard })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement du dashboard...</span>
      </div>
    )
  }
);

export default function DashboardPage() {
  const { stocks, loading, error, totalValue, lowStockCount, categoriesStats } = useStocks();
  const { stocks: lowStockProducts } = useStocks({ onlyLowStock: true, limit: 5 });
  
  // Initialisation automatique de l'application
  useEffect(() => {
    const initializeIfNeeded = async () => {
      try {
        const status = await AppInitializer.checkAppStatus();
        
        // Si pas de données, initialiser automatiquement
        if (!status.hasProducts || !status.hasActivities) {
          console.log('🚀 Initialisation automatique des données...');
          await AppInitializer.initializeApp();
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
      }
    };
    
    initializeIfNeeded();
  }, []); // Ne s'exécute qu'une fois au montage

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vins':
      case 'vin-rouge':
      case 'vin-blanc':
      case 'vin-rose':
        return <Wine className="h-4 w-4" />;
      case 'spiritueux':
        return <Coffee className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement du dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 ipad-optimized">
      {/* En-tête du dashboard avec recherche universelle */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0 ipad-optimized">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d&apos;ensemble personnalisable de votre activité
          </p>
        </div>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 md:items-start">
          {/* Recherche universelle */}
          <UniversalSearch className="w-full sm:w-72 md:w-80" />
          
          {/* Actions rapides */}
          <div className="flex gap-2 shrink-0">
            <Button asChild size="sm">
              <Link href="/service">
                <Zap className="mr-2 h-4 w-4" />
                Service
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/produits/add">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques améliorées avec graphiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 ipad-card-grid">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Produits
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stocks.length}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Produits en stock
              </p>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                +5.2%
              </div>
            </div>
            <div className="mt-3">
              <StatCardSparkline trend="up" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valeur du Stock
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{formatCurrency(totalValue)}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Valeur totale de l&apos;inventaire
              </p>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                +12.8%
              </div>
            </div>
            <div className="mt-3">
              <StatCardSparkline trend="up" type="area" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stock Faible
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500 mb-2">{lowStockCount}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Alertes actives
              </p>
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <TrendingDown className="h-3 w-3" />
                -2.1%
              </div>
            </div>
            <div className="mt-3">
              <StatCardSparkline trend="down" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valeur Moyenne
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 mb-2">
              {stocks.length > 0 ? formatCurrency(totalValue / stocks.length) : "0€"}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Par produit
              </p>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                ➡️ <span className="text-xs">stable</span>
              </div>
            </div>
            <div className="mt-3">
              <StatCardSparkline trend="neutral" type="line" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section des graphiques principaux */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Graphique de répartition par catégories */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Répartition par Catégories
            </CardTitle>
            <CardDescription>
              Analyse visuelle de votre inventaire par type de produit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryDonutChart />
          </CardContent>
        </Card>

        {/* Graphique d'évolution du stock */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Tendance des Stocks
            </CardTitle>
            <CardDescription>
              Évolution des niveaux de stock sur les 10 derniers jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockTrendChart />
          </CardContent>
        </Card>
      </div>

      {/* Graphique des produits populaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Produits Populaires & Analyse Stock
          </CardTitle>
          <CardDescription>
            Performances des ventes et état des stocks par produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PopularProductsChart />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7 ipad-optimized">
        {/* Insights & Analyses */}
        <Card className="md:col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 Insights Intelligents
            </CardTitle>
            <CardDescription>
              Analyses automatiques et recommandations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-800">Tendance positive</span>
                </div>
                <p className="text-sm text-green-700">
                  Votre stock de spiritueux performe exceptionnellement bien avec +24% de ventes ce mois.
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span className="font-medium text-orange-800">Attention requise</span>
                </div>
                <p className="text-sm text-orange-700">
                  3 produits haut de gamme sont en rupture. Réapprovisionnement recommandé.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-blue-800">Opportunité</span>
                </div>
                <p className="text-sm text-blue-700">
                  Les champagnes montrent une croissance de 18%. Considérez l'expansion de cette catégorie.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertes stock faible améliorées */}
        <Card className="md:col-span-1 lg:col-span-3 border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚠️ Alertes Stock
            </CardTitle>
            <CardDescription>
              Surveillance des niveaux critiques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.length > 0 ? (
                <>
                  {lowStockProducts.map((product: Product) => (
                    <div key={product.id} className="group p-3 border rounded-lg hover:shadow-md transition-all duration-200 hover:border-orange-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <div>
                            <p className="font-medium text-sm">{product.nom}</p>
                            <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                              {getCategoryIcon(product.categorie)}
                              {product.categorie.replace('-', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={product.quantite === 0 ? "destructive" : "secondary"} 
                            className="text-xs mb-1"
                          >
                            {product.quantite} {product.unite}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Seuil: {product.seuilAlerte}
                          </div>
                          <div className="mt-1">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  product.quantite === 0 ? 'bg-red-500' : 'bg-orange-500'
                                }`}
                                style={{ 
                                  width: `${Math.min(100, (product.quantite / Math.max(product.seuilAlerte, 1)) * 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total alertes:</span>
                      <span className="font-medium text-orange-600">{lowStockProducts.length}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="mb-4">
                    <div className="h-16 w-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Tout va bien !</h3>
                  <p className="text-sm">Aucun produit en stock critique</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides améliorées */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚡ Actions Rapides
          </CardTitle>
          <CardDescription>
            Accès instantané aux fonctionnalités essentielles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 ipad-card-grid">
            <Button asChild variant="outline" className="h-24 flex-col gap-2 bg-white/70 hover:bg-white hover:shadow-md transition-all duration-200 group border-2 hover:border-blue-300">
              <Link href="/service">
                <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <span className="font-medium">Service Rapide</span>
                <span className="text-xs text-muted-foreground">⚡ Décrémenter stock</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-24 flex-col gap-2 bg-white/70 hover:bg-white hover:shadow-md transition-all duration-200 group border-2 hover:border-green-300">
              <Link href="/stock">
                <div className="p-2 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <span className="font-medium">Gérer Stock</span>
                <span className="text-xs text-muted-foreground">📦 Vue complète</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-24 flex-col gap-2 bg-white/70 hover:bg-white hover:shadow-md transition-all duration-200 group border-2 hover:border-purple-300">
              <Link href="/produits/add">
                <div className="p-2 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                  <Plus className="h-6 w-6 text-purple-600" />
                </div>
                <span className="font-medium">Ajouter Produit</span>
                <span className="text-xs text-muted-foreground">➕ Nouveau produit</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-24 flex-col gap-2 bg-white/70 hover:bg-white hover:shadow-md transition-all duration-200 group border-2 hover:border-orange-300">
              <Link href="/historique">
                <div className="p-2 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <span className="font-medium">Historique</span>
                <span className="text-xs text-muted-foreground">📊 Mouvements</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard personnalisable avec widgets déplaçables */}
      <div className="mt-8">
        <DraggableDashboard 
          userId="current-user" 
          layoutId="main-dashboard"
          className="min-h-screen"
        />
      </div>
    </div>
  );
} 