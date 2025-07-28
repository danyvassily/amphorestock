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
} from "lucide-react";
import Link from "next/link";
import { DashboardStats, Product } from "@/types";

// Mock data - sera remplacé par les données Firestore
const mockStats: DashboardStats = {
  totalProducts: 156,
  totalValue: 45280.50,
  lowStockCount: 8,
  categoriesStats: [
    { category: 'vins', count: 45, value: 25600 },
    { category: 'spiritueux', count: 23, value: 12800 },
    { category: 'bieres', count: 35, value: 4200 },
    { category: 'softs', count: 28, value: 1800 },
    { category: 'jus', count: 15, value: 650 },
    { category: 'eaux', count: 10, value: 230 },
  ],
  recentMovements: []
};

const mockLowStockProducts: Product[] = [
  {
    id: '1',
    name: 'Château Margaux 2019',
    category: 'vins',
    quantity: 2,
    unit: 'bouteille',
    prixAchat: 180,
    prixVente: 220,
    seuilAlerte: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user1'
  },
  {
    id: '2',
    name: 'Hendricks Gin',
    category: 'spiritueux',
    quantity: 1,
    unit: 'bouteille',
    prixAchat: 35,
    prixVente: 45,
    seuilAlerte: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user1'
  }
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>(mockLowStockProducts);

  // TODO: Remplacer par les données réelles de Firestore
  useEffect(() => {
    // Charger les stats du dashboard
    // loadDashboardStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vins':
        return <Wine className="h-4 w-4" />;
      case 'spiritueux':
        return <Coffee className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête du dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre stock et de vos ventes
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
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              +12% par rapport au mois dernier
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
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              +8% par rapport au mois dernier
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
            <div className="text-2xl font-bold text-orange-500">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Produits nécessitant un réapprovisionnement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tendance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+15%</div>
            <p className="text-xs text-muted-foreground">
              Rotation du stock ce mois
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
              {stats.categoriesStats.map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category.category)}
                    <span className="capitalize font-medium">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{category.count} produits</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(category.value)}
                    </div>
                  </div>
                </div>
              ))}
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
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {product.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="text-xs">
                      {product.quantity} {product.unit}
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