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
} from "lucide-react";
import { Product } from "@/types";
import Link from "next/link";
import { toast } from "sonner";

// Mock data étendu - sera remplacé par les données Firestore
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Château Margaux 2019',
    category: 'vins',
    subcategory: 'Rouge',
    quantity: 12,
    unit: 'bouteille',
    prixAchat: 180,
    prixVente: 220,
    prixVerre: 25,
    seuilAlerte: 5,
    fournisseur: 'Caviste Martin',
    isActive: true,
    createdAt: new Date('2024-01-15'),
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
    fournisseur: 'Distrib Pro',
    isActive: true,
    createdAt: new Date('2024-01-10'),
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
    fournisseur: 'Brasserie Direct',
    isActive: true,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date(),
    createdBy: 'user1'
  },
  {
    id: '4',
    name: 'Coca-Cola',
    category: 'softs',
    quantity: 2, // Stock faible
    unit: 'cannette',
    prixAchat: 1.2,
    prixVente: 3,
    seuilAlerte: 20,
    fournisseur: 'Metro',
    isActive: true,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date(),
    createdBy: 'user1'
  },
  {
    id: '5',
    name: 'Evian 1L',
    category: 'eaux',
    quantity: 45,
    unit: 'bouteille',
    prixAchat: 0.8,
    prixVente: 2.5,
    seuilAlerte: 15,
    fournisseur: 'Metro',
    isActive: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date(),
    createdBy: 'user1'
  }
];

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Product>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filtrer et trier les produits
  useEffect(() => {
    let filtered = products;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.fournisseur?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par catégorie
    if (selectedCategory !== "all") {
      if (selectedCategory === "low-stock") {
        filtered = filtered.filter(product => product.quantity <= product.seuilAlerte);
      } else {
        filtered = filtered.filter(product => product.category === selectedCategory);
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
  }, [products, searchTerm, selectedCategory, sortField, sortDirection]);

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
      // TODO: Supprimer de Firestore
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success("Produit supprimé");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
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
      total + (product.quantity * product.prixAchat), 0
    );
  };

  const getLowStockCount = () => {
    return products.filter(product => product.quantity <= product.seuilAlerte).length;
  };

  const categories = [
    { value: "all", label: "Tous les produits", count: products.length },
    { value: "low-stock", label: "Stock faible", count: getLowStockCount() },
    { value: "vins", label: "Vins", count: products.filter(p => p.category === 'vins').length },
    { value: "spiritueux", label: "Spiritueux", count: products.filter(p => p.category === 'spiritueux').length },
    { value: "bieres", label: "Bières", count: products.filter(p => p.category === 'bieres').length },
    { value: "softs", label: "Softs", count: products.filter(p => p.category === 'softs').length },
    { value: "eaux", label: "Eaux", count: products.filter(p => p.category === 'eaux').length },
  ];

  const SortIcon = ({ field }: { field: keyof Product }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? 
      <TrendingUp className="h-4 w-4" /> : 
      <TrendingDown className="h-4 w-4" />;
  };

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
            Vue complète et gestion de votre inventaire
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
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
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
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Produit <SortIcon field="name" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center gap-2">
                      Catégorie <SortIcon field="category" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted text-right"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center gap-2 justify-end">
                      Stock <SortIcon field="quantity" />
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
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isLowStock = product.quantity <= product.seuilAlerte;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.subcategory && (
                            <div className="text-sm text-muted-foreground">
                              {product.subcategory}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${isLowStock ? 'text-red-500' : ''}`}>
                          {product.quantity} {product.unit}
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
                        {product.fournisseur || "-"}
                      </TableCell>
                      <TableCell className="text-right">
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
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                Aucun produit ne correspond à vos critères de recherche
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