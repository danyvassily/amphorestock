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
  Flame,
  Euro,
  BarChart3,
  Zap,
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

export default function SpiriteuxPage() {
  const { user } = useAuth();
  // Filtrer uniquement les spiritueux
  const { stocks, loading, error } = useStocks();
  const [filteredSpiritueux, setFilteredSpiritueux] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Product>("nom");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  // Filtrer les spiritueux de tous les stocks + classification automatique
  const spiritueux = stocks.filter(product => {
    // Classification directe par catégorie
    if (product.categorie === 'spiritueux') return true;
    
    // Classification automatique par nom si catégorie "autres"
    if (product.categorie === 'autres') {
      const classifiedCategory = classifyProduct(product.nom, product.categorie);
      return classifiedCategory === 'spiritueux';
    }
    
    return false;
  });

  // Grouper les spiritueux par sous-type (basé sur les noms)
  const getSpiriteuxType = (nom: string): string => {
    const nomLower = nom.toLowerCase();
    if (nomLower.includes('whisky') || nomLower.includes('whiskey') || nomLower.includes('bourbon') || nomLower.includes('scotch')) return 'whiskey';
    if (nomLower.includes('vodka')) return 'vodka';
    if (nomLower.includes('gin')) return 'gin';
    if (nomLower.includes('rum') || nomLower.includes('rhum')) return 'rum';
    if (nomLower.includes('tequila') || nomLower.includes('mezcal')) return 'tequila';
    if (nomLower.includes('cognac') || nomLower.includes('brandy') || nomLower.includes('armagnac')) return 'cognac';
    if (nomLower.includes('liqueur') || nomLower.includes('amaretto') || nomLower.includes('sambuca')) return 'liqueur';
    return 'autres';
  };

  // Filtrer et trier les spiritueux
  useEffect(() => {
    // Recalculer les spiritueux à l'intérieur du useEffect
    const spiritueux = stocks.filter(product => {
      // Classification directe par catégorie
      if (product.categorie === 'spiritueux') return true;
      
      // Classification automatique par nom si catégorie "autres"
      if (product.categorie === 'autres') {
        const classifiedCategory = classifyProduct(product.nom, product.categorie);
        return classifiedCategory === 'spiritueux';
      }
      
      return false;
    });
    
    let filtered = spiritueux;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(spirit =>
        spirit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spirit.fournisseur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spirit.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par sous-catégorie
    if (selectedCategory !== "all") {
      if (selectedCategory === "low-stock") {
        filtered = filtered.filter(spirit => spirit.quantite <= spirit.seuilAlerte);
      } else if (selectedCategory === "premium") {
        filtered = filtered.filter(spirit => spirit.prixVente > 50);
      } else {
        filtered = filtered.filter(spirit => getSpiriteuxType(spirit.nom) === selectedCategory);
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

    setFilteredSpiritueux(filtered);
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
      toast.success("Spiritueux supprimé");
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
      const product = spiritueux.find(p => p.id === productId);
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

  const handleEditCategory = (spirit: Product) => {
    setEditingProduct(spirit);
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
    return filteredSpiritueux.reduce((total, spirit) => 
      total + (spirit.quantite * spirit.prixAchat), 0
    );
  };

  const getLowStockCount = () => {
    return spiritueux.filter(spirit => spirit.quantite <= spirit.seuilAlerte).length;
  };

  const getAveragePrice = () => {
    if (filteredSpiritueux.length === 0) return 0;
    return filteredSpiritueux.reduce((total, spirit) => total + spirit.prixVente, 0) / filteredSpiritueux.length;
  };

  const getPremiumCount = () => {
    return spiritueux.filter(spirit => spirit.prixVente > 50).length;
  };

  const spiritueuxTypes = [
    { value: "all", label: "Tous les spiritueux", count: spiritueux.length },
    { value: "low-stock", label: "Stock faible", count: getLowStockCount() },
    { value: "premium", label: "Premium (>50€)", count: getPremiumCount() },
    { value: "whiskey", label: "Whisky", count: spiritueux.filter(s => getSpiriteuxType(s.nom) === 'whiskey').length },
    { value: "vodka", label: "Vodka", count: spiritueux.filter(s => getSpiriteuxType(s.nom) === 'vodka').length },
    { value: "gin", label: "Gin", count: spiritueux.filter(s => getSpiriteuxType(s.nom) === 'gin').length },
    { value: "rum", label: "Rhum", count: spiritueux.filter(s => getSpiriteuxType(s.nom) === 'rum').length },
    { value: "tequila", label: "Tequila", count: spiritueux.filter(s => getSpiriteuxType(s.nom) === 'tequila').length },
    { value: "cognac", label: "Cognac & Brandy", count: spiritueux.filter(s => getSpiriteuxType(s.nom) === 'cognac').length },
    { value: "liqueur", label: "Liqueurs", count: spiritueux.filter(s => getSpiriteuxType(s.nom) === 'liqueur').length },
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
        <span className="ml-2">Chargement des spiritueux...</span>
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
            <Coffee className="h-8 w-8" />
            Bar à Spiritueux
          </h1>
          <p className="text-muted-foreground">
            Collection complète d'alcools forts ({spiritueux.length} spiritueux)
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/stock">
              <BarChart3 className="mr-2 h-4 w-4" />
              Tout le Stock
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/service">
              <Zap className="mr-2 h-4 w-4" />
              Service Rapide
            </Link>
          </Button>
          <Button asChild>
            <Link href="/produits/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un spiritueux
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques spécialisées pour les spiritueux */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Total Spiritueux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSpiritueux.length}</div>
            <p className="text-xs text-muted-foreground">
              sur {spiritueux.length} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Valeur Bar
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
              spiritueux à réapprovisionner
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{getPremiumCount()}</div>
                         <p className="text-xs text-muted-foreground">
               spiritueux premium (&gt;50€)
             </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres spécialisés */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et Recherche</CardTitle>
          <CardDescription>Explorez votre collection par type de spiritueux</CardDescription>
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
              {spiritueuxTypes.map((type) => (
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

      {/* Tableau des spiritueux */}
      <Card>
        <CardHeader>
          <CardTitle>Collection de Spiritueux ({filteredSpiritueux.length} spiritueux)</CardTitle>
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
                      Spiritueux <SortIcon field="nom" />
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
                {filteredSpiritueux.map((spirit) => {
                  const isLowStock = spirit.quantite <= spirit.seuilAlerte;
                  const spiritType = getSpiriteuxType(spirit.nom);
                  const isPremium = spirit.prixVente > 50;
                  
                  return (
                    <TableRow key={spirit.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {spirit.nom}
                            {isPremium && (
                              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                                Premium
                              </Badge>
                            )}
                          </div>
                          {spirit.description && (
                            <div className="text-sm text-muted-foreground">
                              {spirit.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`${getCategoryColor('spiritueux')} border capitalize`}
                        >
                          {spiritType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${isLowStock ? 'text-red-500' : ''}`}>
                          {spirit.quantite} {spirit.unite}
                          {isLowStock && (
                            <AlertTriangle className="inline h-4 w-4 ml-1" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Seuil: {spirit.seuilAlerte}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{formatCurrency(spirit.prixVente)}</div>
                        <div className="text-sm text-muted-foreground">
                          Achat: {formatCurrency(spirit.prixAchat)}
                        </div>
                        {spirit.prixVerre && (
                          <div className="text-sm text-green-600">
                            Verre: {formatCurrency(spirit.prixVerre)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {spirit.fournisseur || "Non spécifié"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {/* Boutons d'ajustement rapide */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdjustment(spirit.id, -1)}
                            disabled={actionLoading === `${spirit.id}-remove`}
                            className="h-8 w-8 p-0"
                          >
                            {actionLoading === `${spirit.id}-remove` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdjustment(spirit.id, 1)}
                            disabled={actionLoading === `${spirit.id}-add`}
                            className="h-8 w-8 p-0"
                          >
                            {actionLoading === `${spirit.id}-add` ? (
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
                              <DropdownMenuItem onClick={() => handleEditCategory(spirit)}>
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
                                onClick={() => handleDelete(spirit.id)}
                                disabled={actionLoading === spirit.id}
                              >
                                {actionLoading === spirit.id ? (
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
          
          {filteredSpiritueux.length === 0 && (
            <div className="text-center py-12">
              <Coffee className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun spiritueux trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== "all" 
                  ? "Aucun spiritueux ne correspond à vos critères de recherche"
                  : "Votre bar est vide. Commencez par importer vos données Excel ou ajouter des spiritueux"
                }
              </p>
              <Button asChild>
                <Link href="/produits/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter le premier spiritueux
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