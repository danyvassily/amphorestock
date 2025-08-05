'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useVins } from '@/hooks/useModernProducts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Minus, Wine, AlertTriangle, Edit, Trash2, Wifi, WifiOff, Clock } from 'lucide-react';
import { Product, ProductFormData } from '@/types';
import { ActivityService } from '@/services/activityService';
import { toast } from 'sonner';

export default function VinsPage() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nom');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Éviter les problèmes d'hydratation
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Utiliser le hook moderne avec synchronisation temps réel
  const {
    products: vins,
    loading,
    error,
    connectionStatus,
    stats,
    addProduct,
    updateProduct,
    deleteProduct,
    removeStock,
    addStock,
    recordSale,
    clearError
  } = useVins({
    search: searchTerm,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    sortBy: sortBy,
    sortOrder: 'asc'
  });

  // Debug logs
  React.useEffect(() => {
    console.log('🍷 VinsPage State:', {
      mounted,
      loading,
      vinsCount: vins.length,
      error,
      connectionStatus
    });
  }, [mounted, loading, vins.length, error, connectionStatus]);

  // Statistiques spécifiques aux vins
  const vinsStats = useMemo(() => ({
    total: stats.totalVins,
    stockFaible: stats.lowStockCount,
    enRupture: stats.outOfStockCount,
    valeurTotale: stats.totalValue,
    categories: {
      rouge: vins.filter(v => v.categorie === 'vin-rouge').length,
      blanc: vins.filter(v => v.categorie === 'vin-blanc').length,
      rose: vins.filter(v => v.categorie === 'vin-rose').length,
      autres: vins.filter(v => v.categorie === 'vins').length,
    }
  }), [vins, stats]);

  const handleQuickSale = async (product: Product, type: 'verre' | 'bouteille') => {
    try {
      const quantity = 1; // 1 verre ou 1 bouteille
      
      // Déterminer le prix de vente selon le type
      let salePrice: number;
      if (type === 'verre' && product.prixVerre) {
        salePrice = product.prixVerre;
      } else if (type === 'bouteille' && product.prixBouteille) {
        salePrice = product.prixBouteille;
      } else {
        salePrice = product.prixVente; // Prix de vente par défaut
      }
      
      // Enregistrer la vente avec statistiques
      await recordSale(product.id, quantity, salePrice, type);
      
      toast.success(`Vente ${type} enregistrée`, {
        description: `${product.nom} - ${quantity} ${type} (${salePrice.toFixed(2)}€)`,
      });
    } catch (error) {
      toast.error('Erreur lors de la vente', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  };

  const handleAddStock = async (product: Product, quantity: number = 1) => {
    try {
      const oldQuantity = product.quantite;
      await addStock(product.id, quantity, `Ajout manuel - ${quantity} bouteille${quantity > 1 ? 's' : ''}`);
      
      // Enregistrer l'activité
      await ActivityService.recordStockActivity(
        product,
        oldQuantity,
        oldQuantity + quantity,
        `Ajout manuel de ${quantity} bouteille${quantity > 1 ? 's' : ''}`,
        'current-user',
        'Utilisateur'
      );
      
      toast.success(`Stock ajouté avec succès`, {
        description: `${product.nom} - +${quantity} bouteille${quantity > 1 ? 's' : ''}`,
      });
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de stock', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  };

  const handleAddProduct = async (productData: ProductFormData) => {
    try {
      await addProduct({ ...productData, type: 'vins' });
      
      // Enregistrer l'activité de création
      await ActivityService.recordActivity(
        'product_created',
        `Nouveau vin ajouté - ${productData.nom}`,
        `Le vin "${productData.nom}" (${productData.categorie}) a été ajouté avec ${productData.quantite} bouteille(s)`,
        'success',
        'current-user',
        'Utilisateur',
        {
          productName: productData.nom,
          categoryId: productData.categorie,
          quantity: productData.quantite,
          price: productData.prixVente
        }
      );
      
      setShowAddDialog(false);
      toast.success('Vin ajouté avec succès');
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
      toast.success('Vin modifié avec succès');
    } catch (error) {
      toast.error('Erreur lors de la modification', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      toast.success('Vin supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.quantite === 0) return { label: 'Rupture', variant: 'destructive' as const };
    if (product.quantite <= product.seuilAlerte) return { label: 'Stock faible', variant: 'secondary' as const };
    return { label: 'Stock normal', variant: 'default' as const };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vin-rouge': return '🍷';
      case 'vin-blanc': return '🥂';
      case 'vin-rose': return '🌹';
      default: return '🍾';
    }
  };

  // Fonction pour formater les prix avec 2 décimales
  const formatPrice = (price?: number): string => {
    if (!price && price !== 0) return '0.00';
    return price.toFixed(2);
  };

  // Composant pour le formulaire simple d'ajout
  const SimpleProductForm = ({ onSubmit, onCancel }: { 
    onSubmit: (data: ProductFormData) => void; 
    onCancel: () => void; 
  }) => {
    const [formData, setFormData] = useState<ProductFormData>({
      nom: '',
      categorie: 'vin-rouge',
      type: 'vins',
      quantite: 1,
      unite: 'bouteille',
      prixAchat: 0,
      prixVente: 0,
      seuilAlerte: 3,
      fournisseur: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom du vin *</label>
            <Input
              value={formData.nom}
              onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
              placeholder="Ex: Château Margaux 2018"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Fournisseur</label>
            <Input
              value={formData.fournisseur || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, fournisseur: e.target.value }))}
              placeholder="Ex: Domaine de la Côte d'Or"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie *</label>
            <Select value={formData.categorie} onValueChange={(value: any) => setFormData(prev => ({ ...prev, categorie: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vin-rouge">🍷 Vin rouge</SelectItem>
                <SelectItem value="vin-blanc">🥂 Vin blanc</SelectItem>
                <SelectItem value="vin-rose">🌹 Vin rosé</SelectItem>
                <SelectItem value="vins">🍾 Autres vins</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
        </div>

        {/* Section Prix */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">💰 Informations tarifaires</h4>
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-1">Prix de vente bouteille (€) *</label>
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
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium mb-1">Prix au verre (€)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.prixVerre || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, prixVerre: e.target.value ? Number(e.target.value) : undefined }))}
                min="0"
                placeholder="Optionnel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Seuil d'alerte *</label>
              <Input
                type="number"
                value={formData.seuilAlerte}
                onChange={(e) => setFormData(prev => ({ ...prev, seuilAlerte: Number(e.target.value) }))}
                min="1"
                required
                placeholder="Ex: 3"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            Ajouter le vin
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
            🍷 Gestion des Vins
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
            Gérez votre cave et vos ventes au verre ou à la bouteille • Synchronisation temps réel
          </p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un vin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau vin</DialogTitle>
              <DialogDescription>
                Remplissez les informations du vin à ajouter à votre cave.
              </DialogDescription>
            </DialogHeader>
            <SimpleProductForm
              onSubmit={handleAddProduct}
              onCancel={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>
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

      {/* Statistiques des vins */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total vins</p>
                <p className="text-2xl font-bold">{vinsStats.total}</p>
              </div>
              <Wine className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock faible</p>
                <p className="text-2xl font-bold text-orange-600">{vinsStats.stockFaible}</p>
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
                <p className="text-2xl font-bold text-red-600">{vinsStats.enRupture}</p>
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
                <p className="text-2xl font-bold">{formatPrice(vinsStats.valeurTotale)}€</p>
              </div>
              <Wine className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Par catégorie</p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>🍷 Rouges</span>
                  <span className="font-semibold">{vinsStats.categories.rouge}</span>
                </div>
                <div className="flex justify-between">
                  <span>🥂 Blancs</span>
                  <span className="font-semibold">{vinsStats.categories.blanc}</span>
                </div>
                <div className="flex justify-between">
                  <span>🌹 Rosés</span>
                  <span className="font-semibold">{vinsStats.categories.rose}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher un vin... (temps réel)"
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
                <SelectItem value="vin-rouge">🍷 Vins rouges</SelectItem>
                <SelectItem value="vin-blanc">🥂 Vins blancs</SelectItem>
                <SelectItem value="vin-rose">🌹 Vins rosés</SelectItem>
                <SelectItem value="vins">🍾 Autres vins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nom">Nom A-Z</SelectItem>
                <SelectItem value="quantite">Quantité</SelectItem>
                <SelectItem value="prixVente">Prix</SelectItem>
                <SelectItem value="createdAt">Date d'ajout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des vins */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {vins.map((vin) => {
          const stockStatus = getStockStatus(vin);
          
          return (
            <Card key={vin.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight flex items-center gap-2">
                      {getCategoryIcon(vin.categorie)}
                      {vin.nom}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {vin.categorie} • {vin.quantite} {vin.unite}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={stockStatus.variant} className="text-xs">
                      {stockStatus.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Prix */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {vin.prixVerre && (
                    <div>
                      <p className="text-muted-foreground">Prix au verre</p>
                      <p className="font-semibold">{formatPrice(vin.prixVerre)}€</p>
                    </div>
                  )}
                  {vin.prixBouteille && (
                    <div>
                      <p className="text-muted-foreground">Prix bouteille</p>
                      <p className="font-semibold">{formatPrice(vin.prixBouteille)}€</p>
                    </div>
                  )}
                </div>

                {/* Gestion du stock */}
                <div className="space-y-2">
                  {/* Ajout de stock */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAddStock(vin, 1)}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      +1 Bouteille
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAddStock(vin, 5)}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      +5 Bouteilles
                    </Button>
                  </div>

                  {/* Actions de vente rapide */}
                  <div className="flex gap-2">
                    {vin.prixVerre && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickSale(vin, 'verre')}
                        disabled={vin.quantite === 0}
                        className="flex-1"
                      >
                        <Minus className="h-4 w-4 mr-1" />
                        Verre
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickSale(vin, 'bouteille')}
                      disabled={vin.quantite === 0}
                      className="flex-1"
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Bouteille
                    </Button>
                  </div>
                </div>

                {/* Actions d'édition */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingProduct(vin)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteProduct(vin)}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </div>

                {/* Barre de stock visuelle */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Stock: {vin.quantite}</span>
                    <span>Seuil: {vin.seuilAlerte}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        vin.quantite === 0 
                          ? 'bg-red-500' 
                          : vin.quantite <= vin.seuilAlerte 
                          ? 'bg-orange-500' 
                          : 'bg-green-500'
                      }`}
                      data-width={Math.min((vin.quantite / (vin.seuilAlerte * 3)) * 100, 100)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Message si aucun vin trouvé */}
      {vins.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Wine className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun vin trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Aucun vin ne correspond à vos critères de recherche.'
                  : 'Votre cave est vide. Commencez par ajouter des vins.'}
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter votre premier vin
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}