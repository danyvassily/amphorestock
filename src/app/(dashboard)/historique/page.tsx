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
} from "lucide-react";
import { StockMovement, MovementType } from "@/types";
import { toast } from "sonner";

// Mock data pour les mouvements - sera remplacé par les données Firestore
const mockMovements: StockMovement[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Château Margaux 2019',
    type: 'sortie',
    quantity: 2,
    previousQuantity: 14,
    newQuantity: 12,
    reason: 'Vente service',
    notes: 'Table 5 - bouteilles',
    createdAt: new Date('2024-01-15T20:30:00'),
    createdBy: 'user1'
  },
  {
    id: '2',
    productId: '2',
    productName: 'Hendricks Gin',
    type: 'sortie',
    quantity: 5,
    previousQuantity: 13,
    newQuantity: 8,
    reason: 'Cocktails service',
    notes: 'Gin Tonic x5',
    createdAt: new Date('2024-01-15T19:45:00'),
    createdBy: 'user1'
  },
  {
    id: '3',
    productId: '3',
    productName: 'Kronenbourg 1664',
    type: 'entree',
    quantity: 24,
    previousQuantity: 0,
    newQuantity: 24,
    reason: 'Livraison',
    notes: 'Livraison Brasserie Direct',
    createdAt: new Date('2024-01-15T14:20:00'),
    createdBy: 'user1'
  },
  {
    id: '4',
    productId: '4',
    productName: 'Coca-Cola',
    type: 'sortie',
    quantity: 18,
    previousQuantity: 20,
    newQuantity: 2,
    reason: 'Vente service',
    notes: 'Service midi + soir',
    createdAt: new Date('2024-01-14T22:15:00'),
    createdBy: 'user1'
  },
  {
    id: '5',
    productId: '1',
    productName: 'Château Margaux 2019',
    type: 'inventaire',
    quantity: -1,
    previousQuantity: 15,
    newQuantity: 14,
    reason: 'Correction inventaire',
    notes: 'Bouteille cassée découverte',
    createdAt: new Date('2024-01-14T16:00:00'),
    createdBy: 'user1'
  },
  {
    id: '6',
    productId: '5',
    productName: 'Evian 1L',
    type: 'entree',
    quantity: 45,
    previousQuantity: 0,
    newQuantity: 45,
    reason: 'Réapprovisionnement',
    notes: 'Commande Metro',
    createdAt: new Date('2024-01-13T10:30:00'),
    createdBy: 'user1'
  }
];

export default function HistoriquePage() {
  const [movements, setMovements] = useState<StockMovement[]>(mockMovements);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>(mockMovements);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("7d");

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
        return type;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatsForPeriod = () => {
    const entrees = filteredMovements.filter(m => m.type === 'entree').length;
    const sorties = filteredMovements.filter(m => m.type === 'sortie').length;
    const inventaires = filteredMovements.filter(m => m.type === 'inventaire').length;
    const pertes = filteredMovements.filter(m => m.type === 'perte').length;

    return { entrees, sorties, inventaires, pertes };
  };

  const stats = getStatsForPeriod();

  const movementTypes = [
    { value: "all", label: "Tous les types" },
    { value: "entree", label: "Entrées" },
    { value: "sortie", label: "Sorties" },
    { value: "inventaire", label: "Inventaires" },
    { value: "perte", label: "Pertes" },
    { value: "transfert", label: "Transferts" },
  ];

  const periods = [
    { value: "1d", label: "Dernières 24h" },
    { value: "7d", label: "7 derniers jours" },
    { value: "30d", label: "30 derniers jours" },
    { value: "90d", label: "90 derniers jours" },
    { value: "all", label: "Tout l'historique" },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Historique des Mouvements
          </h1>
          <p className="text-muted-foreground">
            Suivi complet des entrées et sorties de stock
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exporter l'historique
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-green-500" />
              Entrées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.entrees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-red-500" />
              Sorties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.sorties}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-blue-500" />
              Inventaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.inventaires}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Pertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.pertes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par produit, raison ou notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type de mouvement" />
              </SelectTrigger>
              <SelectContent>
                {movementTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des mouvements */}
      <Card>
        <CardHeader>
          <CardTitle>Mouvements ({filteredMovements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Stock Avant</TableHead>
                  <TableHead className="text-right">Stock Après</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(movement.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{movement.productName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.type)}
                        <Badge variant="outline" className={getMovementColor(movement.type)}>
                          {getMovementLabel(movement.type)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${
                        movement.type === 'entree' || movement.quantity > 0 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {movement.type === 'entree' || movement.quantity > 0 ? '+' : ''}
                        {movement.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.previousQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">
                        {movement.newQuantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      {movement.reason || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {movement.notes || '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredMovements.length === 0 && (
            <div className="text-center py-12">
              <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun mouvement trouvé</h3>
              <p className="text-muted-foreground">
                Aucun mouvement ne correspond à vos critères de recherche
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 