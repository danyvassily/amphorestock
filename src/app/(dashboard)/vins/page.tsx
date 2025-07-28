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
  Wine, 
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Filter,
  Loader2,
  Plus,
  Minus,
  Grape,
  Euro,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { Product } from "@/types";
import Link from "next/link";
import { toast } from "sonner";
import { useStocks } from "@/hooks/useStocks";
import { StockService } from "@/lib/stockService";
import { getCategoryColor, getCategoryLabel } from "@/lib/product-classifier";
import { EditProductCategoryDialog } from "@/components/edit-product-category-dialog";

export default function VinsPage() {
  // Filtrer uniquement les vins
  const { stocks, loading, error } = useStocks();
  const [filteredWines, setFilteredWines] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWineType, setSelectedWineType] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Product>("nom");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  // Filtrer les vins de tous les stocks
  const wines = stocks.filter(product => 
    product.categorie === 'vins' || 
    product.categorie === 'vin-rouge' || 
    product.categorie === 'vin-blanc' || 
    product.categorie === 'vin-rose'
  );

  // Filtrer et trier les vins
  useEffect(() => {
    // Recalculer les vins à l'intérieur du useEffect
    const wines = stocks.filter(product => 
      product.categorie === 'vins' || 
      product.categorie === 'vin-rouge' || 
      product.categorie === 'vin-blanc' || 
      product.categorie === 'vin-rose'
    );
    
    let filtered = wines;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(wine =>
        wine.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.fournisseur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par type de vin
    if (selectedWineType !== "all") {
      if (selectedWineType === "low-stock") {
        filtered = filtered.filter(wine => wine.quantite <= wine.seuilAlerte);
      } else {
        filtered = filtered.filter(wine => wine.categorie === selectedWineType);
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

    setFilteredWines(filtered);
  }, [stocks, searchTerm, selectedWineType, sortField, sortDirection]);

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
      toast.success("Vin supprimé");
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
      const product = wines.find(p => p.id === productId);
      if (!product) return;

      const newQuantity = Math.max(0, product.quantite + adjustment);
      await StockService.updateQuantity(
        productId, 
        newQuantity, 
        adjustment > 0 ? 'entree' : 'sortie',
        adjustment > 0 ? 'Ajustement manuel (+)' : 'Ajustement manuel (-)'
      );
      
      toast.success(`Stock ${adjustment > 0 ? 'ajouté' : 'retiré'}`);
    } catch (error) {
      console.error("Erreur ajustement:", error);
      toast.error("Erreur lors de l'ajustement");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditCategory = (wine: Product) => {
    setEditingProduct(wine);
    setIsCategoryDialogOpen(true);
  };

  const handleCloseCategoryDialog = () => {
    setEditingProduct(null);
    setIsCategoryDialogOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getTotalValue = () => {
    return filteredWines.reduce((total, wine) => 
      total + (wine.quantite * wine.prixAchat), 0
    );
  };

  const getLowStockCount = () => {
    return wines.filter(wine => wine.quantite <= wine.seuilAlerte).length;
  };

  const getAveragePrice = () => {
    if (filteredWines.length === 0) return 0;
    return filteredWines.reduce((total, wine) => total + wine.prixVente, 0) / filteredWines.length;
  };

  const wineTypes = [
    { value: "all", label: "Tous les vins", count: wines.length },
    { value: "low-stock", label: "Stock faible", count: getLowStockCount() },
    { value: "vin-rouge", label: "Vins rouges", count: wines.filter(w => w.categorie === 'vin-rouge').length },
    { value: "vin-blanc", label: "Vins blancs", count: wines.filter(w => w.categorie === 'vin-blanc').length },
    { value: "vin-rose", label: "Vins rosés", count: wines.filter(w => w.categorie === 'vin-rose').length },
    { value: "vins", label: "Vins génériques", count: wines.filter(w => w.categorie === 'vins').length },
  ].filter(type => type.count > 0);

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
        <span className="ml-2">Chargement des vins...</span>
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
            <Wine className="h-8 w-8" />
            Cave à Vins
          </h1>
          <p className="text-muted-foreground">
            Gestion complète de votre cave ({wines.length} vins)
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/stock">
              <BarChart3 className="mr-2 h-4 w-4" />
              Tout le Stock
            </Link>
          </Button>
          <Button asChild>
            <Link href="/produits/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un vin
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques spécialisées pour les vins */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Grape className="h-4 w-4" />
              Total Vins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredWines.length}</div>
            <p className="text-xs text-muted-foreground">
              sur {wines.length} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Valeur Cave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalValue())}</div>
            <p className="text-xs text-muted-foreground">
              valeur d'achat
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{getLowStockCount()}</div>
            <p className="text-xs text-muted-foreground">
              vins à réapprovisionner
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prix Moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getAveragePrice())}
            </div>
            <p className="text-xs text-muted-foreground">
              prix de vente moyen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres spécialisés */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et Recherche</CardTitle>
          <CardDescription>Explorez votre cave selon vos critères</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, domaine, fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {wineTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedWineType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWineType(type.value)}
                  className="flex items-center gap-1"
                >
                  {type.label}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {type.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des vins */}
      <Card>
        <CardHeader>
          <CardTitle>Cave à Vins ({filteredWines.length} vins)</CardTitle>
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
                      Vin <SortIcon field="nom" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("categorie")}
                  >
                    <div className="flex items-center gap-2">
                      Type <SortIcon field="categorie" />
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
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWines.map((wine) => {
                  const isLowStock = wine.quantite <= wine.seuilAlerte;
                  
                  return (
                    <TableRow key={wine.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{wine.nom}</div>
                          {wine.description && (
                            <div className="text-sm text-muted-foreground">
                              {wine.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`${getCategoryColor(wine.categorie)} border`}
                        >
                          {getCategoryLabel(wine.categorie)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${isLowStock ? 'text-red-500' : ''}`}>
                          {wine.quantite} {wine.unite}
                          {isLowStock && (
                            <AlertTriangle className="inline h-4 w-4 ml-1" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Seuil: {wine.seuilAlerte}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{formatCurrency(wine.prixVente)}</div>
                        <div className="text-sm text-muted-foreground">
                          Achat: {formatCurrency(wine.prixAchat)}
                        </div>
                        {wine.prixVerre && (
                          <div className="text-sm text-green-600">
                            Verre: {formatCurrency(wine.prixVerre)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {wine.fournisseur || "Non spécifié"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {/* Boutons d'ajustement rapide */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdjustment(wine.id, -1)}
                            disabled={actionLoading === `${wine.id}-remove`}
                            className="h-8 w-8 p-0"
                          >
                            {actionLoading === `${wine.id}-remove` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdjustment(wine.id, 1)}
                            disabled={actionLoading === `${wine.id}-add`}
                            className="h-8 w-8 p-0"
                          >
                            {actionLoading === `${wine.id}-add` ? (
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
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditCategory(wine)}>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Changer de catégorie
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(wine.id)}
                                disabled={actionLoading === wine.id}
                              >
                                {actionLoading === wine.id ? (
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
          
          {filteredWines.length === 0 && (
            <div className="text-center py-12">
              <Wine className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun vin trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedWineType !== "all" 
                  ? "Aucun vin ne correspond à vos critères de recherche"
                  : "Votre cave est vide. Commencez par importer vos données Excel ou ajouter des vins"
                }
              </p>
              <Button asChild>
                <Link href="/produits/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter le premier vin
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de modification de catégorie */}
      <EditProductCategoryDialog
        product={editingProduct}
        isOpen={isCategoryDialogOpen}
        onClose={handleCloseCategoryDialog}
      />
    </div>
  );
} 