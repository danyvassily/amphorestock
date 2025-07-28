"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Package, 
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Zap,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";
import { Product } from "@/types";
import Link from "next/link";
import { toast } from "sonner";
import { useStocks } from "@/hooks/useStocks";
import { StockService } from "@/lib/stockService";
import { useAuth } from "@/contexts/auth-context";

export default function StockPage() {
  const { user } = useAuth();
  const { stocks, loading, error, totalValue, lowStockCount, categoriesStats } = useStocks();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Product>("nom");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filtrer et trier les produits
  useEffect(() => {
    let filtered = stocks;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.fournisseur?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par catégorie
    if (selectedCategory !== "all") {
      if (selectedCategory === "low-stock") {
        filtered = filtered.filter(product => product.quantite <= product.seuilAlerte);
      } else {
        filtered = filtered.filter(product => product.categorie === selectedCategory);
      }
    }

    // Tri
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    setFilteredProducts(filtered);
  }, [stocks, searchTerm, selectedCategory, sortField, sortDirection]);

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      setActionLoading(productId);
      await StockService.deleteProduct(productId);
      toast.success("Produit supprimé");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickAdjustment = async (productId: string, adjustment: number) => {
    try {
      setActionLoading(`${productId}-${adjustment > 0 ? 'add' : 'remove'}`);
      const product = stocks.find(p => p.id === productId);
      if (!product) return;

      const newQuantity = Math.max(0, product.quantite + adjustment);
      await StockService.updateQuantity(
        productId, 
        newQuantity, 
        adjustment > 0 ? 'entree' : 'sortie',
        adjustment > 0 ? 'Ajustement manuel (+)' : 'Ajustement manuel (-)',
        undefined,
        user?.uid || 'anonymous'
      );
      
      toast.success(`Stock ${adjustment > 0 ? 'ajouté' : 'retiré'}`);
    } catch (error) {
      console.error("Erreur ajustement:", error);
      toast.error("Erreur lors de l'ajustement");
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getTotalValue = () => {
    return filteredProducts.reduce((total, product) => 
      total + (product.quantite * product.prixAchat), 0
    );
  };

  const getLowStockCount = () => {
    return stocks.filter(product => product.quantite <= product.seuilAlerte).length;
  };

  const categories = [
    { value: "all", label: "Tous les produits", count: stocks.length },
    { value: "low-stock", label: "Stock faible", count: getLowStockCount() },
    { value: "vins", label: "Vins", count: stocks.filter(p => p.categorie === 'vins').length },
    { value: "vin-rouge", label: "Vins rouges", count: stocks.filter(p => p.categorie === 'vin-rouge').length },
    { value: "vin-blanc", label: "Vins blancs", count: stocks.filter(p => p.categorie === 'vin-blanc').length },
    { value: "vin-rose", label: "Vins rosés", count: stocks.filter(p => p.categorie === 'vin-rose').length },
    { value: "spiritueux", label: "Spiritueux", count: stocks.filter(p => p.categorie === 'spiritueux').length },
    { value: "bieres", label: "Bières", count: stocks.filter(p => p.categorie === 'bieres').length },
    { value: "softs", label: "Softs", count: stocks.filter(p => p.categorie === 'softs').length },
    { value: "eaux", label: "Eaux", count: stocks.filter(p => p.categorie === 'eaux').length },
  ].filter(cat => cat.count > 0); // Ne montrer que les catégories avec des produits

  const SortIcon = ({ field }: { field: keyof Product }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? 
      <TrendingUp className="h-4 w-4" /> : 
      <TrendingDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des stocks...</span>
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
            <Package className="h-8 w-8" />
            Gestion du Stock
          </h1>
          <p className="text-muted-foreground">
            Vue complète et gestion de votre inventaire ({stocks.length} produits)
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
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProducts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalValue())}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{getLowStockCount()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valeur Moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredProducts.length > 0 ? formatCurrency(getTotalValue() / filteredProducts.length) : "0€"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
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

      {/* Tableau des produits */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire ({filteredProducts.length} produits)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("nom")}
                  >
                    <div className="flex items-center gap-2">
                      Produit <SortIcon field="nom" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("categorie")}
                  >
                    <div className="flex items-center gap-2">
                      Catégorie <SortIcon field="categorie" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted text-right"
                    onClick={() => handleSort("quantite")}
                  >
                    <div className="flex items-center gap-2 justify-end">
                      Stock <SortIcon field="quantite" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted text-right"
                    onClick={() => handleSort("prixAchat")}
                  >
                    <div className="flex items-center gap-2 justify-end">
                      Prix Achat <SortIcon field="prixAchat" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted text-right"
                    onClick={() => handleSort("prixVente")}
                  >
                    <div className="flex items-center gap-2 justify-end">
                      Prix Vente <SortIcon field="prixVente" />
                    </div>
                  </TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isLowStock = product.quantite <= product.seuilAlerte;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.nom}</div>
                          {product.subcategory && (
                            <div className="text-sm text-muted-foreground">
                              {product.subcategory}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {product.categorie.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${isLowStock ? 'text-red-500' : ''}`}>
                          {product.quantite} {product.unite}
                          {isLowStock && (
                            <AlertTriangle className="inline h-4 w-4 ml-1" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Seuil: {product.seuilAlerte}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.prixAchat)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>{formatCurrency(product.prixVente)}</div>
                        {product.prixVerre && (
                          <div className="text-sm text-muted-foreground">
                            Verre: {formatCurrency(product.prixVerre)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {product.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {/* Boutons d'ajustement rapide */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdjustment(product.id, -1)}
                            disabled={actionLoading === `${product.id}-remove`}
                            className="h-8 w-8 p-0"
                          >
                            {actionLoading === `${product.id}-remove` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdjustment(product.id, 1)}
                            disabled={actionLoading === `${product.id}-add`}
                            className="h-8 w-8 p-0"
                          >
                            {actionLoading === `${product.id}-add` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(product.id)}
                                disabled={actionLoading === product.id}
                              >
                                {actionLoading === product.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== "all" 
                  ? "Aucun produit ne correspond à vos critères de recherche"
                  : "Commencez par importer vos données Excel ou ajouter des produits"
                }
              </p>
              <Button asChild>
                <Link href="/produits/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter le premier produit
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 