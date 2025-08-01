'use client';

import React, { useState, useMemo } from 'react';
import { useGeneralStock } from '@/hooks/useModernProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Package, 
  Plus,
  Minus,
  Edit,
  Trash2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock,
  ArrowUpDown,
  Euro,
  BarChart3
} from 'lucide-react';
import { Product, ProductFormData } from '@/types';
import Link from 'next/link';
import { toast } from 'sonner';

export default function StockPage() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nom');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Éviter les problèmes d'hydratation
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Utiliser le hook moderne pour le stock général
  const {
    products: stockGeneral,
    loading,
    error,
    connectionStatus,
    stats,
    addProduct,
    updateProduct,
    deleteProduct,
    removeStock,
    addStock,
    clearError
  } = useGeneralStock({
    search: searchTerm,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    stockStatus: stockStatusFilter === 'all' ? undefined : stockStatusFilter,
    sortBy: sortBy,
    sortOrder: sortDirection
  });

  // Debug logs
  React.useEffect(() => {
    console.log('📦 StockPage State:', {
      mounted,
      loading,
      stockCount: stockGeneral.length,
      error,
      connectionStatus
    });
  }, [mounted, loading, stockGeneral.length, error, connectionStatus]);

  // Statistiques du stock général
  const stockStats = useMemo(() => ({
    total: stats.totalGeneral,
    stockFaible: stats.lowStockCount,
    enRupture: stats.outOfStockCount,
    valeurTotale: stats.totalValue,
    categories: stockGeneral.reduce((acc, product) => {
      acc[product.categorie] = (acc[product.categorie] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }), [stockGeneral, stats]);

  const handleQuickAdjustment = async (product: Product, adjustment: number) => {
    try {
      if (adjustment > 0) {
        await addStock(product.id, adjustment, 'Ajustement manuel (+)');
      } else {
        await removeStock(product.id, Math.abs(adjustment), 'Ajustement manuel (-)');
      }
      
      toast.success(`Stock ${adjustment > 0 ? 'ajouté' : 'retiré'}`, {
        description: `${product.nom} - ${Math.abs(adjustment)} ${product.unite}`,
      });
    } catch (error) {
      toast.error('Erreur lors de l\'ajustement', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  };

  const handleAddProduct = async (productData: ProductFormData) => {
    try {
      await addProduct({ ...productData, type: 'general' });
      setShowAddDialog(false);
      toast.success('Produit ajouté avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  };

  const handleEditProduct = async (productData: Partial<ProductFormData>) => {
    if (!editingProduct) return;
    
    try {
      await updateProduct(editingProduct.id, productData);
      setEditingProduct(null);
      toast.success('Produit modifié avec succès');
    } catch (error) {
      toast.error('Erreur lors de la modification', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      toast.success('Produit supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.quantite === 0) return { label: 'Rupture', variant: 'destructive' as const, color: 'text-red-500' };
    if (product.quantite <= product.seuilAlerte) return { label: 'Stock faible', variant: 'secondary' as const, color: 'text-orange-500' };
    return { label: 'Stock normal', variant: 'default' as const, color: '' };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spiritueux': return '🥃';
      case 'bieres': return '🍺';
      case 'softs': return '🥤';
      case 'jus': return '🧃';
      case 'eaux': return '💧';
      default: return '📦';
    }
  };

  // Fonction pour formater les prix avec 2 décimales
  const formatPrice = (price?: number): string => {
    if (!price && price !== 0) return '0.00';
    return price.toFixed(2);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 opacity-20" />;
    return sortDirection === 'asc' ? 
      <TrendingUp className="h-4 w-4" /> : 
      <TrendingDown className="h-4 w-4" />;
  };

  // Composant pour le formulaire simple d'ajout
  const SimpleProductForm = ({ onSubmit, onCancel }: { 
    onSubmit: (data: ProductFormData) => void; 
    onCancel: () => void; 
  }) => {
    const [formData, setFormData] = useState<ProductFormData>({
      nom: '',
      categorie: 'autres',
      type: 'general',
      quantite: 0,
      unite: 'piece',
      prixAchat: 0,
      prixVente: 0,
      seuilAlerte: 5,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom du produit *</label>
          <Input
            value={formData.nom}
            onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
            placeholder="Ex: Coca-Cola 33cl"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie *</label>
            <Select value={formData.categorie} onValueChange={(value: any) => setFormData(prev => ({ ...prev, categorie: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spiritueux">🥃 Spiritueux</SelectItem>
                <SelectItem value="bieres">🍺 Bières</SelectItem>
                <SelectItem value="softs">🥤 Softs</SelectItem>
                <SelectItem value="jus">🧃 Jus</SelectItem>
                <SelectItem value="eaux">💧 Eaux</SelectItem>
                <SelectItem value="autres">📦 Autres</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Unité *</label>
            <Select value={formData.unite} onValueChange={(value: any) => setFormData(prev => ({ ...prev, unite: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="piece">Pièce</SelectItem>
                <SelectItem value="bouteille">Bouteille</SelectItem>
                <SelectItem value="cannette">Cannette</SelectItem>
                <SelectItem value="litre">Litre</SelectItem>
                <SelectItem value="centilitre">Centilitre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Quantité *</label>
            <Input
              type="number"
              value={formData.quantite}
              onChange={(e) => setFormData(prev => ({ ...prev, quantite: Number(e.target.value) }))}
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prix d'achat (€) *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.prixAchat}
              onChange={(e) => setFormData(prev => ({ ...prev, prixAchat: Number(e.target.value) }))}
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prix de vente (€) *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.prixVente}
              onChange={(e) => setFormData(prev => ({ ...prev, prixVente: Number(e.target.value) }))}
              min="0"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Seuil d'alerte *</label>
          <Input
            type="number"
            value={formData.seuilAlerte}
            onChange={(e) => setFormData(prev => ({ ...prev, seuilAlerte: Number(e.target.value) }))}
            min="1"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            Ajouter le produit
          </Button>
        </div>
      </form>
    );
  };

  // Éviter les problèmes d'hydratation
  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Initialisation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Synchronisation en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête avec indicateur de connexion */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            📦 Stock Général
            <div className="flex items-center gap-2 text-sm">
              {connectionStatus.isConnected ? (
                <Badge variant="default" className="bg-green-600">
                  <Wifi className="h-3 w-3 mr-1" />
                  Temps réel
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Hors ligne
                </Badge>
              )}
              {connectionStatus.lastSync && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {connectionStatus.lastSync.toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </h1>
          <p className="text-muted-foreground mb-6">
            Gestion de tous vos produits hors vins • Synchronisation temps réel
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/vins">
              <BarChart3 className="mr-2 h-4 w-4" />
              Cave à Vins
            </Link>
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau produit</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du produit à ajouter au stock général.
                </DialogDescription>
              </DialogHeader>
              <SimpleProductForm
                onSubmit={handleAddProduct}
                onCancel={() => setShowAddDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Gestion des erreurs */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="text-destructive font-medium">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={clearError}>
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques du stock général */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total produits</p>
                <p className="text-2xl font-bold">{stockStats.total}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock faible</p>
                <p className="text-2xl font-bold text-orange-600">{stockStats.stockFaible}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En rupture</p>
                <p className="text-2xl font-bold text-red-600">{stockStats.enRupture}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valeur totale</p>
                <p className="text-2xl font-bold">{formatPrice(stockStats.valeurTotale)}€</p>
              </div>
              <Euro className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher un produit... (temps réel)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="spiritueux">🥃 Spiritueux</SelectItem>
                <SelectItem value="bieres">🍺 Bières</SelectItem>
                <SelectItem value="softs">🥤 Softs</SelectItem>
                <SelectItem value="jus">🧃 Jus</SelectItem>
                <SelectItem value="eaux">💧 Eaux</SelectItem>
                <SelectItem value="autres">📦 Autres</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="État du stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les états</SelectItem>
                <SelectItem value="normal">Stock normal</SelectItem>
                <SelectItem value="low">Stock faible</SelectItem>
                <SelectItem value="out">En rupture</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des produits */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire du stock général ({stockGeneral.length} produits)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('nom')}
                  >
                    <div className="flex items-center gap-2">
                      Produit <SortIcon field="nom" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('categorie')}
                  >
                    <div className="flex items-center gap-2">
                      Catégorie <SortIcon field="categorie" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted text-right"
                    onClick={() => handleSort('quantite')}
                  >
                    <div className="flex items-center gap-2 justify-end">
                      Stock <SortIcon field="quantite" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockGeneral.map((product) => {
                  const stockStatus = getStockStatus(product);
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(product.categorie)}</span>
                          <div>
                            <div className="font-medium">{product.nom}</div>
                            {product.description && (
                              <div className="text-sm text-muted-foreground">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.categorie}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${stockStatus.color}`}>
                          {product.quantite} {product.unite}
                          {(product.quantite <= product.seuilAlerte) && (
                            <AlertTriangle className="inline h-4 w-4 ml-1" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Seuil: {product.seuilAlerte}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{formatPrice(product.prixVente)}€</div>
                        <div className="text-sm text-muted-foreground">
                          Achat: {formatPrice(product.prixAchat)}€
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdjustment(product, -1)}
                            disabled={product.quantite === 0}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdjustment(product, 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {stockGeneral.length === 0 && !loading && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== 'all' || stockStatusFilter !== 'all'
                  ? 'Aucun produit ne correspond à vos critères de recherche.'
                  : 'Votre stock général est vide. Commencez par ajouter des produits.'}
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter votre premier produit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}