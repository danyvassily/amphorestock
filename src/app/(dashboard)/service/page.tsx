"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Search, 
  Minus,
  Plus,
  Loader2,
  AlertTriangle,
  Package,
  Wine,
  Coffee,
  ShoppingCart,
} from "lucide-react";
import { Product } from "@/types";
import { toast } from "sonner";
import { useStocks } from "@/hooks/useStocks";
import { StockService } from "@/lib/stockService";

export default function ServicePage() {
  const { stocks, loading, error, lowStockCount } = useStocks();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [quickSellQuantities, setQuickSellQuantities] = useState<{ [key: string]: number }>({});

  // Filtrer les produits
  useEffect(() => {
    let filtered = stocks;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par catégorie
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.categorie === selectedCategory);
    }

    // Trier par nom
    filtered.sort((a, b) => a.nom.localeCompare(b.nom));

    setFilteredProducts(filtered);
  }, [stocks, searchTerm, selectedCategory]);

  const handleQuickSell = async (productId: string, quantity: number = 1) => {
    try {
      setActionLoading(productId);
      const product = stocks.find(p => p.id === productId);
      if (!product) return;

      if (product.quantite < quantity) {
        toast.error(`Stock insuffisant (${product.quantite} disponible)`);
        return;
      }

      await StockService.sellProduct(productId, quantity);
      toast.success(`${quantity} ${product.unite} vendu(s) - ${product.nom}`);
      
      // Reset la quantité saisie
      setQuickSellQuantities(prev => ({ ...prev, [productId]: 1 }));
    } catch (error) {
      console.error("Erreur vente:", error);
      toast.error("Erreur lors de la vente");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCustomQuantity = (productId: string, quantity: number) => {
    setQuickSellQuantities(prev => ({ 
      ...prev, 
      [productId]: Math.max(1, quantity) 
    }));
  };

  const getQuickQuantity = (productId: string): number => {
    return quickSellQuantities[productId] || 1;
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

  const categories = [
    { value: "all", label: "Tous", count: stocks.length },
    { value: "vins", label: "Vins", count: stocks.filter(p => p.categorie === 'vins').length },
    { value: "vin-rouge", label: "Rouges", count: stocks.filter(p => p.categorie === 'vin-rouge').length },
    { value: "vin-blanc", label: "Blancs", count: stocks.filter(p => p.categorie === 'vin-blanc').length },
    { value: "vin-rose", label: "Rosés", count: stocks.filter(p => p.categorie === 'vin-rose').length },
    { value: "spiritueux", label: "Spiritueux", count: stocks.filter(p => p.categorie === 'spiritueux').length },
    { value: "bieres", label: "Bières", count: stocks.filter(p => p.categorie === 'bieres').length },
    { value: "softs", label: "Softs", count: stocks.filter(p => p.categorie === 'softs').length },
  ].filter(cat => cat.count > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement...</span>
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
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-500" />
            Service Rapide
          </h1>
          <p className="text-muted-foreground">
            Gestion rapide des ventes et décrément de stock en direct
          </p>
        </div>
        {lowStockCount > 0 && (
          <Badge variant="destructive" className="text-sm">
            {lowStockCount} produit(s) en stock faible
          </Badge>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Produits Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProducts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{lowStockCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recherche Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchTerm ? "OUI" : "NON"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-lg"
                autoFocus
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className="flex items-center gap-1"
                >
                  {category.label}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille des produits */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => {
          const isLowStock = product.quantite <= product.seuilAlerte;
          const quickQty = getQuickQuantity(product.id);
          const isLoading = actionLoading === product.id;
          
          return (
            <Card key={product.id} className={`relative ${isLowStock ? 'border-orange-500' : ''}`}>
              {isLowStock && (
                <div className="absolute top-2 right-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start gap-2">
                  {getCategoryIcon(product.categorie)}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {product.nom}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {product.categorie.replace('-', ' ')}
                      </Badge>
                      <span className={`text-xs font-medium ${isLowStock ? 'text-orange-500' : ''}`}>
                        {product.quantite} {product.unite}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Prix */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Vente:</span>
                    <div className="font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(product.prixVente)}
                    </div>
                  </div>
                  {product.prixVerre && (
                    <div>
                      <span className="text-muted-foreground">Verre:</span>
                      <div className="font-medium">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(product.prixVerre)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contrôles de quantité */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCustomQuantity(product.id, quickQty - 1)}
                    disabled={quickQty <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <Input
                    type="number"
                    min="1"
                    max={product.quantite}
                    value={quickQty}
                    onChange={(e) => handleCustomQuantity(product.id, parseInt(e.target.value) || 1)}
                    className="h-8 text-center"
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCustomQuantity(product.id, quickQty + 1)}
                    disabled={quickQty >= product.quantite}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Bouton de vente */}
                <Button
                  onClick={() => handleQuickSell(product.id, quickQty)}
                  disabled={isLoading || product.quantite < quickQty}
                  className="w-full"
                  variant={isLowStock ? "destructive" : "default"}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  Vendre {quickQty} {product.unite}
                  {quickQty > 1 && "s"}
                </Button>

                {/* Boutons rapides pour les vins */}
                {(product.categorie.includes('vin') || product.categorie === 'spiritueux') && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickSell(product.id, 1)}
                      disabled={isLoading || product.quantite < 1}
                      className="text-xs"
                    >
                      Verre
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickSell(product.id, 1)}
                      disabled={isLoading || product.quantite < 1}
                      className="text-xs"
                    >
                      Bouteille
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Message si aucun produit */}
      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `Aucun produit ne correspond à "${searchTerm}"`
                  : "Aucun produit disponible dans cette catégorie"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 