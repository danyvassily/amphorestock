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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  History, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  Download,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Clock,
  DollarSign,
  ShoppingCart,
  Truck,
  Users,
  Target,
  AlertCircle,
} from "lucide-react";
import { StockMovement, MovementType, Product } from "@/types";
import { toast } from "sonner";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Mock data pour les mouvements - sera remplacé par les données Firestore
// Liste vide pour démarrer avec des données propres
const mockMovements: StockMovement[] = [];

// Mock data pour les graphiques - Données à zéro pour démarrage propre
const generateChartData = () => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      entree: 0,
      sortie: 0,
      inventaire: 0,
      perte: 0,
    };
  }).reverse();

  return last7Days;
};

const generateCategoryData = () => [
  { name: 'Vins', value: 0, color: '#ef4444' },
  { name: 'Spiritueux', value: 0, color: '#f59e0b' },
  { name: 'Bières', value: 0, color: '#10b981' },
  { name: 'Softs', value: 0, color: '#3b82f6' },
  { name: 'Autres', value: 0, color: '#8b5cf6' },
];

const generateTopProducts = () => [
  { name: 'Aucun mouvement', sorties: 0, entrées: 0 },
  { name: 'Aucun mouvement', sorties: 0, entrées: 0 },
  { name: 'Aucun mouvement', sorties: 0, entrées: 0 },
  { name: 'Aucun mouvement', sorties: 0, entrées: 0 },
  { name: 'Aucun mouvement', sorties: 0, entrées: 0 },
];

export default function HistoriquePage() {
  const [movements, setMovements] = useState<StockMovement[]>(mockMovements);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>(mockMovements);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("7d");
  const [chartData] = useState(generateChartData());
  const [categoryData] = useState(generateCategoryData());
  const [topProducts] = useState(generateTopProducts());

  // Filtrer les mouvements
  useEffect(() => {
    let filtered = movements;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(movement =>
        movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par type
    if (selectedType !== "all") {
      filtered = filtered.filter(movement => movement.type === selectedType);
    }

    // Filtrage par période
    const now = new Date();
    let startDate = new Date();
    
    switch (selectedPeriod) {
      case '1d':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate = new Date(0); // Toutes les dates
    }

    if (selectedPeriod !== "all") {
      filtered = filtered.filter(movement => movement.createdAt >= startDate);
    }

    // Trier par date décroissante (plus récent en premier)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    setFilteredMovements(filtered);
  }, [movements, searchTerm, selectedType, selectedPeriod]);

  const getMovementIcon = (type: MovementType) => {
    switch (type) {
      case 'entree':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'sortie':
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      case 'inventaire':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      case 'perte':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'transfert':
        return <ArrowRightLeft className="h-4 w-4 text-purple-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMovementColor = (type: MovementType) => {
    switch (type) {
      case 'entree':
        return 'text-green-500';
      case 'sortie':
        return 'text-red-500';
      case 'inventaire':
        return 'text-blue-500';
      case 'perte':
        return 'text-orange-500';
      case 'transfert':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  const getMovementLabel = (type: MovementType) => {
    switch (type) {
      case 'entree':
        return 'Entrée';
      case 'sortie':
        return 'Sortie';
      case 'inventaire':
        return 'Inventaire';
      case 'perte':
        return 'Perte';
      case 'transfert':
        return 'Transfert';
      default:
        return 'Autre';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatsForPeriod = () => {
    const stats = {
      totalEntrees: 0,
      totalSorties: 0,
      totalInventaires: 0,
      totalPertes: 0,
      produitsActifs: 0,
      valeurStock: 0,
    };

    filteredMovements.forEach(movement => {
      switch (movement.type) {
        case 'entree':
          stats.totalEntrees += movement.quantity;
          break;
        case 'sortie':
          stats.totalSorties += movement.quantity;
          break;
        case 'inventaire':
          stats.totalInventaires += Math.abs(movement.quantity);
          break;
        case 'perte':
          stats.totalPertes += movement.quantity;
          break;
      }
    });

    return stats;
  };

  const stats = getStatsForPeriod();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historique & Rapports</h1>
          <p className="text-muted-foreground">
            Suivi détaillé des mouvements de stock et analyses d'activité
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Période
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrées Total</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalEntrees}</div>
            <p className="text-xs text-muted-foreground">
              +12% par rapport à la semaine dernière
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sorties Total</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalSorties}</div>
            <p className="text-xs text-muted-foreground">
              +8% par rapport à la semaine dernière
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventaires</CardTitle>
            <RotateCcw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalInventaires}</div>
            <p className="text-xs text-muted-foreground">
              Corrections effectuées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pertes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalPertes}</div>
            <p className="text-xs text-muted-foreground">
              -5% par rapport à la semaine dernière
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Graphique d'activité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Activité des 7 derniers jours
            </CardTitle>
            <CardDescription>
              Évolution des entrées et sorties de stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="entree" 
                  stackId="1" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                  name="Entrées"
                />
                <Area 
                  type="monotone" 
                  dataKey="sortie" 
                  stackId="1" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6}
                  name="Sorties"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Répartition par catégorie
            </CardTitle>
            <CardDescription>
              Distribution des mouvements par type de produit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top produits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Top 5 des produits les plus actifs
          </CardTitle>
          <CardDescription>
            Produits avec le plus de mouvements (entrées et sorties)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="entrées" fill="#10b981" />
              <Bar dataKey="sorties" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit, raison, notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type de mouvement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="entree">Entrées</SelectItem>
                <SelectItem value="sortie">Sorties</SelectItem>
                <SelectItem value="inventaire">Inventaires</SelectItem>
                <SelectItem value="perte">Pertes</SelectItem>
                <SelectItem value="transfert">Transferts</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Dernières 24h</SelectItem>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">90 derniers jours</SelectItem>
                <SelectItem value="all">Toute la période</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des mouvements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <History className="mr-2 h-5 w-5" />
              Mouvements de Stock
            </span>
            <Badge variant="secondary">
              {filteredMovements.length} mouvements
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun mouvement de stock</h3>
              <p className="text-muted-foreground">
                Commencez à utiliser le service pour voir les mouvements apparaître ici
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getMovementIcon(movement.type)}
                          <Badge 
                            variant="outline" 
                            className={`${getMovementColor(movement.type)} border capitalize`}
                          >
                            {getMovementLabel(movement.type)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.productName}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getMovementColor(movement.type)}`}>
                          {movement.type === 'sortie' || movement.type === 'perte' ? '-' : '+'}
                          {Math.abs(movement.quantity)}
                        </span>
                      </TableCell>
                      <TableCell>{movement.reason}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {movement.notes}
                      </TableCell>
                      <TableCell>
                        {formatDate(movement.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Package className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 