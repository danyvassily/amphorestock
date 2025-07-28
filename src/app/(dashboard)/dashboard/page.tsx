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
} from "lucide-react";
import Link from "next/link";
import { useStocks } from "@/hooks/useStocks";
import { Product } from "@/types";

export default function DashboardPage() {
  const { stocks, loading, error, totalValue, lowStockCount, categoriesStats } = useStocks();
  const { stocks: lowStockProducts } = useStocks({ onlyLowStock: true, limit: 5 });

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
      {/* En-tête du dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble de votre stock et de vos ventes
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/service">
              <Zap className="mr-2 h-4 w-4" />
              Service Rapide
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/produits/add">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Link>
          </Button>
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
    </div>
  );
} 