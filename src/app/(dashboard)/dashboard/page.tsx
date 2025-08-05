"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Package, 
  TrendingUp, 
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
    <div className="space-y-6">
      {/* En-tête du dashboard avec recherche universelle */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d&apos;ensemble personnalisable de votre activité
          </p>
        </div>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          {/* Recherche universelle */}
          <UniversalSearch className="w-full sm:w-80" />
          
          {/* Actions rapides */}
          <div className="flex gap-2">
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

      {/* Cartes statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Produits
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stocks.length}</div>
            <p className="text-xs text-muted-foreground">
              Produits en stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valeur du Stock
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Valeur totale de l&apos;inventaire
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stock Faible
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Produits nécessitant un réapprovisionnement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valeur Moyenne
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stocks.length > 0 ? formatCurrency(totalValue / stocks.length) : "0€"}
            </div>
            <p className="text-xs text-muted-foreground">
              Par produit
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Répartition par catégories */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Répartition par Catégories</CardTitle>
            <CardDescription>
              Nombre de produits et valeur par catégorie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoriesStats).map(([category, stats]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span className="capitalize font-medium">{category.replace('-', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{stats.count} produits</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(stats.value)}
                    </div>
                  </div>
                </div>
              ))}
              
              {Object.keys(categoriesStats).length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune catégorie disponible</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alertes stock faible */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Stock Faible
            </CardTitle>
            <CardDescription>
              Produits nécessitant un réapprovisionnement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product: Product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{product.nom}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {product.categorie.replace('-', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="text-xs">
                      {product.quantite} {product.unite}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Min: {product.seuilAlerte}
                    </p>
                  </div>
                </div>
              ))}
              
              {lowStockProducts.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun produit en stock faible</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>
            Accès rapide aux fonctionnalités principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/service">
                <Zap className="h-6 w-6" />
                <span>Service Rapide</span>
                <span className="text-xs text-muted-foreground">Décrémenter stock</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/stock">
                <Package className="h-6 w-6" />
                <span>Gérer Stock</span>
                <span className="text-xs text-muted-foreground">Vue complète</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/produits/add">
                <Plus className="h-6 w-6" />
                <span>Ajouter Produit</span>
                <span className="text-xs text-muted-foreground">Nouveau produit</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/historique">
                <BarChart3 className="h-6 w-6" />
                <span>Historique</span>
                <span className="text-xs text-muted-foreground">Mouvements</span>
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