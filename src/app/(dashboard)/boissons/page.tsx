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
  Coffee, 
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
  Droplets,
  Euro,
  BarChart3,
  Sparkles,
  Waves,
  ArrowRight
} from "lucide-react";
import { Product } from "@/types";
import Link from "next/link";
import { toast } from "sonner";
import { useStocks } from "@/hooks/useStocks";
import { StockService } from "@/lib/stockService";
import { getCategoryColor, getCategoryLabel, classifyProduct } from "@/lib/product-classifier";
import { EditProductCategoryDialog } from "@/components/edit-product-category-dialog";
import { useAuth } from "@/contexts/auth-context";

export default function BoissonsPage() {
  const { user } = useAuth();
  // Filtrer uniquement les boissons non-alcoolisées et bières
  const { stocks, loading, error } = useStocks();
  const [filteredBoissons, setFilteredBoissons] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Product>("nom");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  // Filtrer les boissons de tous les stocks + classification automatique
  const boissons = stocks.filter(product => {
    // Classification directe par catégorie
    const validCategories = ['softs', 'bieres', 'jus', 'eaux', 'cocktails'];
    if (validCategories.includes(product.categorie)) return true;
    
    // Classification automatique par nom si catégorie "autres"
    if (product.categorie === 'autres') {
      const classifiedCategory = classifyProduct(product.nom, product.categorie);
      return validCategories.includes(classifiedCategory);
    }
    
    return false;
  });

  // Grouper les boissons par sous-type (basé sur les noms et catégories)
  const getBoissonType = (product: Product): string => {
    // Utiliser d'abord la catégorie si elle est spécifique
    if (product.categorie !== 'softs' && product.categorie !== 'autres') {
      return product.categorie;
    }
    
    const nomLower = product.nom.toLowerCase();
    if (nomLower.includes('eau') || nomLower.includes('water') || nomLower.includes('evian') || nomLower.includes('vittel')) return 'eaux';
    if (nomLower.includes('jus') || nomLower.includes('juice') || nomLower.includes('nectar')) return 'jus';
    if (nomLower.includes('bière') || nomLower.includes('beer') || nomLower.includes('lager') || nomLower.includes('ale')) return 'bieres';
    if (nomLower.includes('coca') || nomLower.includes('pepsi') || nomLower.includes('soda') || nomLower.includes('cola')) return 'sodas';
    if (nomLower.includes('energy') || nomLower.includes('red bull') || nomLower.includes('monster')) return 'energy';
    if (nomLower.includes('thé') || nomLower.includes('tea') || nomLower.includes('café') || nomLower.includes('coffee')) return 'chaudes';
    return 'softs';
  };

  // Filtrer et trier les boissons
  useEffect(() => {
    // Recalculer les boissons à l'intérieur du useEffect
    const boissons = stocks.filter(product => {
      // Classification directe par catégorie
      const validCategories = ['softs', 'bieres', 'jus', 'eaux', 'cocktails'];
      if (validCategories.includes(product.categorie)) return true;
      
      // Classification automatique par nom si catégorie "autres"
      if (product.categorie === 'autres') {
        const classifiedCategory = classifyProduct(product.nom, product.categorie);
        return validCategories.includes(classifiedCategory);
      }
      
      return false;
    });
    
    let filtered = boissons;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(boisson =>
        boisson.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        boisson.fournisseur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        boisson.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par sous-catégorie
    if (selectedCategory !== "all") {
      if (selectedCategory === "low-stock") {
        filtered = filtered.filter(boisson => boisson.quantite <= boisson.seuilAlerte);
      } else if (selectedCategory === "premium") {
        filtered = filtered.filter(boisson => boisson.prixVente > 5);
      } else {
        filtered = filtered.filter(boisson => getBoissonType(boisson) === selectedCategory);
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

    setFilteredBoissons(filtered);
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
      toast.success("Boisson supprimée");
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
      const product = boissons.find(p => p.id === productId);
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

  const handleEditCategory = (boisson: Product) => {
    setEditingProduct(boisson);
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
    return filteredBoissons.reduce((total, boisson) => 
      total + (boisson.quantite * boisson.prixAchat), 0
    );
  };

  const getLowStockCount = () => {
    return boissons.filter(boisson => boisson.quantite <= boisson.seuilAlerte).length;
  };

  const getAveragePrice = () => {
    if (filteredBoissons.length === 0) return 0;
    return filteredBoissons.reduce((total, boisson) => total + boisson.prixVente, 0) / filteredBoissons.length;
  };

  const getTotalQuantity = () => {
    return filteredBoissons.reduce((total, boisson) => total + boisson.quantite, 0);
  };

  const boissonTypes = [
    { value: "all", label: "Toutes les boissons", count: boissons.length },
    { value: "low-stock", label: "Stock faible", count: getLowStockCount() },
    { value: "bieres", label: "Bières", count: boissons.filter(b => getBoissonType(b) === 'bieres').length },
    { value: "softs", label: "Softs", count: boissons.filter(b => getBoissonType(b) === 'softs').length },
    { value: "sodas", label: "Sodas", count: boissons.filter(b => getBoissonType(b) === 'sodas').length },
    { value: "eaux", label: "Eaux", count: boissons.filter(b => getBoissonType(b) === 'eaux').length },
    { value: "jus", label: "Jus", count: boissons.filter(b => getBoissonType(b) === 'jus').length },
    { value: "energy", label: "Energy Drinks", count: boissons.filter(b => getBoissonType(b) === 'energy').length },
    { value: "chaudes", label: "Boissons chaudes", count: boissons.filter(b => getBoissonType(b) === 'chaudes').length },
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
        <span className="ml-2">Chargement des boissons...</span>
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
            <Droplets className="h-8 w-8" />
            Bières & Softs
          </h1>
          <p className="text-muted-foreground">
            Gestion des boissons rafraîchissantes ({boissons.length} boissons)
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
              Ajouter une boisson
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques spécialisées pour les boissons */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Total Boissons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBoissons.length}</div>
            <p className="text-xs text-muted-foreground">
              sur {boissons.length} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Valeur Stock
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
              boissons à réapprovisionner
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Waves className="h-4 w-4" />
              Quantité Totale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{getTotalQuantity()}</div>
            <p className="text-xs text-muted-foreground">
              unités en stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres spécialisés */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et Recherche</CardTitle>
          <CardDescription>Explorez vos boissons par type et marque</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, marque, fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {boissonTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedCategory === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(type.value)}
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

      {/* Tableau des boissons */}
      <Card>
        <CardHeader>
          <CardTitle>Stock de Boissons ({filteredBoissons.length} boissons)</CardTitle>
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
                      Boisson <SortIcon field="nom" />
                    </div>
                  </TableHead>
                  <TableHead>Type</TableHead>
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
                    onClick={() => handleSort("prixVente")}
                  >
                    <div className="flex items-center gap-2 justify-end">
                      Prix <SortIcon field="prixVente" />
                    </div>
                  </TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBoissons.map((boisson) => {
                  const isLowStock = boisson.quantite <= boisson.seuilAlerte;
                  const boissonType = getBoissonType(boisson);
                  
                  return (
                    <TableRow key={boisson.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{boisson.nom}</div>
                          {boisson.description && (
                            <div className="text-sm text-muted-foreground">
                              {boisson.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`${getCategoryColor(boisson.categorie)} border capitalize`}
                        >
                          {boissonType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${isLowStock ? 'text-red-500' : ''}`}>
                          {boisson.quantite} {boisson.unite}
                          {isLowStock && (
                            <AlertTriangle className="inline h-4 w-4 ml-1" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Seuil: {boisson.seuilAlerte}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{formatCurrency(boisson.prixVente)}</div>
                        <div className="text-sm text-muted-foreground">
                          Achat: {formatCurrency(boisson.prixAchat)}
                        </div>
                        {boisson.prixAchat > 0 && (
                          <div className="text-sm text-green-600">
                            Marge: {(((boisson.prixVente - boisson.prixAchat) / boisson.prixAchat) * 100).toFixed(0)}%
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {boisson.fournisseur || "Non spécifié"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {/* Boutons d'ajustement rapide */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdjustment(boisson.id, -1)}
                            disabled={actionLoading === `${boisson.id}-remove`}
                            className="h-8 w-8 p-0"
                          >
                            {actionLoading === `${boisson.id}-remove` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdjustment(boisson.id, 1)}
                            disabled={actionLoading === `${boisson.id}-add`}
                            className="h-8 w-8 p-0"
                          >
                            {actionLoading === `${boisson.id}-add` ? (
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
                              <DropdownMenuItem onClick={() => handleEditCategory(boisson)}>
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
                                onClick={() => handleDelete(boisson.id)}
                                disabled={actionLoading === boisson.id}
                              >
                                {actionLoading === boisson.id ? (
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
          
          {filteredBoissons.length === 0 && (
            <div className="text-center py-12">
              <Droplets className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucune boisson trouvée</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== "all" 
                  ? "Aucune boisson ne correspond à vos critères de recherche"
                  : "Votre stock de boissons est vide. Commencez par importer vos données Excel ou ajouter des boissons"
                }
              </p>
              <Button asChild>
                <Link href="/produits/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter la première boisson
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