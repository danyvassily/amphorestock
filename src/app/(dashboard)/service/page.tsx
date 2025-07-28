"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Play, 
  Pause,
  Square,
  Clock,
  Search, 
  Minus,
  Plus,
  Loader2,
  AlertTriangle,
  Package,
  Wine,
  Coffee,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Users,
  DollarSign,
  Activity,
  ChefHat,
  Moon,
  Sun,
  Timer,
  BarChart3,
  Check,
  X,
  RefreshCw,
  ArrowUp,
  Bell,
  Star,
  Truck,
  AlertCircle,
} from "lucide-react";
import { Product } from "@/types";
import { toast } from "sonner";
import { useStocks } from "@/hooks/useStocks";
import { StockService } from "@/lib/stockService";
import { getCategoryColor, getCategoryLabel } from "@/lib/product-classifier";
import { useAuth } from "@/contexts/auth-context";

// Types pour le service
interface ServiceSession {
  id: string;
  type: 'midi' | 'soir';
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  sales: ServiceSale[];
}

interface ServiceSale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
  timestamp: Date;
}

interface ServiceStats {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  averageBasket: number;
  topCategory: string;
  salesCount: number;
}

export default function ServicePage() {
  const { user } = useAuth();
  const { stocks, loading, error, lowStockCount } = useStocks();
  
  // États du service
  const [currentSession, setCurrentSession] = useState<ServiceSession | null>(null);
  const [serviceTimer, setServiceTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // États des ventes
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [quickSellQuantities, setQuickSellQuantities] = useState<{ [key: string]: number }>({});
  
  // États des dialogues
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [tableNumber, setTableNumber] = useState("");
  
  // États des statistiques
  const [serviceStats, setServiceStats] = useState<ServiceStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    averageBasket: 0,
    topCategory: '',
    salesCount: 0,
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setServiceTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Filtrer les produits
  useEffect(() => {
    let filtered = stocks.filter(product => product.isActive && product.quantite > 0);

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

  // Fonctions du timer
  const startService = (type: 'midi' | 'soir') => {
    const newSession: ServiceSession = {
      id: Date.now().toString(),
      type,
      startTime: new Date(),
      isActive: true,
      sales: [],
    };
    
    setCurrentSession(newSession);
    setServiceTimer(0);
    setIsTimerRunning(true);
    
    toast.success(`Service ${type} démarré !`, {
      description: `Timer activé - ${type === 'midi' ? '🌅' : '🌙'}`
    });
  };

  const pauseService = () => {
    setIsTimerRunning(!isTimerRunning);
    toast.info(isTimerRunning ? "Service mis en pause" : "Service repris");
  };

  const endService = () => {
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        endTime: new Date(),
        isActive: false,
      };
      setCurrentSession(null);
      setIsTimerRunning(false);
      setServiceTimer(0);
      
      toast.success("Service terminé !", {
        description: `Durée : ${formatTime(serviceTimer)} | CA : €${serviceStats.totalRevenue.toFixed(2)}`
      });
    }
  };

  // Fonction de vente rapide
  const handleQuickSell = async (product: Product, quantity: number = 1) => {
    if (!currentSession) {
      toast.error("Aucun service actif ! Démarrez un service d'abord.");
      return;
    }

    try {
      setActionLoading(product.id);
      
      if (product.quantite < quantity) {
        toast.error(`Stock insuffisant (${product.quantite} disponible)`);
        return;
      }

      // Simuler la vente (dans une vraie app, ça ferait appel à l'API)
      const sale: ServiceSale = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.nom,
        quantity,
        unitPrice: product.prixVente,
        totalPrice: product.prixVente * quantity,
        category: product.categorie,
        timestamp: new Date(),
      };

      // Mettre à jour la session
      const updatedSession = {
        ...currentSession,
        sales: [...currentSession.sales, sale],
      };
      setCurrentSession(updatedSession);

      // Mettre à jour les stats
      updateServiceStats(updatedSession.sales);

      // Réduire le stock
      await StockService.sellProduct(product.id, quantity, user?.uid || 'anonymous');
      
      toast.success(`Vendu : ${quantity} ${product.unite} - ${product.nom}`, {
        description: `Table ${tableNumber || 'N/A'} | €${sale.totalPrice.toFixed(2)}`
      });

    } catch (error) {
      console.error("Erreur vente:", error);
      toast.error("Erreur lors de la vente");
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction de vente avec dialogue
  const handleSellWithDialog = (product: Product) => {
    setSelectedProduct(product);
    setSellQuantity(1);
    setIsSellDialogOpen(true);
  };

  const confirmSale = async () => {
    if (selectedProduct) {
      await handleQuickSell(selectedProduct, sellQuantity);
      setIsSellDialogOpen(false);
      setSelectedProduct(null);
      setSellQuantity(1);
      setTableNumber("");
    }
  };

  // Mettre à jour les statistiques du service
  const updateServiceStats = (sales: ServiceSale[]) => {
    const stats: ServiceStats = {
      totalSales: sales.reduce((sum, sale) => sum + sale.quantity, 0),
      totalRevenue: sales.reduce((sum, sale) => sum + sale.totalPrice, 0),
      totalProfit: sales.reduce((sum, sale) => sum + (sale.totalPrice * 0.6), 0), // Estimation 60% de marge
      salesCount: sales.length,
      averageBasket: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.totalPrice, 0) / sales.length : 0,
      topCategory: getTopCategory(sales),
    };
    setServiceStats(stats);
  };

  const getTopCategory = (sales: ServiceSale[]): string => {
    const categoryCount: { [key: string]: number } = {};
    sales.forEach(sale => {
      categoryCount[sale.category] = (categoryCount[sale.category] || 0) + sale.quantity;
    });
    
    return Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, ''
    );
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getServiceIcon = (type: 'midi' | 'soir') => {
    return type === 'midi' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />;
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

  const getCurrentTimeCategory = (): 'midi' | 'soir' => {
    const hour = new Date().getHours();
    return hour >= 11 && hour <= 15 ? 'midi' : 'soir';
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles de service */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-8 w-8 text-yellow-500" />
            Gestion Service
          </h1>
          <p className="text-muted-foreground">
            Suivi des ventes en temps réel - Service {getCurrentTimeCategory()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {!currentSession ? (
            <>
              <Button 
                onClick={() => startService('midi')} 
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Sun className="mr-2 h-4 w-4" />
                Service Midi
              </Button>
              <Button 
                onClick={() => startService('soir')} 
                className="bg-purple-500 hover:bg-purple-600"
              >
                <Moon className="mr-2 h-4 w-4" />
                Service Soir
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900 rounded-lg">
                {getServiceIcon(currentSession.type)}
                <span className="font-semibold">Service {currentSession.type}</span>
                <Badge variant="secondary" className="ml-2">
                  <Timer className="mr-1 h-3 w-3" />
                  {formatTime(serviceTimer)}
                </Badge>
              </div>
              
              <Button
                onClick={pauseService}
                variant="outline"
                size="sm"
              >
                {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                onClick={endService}
                variant="destructive"
                size="sm"
              >
                <Square className="mr-2 h-4 w-4" />
                Terminer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistiques du service en cours */}
      {currentSession && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceStats.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                {serviceStats.salesCount} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{serviceStats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                en {formatTime(serviceTimer)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bénéfices</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{serviceStats.totalProfit.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                ~60% de marge
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{serviceStats.averageBasket.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                par transaction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Catégorie</CardTitle>
              <Star className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{getCategoryLabel(serviceStats.topCategory as any) || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">
                le plus vendu
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres de recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Recherche Produits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="vins">Vins</SelectItem>
                <SelectItem value="spiritueux">Spiritueux</SelectItem>
                <SelectItem value="bieres">Bières</SelectItem>
                <SelectItem value="softs">Softs</SelectItem>
                <SelectItem value="jus">Jus</SelectItem>
                <SelectItem value="eaux">Eaux</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Produits Disponibles
            </span>
            <Badge variant="secondary">
              {filteredProducts.length} produits
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Actions Rapides</TableHead>
                  <TableHead>Vente Personnalisée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.nom}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.unite}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(product.categorie)}
                        <Badge 
                          variant="outline" 
                          className={`${getCategoryColor(product.categorie)} border capitalize`}
                        >
                          {getCategoryLabel(product.categorie)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${product.quantite <= product.seuilAlerte ? 'text-red-600' : ''}`}>
                        {product.quantite}
                      </div>
                      {product.quantite <= product.seuilAlerte && (
                        <div className="flex items-center text-red-600 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Stock faible
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">€{product.prixVente.toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickSell(product, 1)}
                          disabled={actionLoading === product.id || !currentSession}
                        >
                          {actionLoading === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>1</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickSell(product, 2)}
                          disabled={actionLoading === product.id || !currentSession}
                        >
                          2
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickSell(product, 5)}
                          disabled={actionLoading === product.id || !currentSession}
                        >
                          5
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleSellWithDialog(product)}
                        disabled={!currentSession}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Vente
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogue de vente personnalisée */}
      <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vente - {selectedProduct?.nom}</DialogTitle>
            <DialogDescription>
              Configurer les détails de la vente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Quantité</label>
              <div className="flex items-center space-x-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(Number(e.target.value))}
                  className="w-20 text-center"
                  min="1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSellQuantity(sellQuantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Numéro de table (optionnel)</label>
              <Input
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Ex: Table 5, Bar, Terrasse..."
                className="mt-1"
              />
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Prix unitaire :</span>
                <span>€{selectedProduct?.prixVente.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Quantité :</span>
                <span>{sellQuantity}</span>
              </div>
              <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
                <span>Total :</span>
                <span>€{((selectedProduct?.prixVente || 0) * sellQuantity).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSellDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmSale}>
              <Check className="mr-2 h-4 w-4" />
              Confirmer la vente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alertes de stock faible */}
      {lowStockCount > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800 dark:text-orange-200">
              <AlertCircle className="mr-2 h-5 w-5" />
              Alertes Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 dark:text-orange-300">
              {lowStockCount} produit(s) ont un stock faible. 
              <Button variant="link" className="text-orange-600 p-0 ml-1">
                Voir les alertes
              </Button>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 