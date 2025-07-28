"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Minus, 
  Plus, 
  Zap,
  Wine,
  Coffee,
  Package,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Product } from "@/types";
import { toast } from "sonner";

// Mock data - sera remplacé par les données Firestore
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Château Margaux 2019',
    category: 'vins',
    quantity: 12,
    unit: 'bouteille',
    prixAchat: 180,
    prixVente: 220,
    prixVerre: 25,
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
    quantity: 8,
    unit: 'bouteille',
    prixAchat: 35,
    prixVente: 45,
    prixVerre: 8,
    seuilAlerte: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user1'
  },
  {
    id: '3',
    name: 'Kronenbourg 1664',
    category: 'bieres',
    quantity: 24,
    unit: 'bouteille',
    prixAchat: 2.5,
    prixVente: 4.5,
    seuilAlerte: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user1'
  },
  {
    id: '4',
    name: 'Coca-Cola',
    category: 'softs',
    quantity: 15,
    unit: 'cannette',
    prixAchat: 1.2,
    prixVente: 3,
    seuilAlerte: 20,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user1'
  }
];

export default function ServicePage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>({});

  // Filtrer les produits selon la recherche et la catégorie
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

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

  const handleQuantityChange = (productId: string, change: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentPending = pendingChanges[productId] || 0;
    const newPending = currentPending + change;
    const newQuantity = product.quantity + newPending;

    // Vérifier que la nouvelle quantité n'est pas négative
    if (newQuantity < 0) {
      toast.error("Stock insuffisant");
      return;
    }

    setPendingChanges(prev => ({
      ...prev,
      [productId]: newPending
    }));
  };

  const applyChanges = async () => {
    try {
      // TODO: Appliquer les changements à Firestore
      const updatedProducts = products.map(product => {
        const change = pendingChanges[product.id] || 0;
        if (change !== 0) {
          return {
            ...product,
            quantity: product.quantity + change,
            updatedAt: new Date()
          };
        }
        return product;
      });

      setProducts(updatedProducts);
      setPendingChanges({});
      
      const changesCount = Object.values(pendingChanges).filter(change => change !== 0).length;
      toast.success(`${changesCount} modifications appliquées`);
    } catch (error) {
      console.error("Erreur lors de l'application des changements:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const resetChanges = () => {
    setPendingChanges({});
    toast.info("Modifications annulées");
  };

  const categories = [
    { value: "all", label: "Toutes catégories" },
    { value: "vins", label: "Vins" },
    { value: "spiritueux", label: "Spiritueux" },
    { value: "bieres", label: "Bières" },
    { value: "softs", label: "Softs" },
    { value: "jus", label: "Jus" },
    { value: "eaux", label: "Eaux" },
  ];

  const pendingChangesCount = Object.values(pendingChanges).filter(change => change !== 0).length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-yellow-500" />
            Service Rapide
          </h1>
          <p className="text-muted-foreground">
            Gestion rapide du stock pendant le service
          </p>
        </div>
        
        {pendingChangesCount > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetChanges}>
              Annuler ({pendingChangesCount})
            </Button>
            <Button onClick={applyChanges}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Appliquer ({pendingChangesCount})
            </Button>
          </div>
        )}
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
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
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const pendingChange = pendingChanges[product.id] || 0;
          const newQuantity = product.quantity + pendingChange;
          const isLowStock = newQuantity <= product.seuilAlerte;
          
          return (
            <Card key={product.id} className={`transition-all ${pendingChange !== 0 ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(product.category)}
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </div>
                  <Badge variant={isLowStock ? "destructive" : "secondary"} className="text-xs">
                    {product.category}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stock actuel */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stock:</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isLowStock ? 'text-red-500' : ''}`}>
                      {newQuantity} {product.unit}
                    </span>
                    {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>

                {/* Changement en cours */}
                {pendingChange !== 0 && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Changement:</span>
                    <span className={`font-bold ${pendingChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {pendingChange > 0 ? '+' : ''}{pendingChange}
                    </span>
                  </div>
                )}

                {/* Prix */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prix vente:</span>
                  <span className="font-medium">
                    {product.prixVente.toFixed(2)}€
                    {product.prixVerre && ` / ${product.prixVerre.toFixed(2)}€ verre`}
                  </span>
                </div>

                {/* Contrôles de quantité */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(product.id, -1)}
                    disabled={newQuantity <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(product.id, -5)}
                      disabled={newQuantity < 5}
                    >
                      -5
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(product.id, -10)}
                      disabled={newQuantity < 10}
                    >
                      -10
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(product.id, 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
          <p className="text-muted-foreground">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      )}
    </div>
  );
} 