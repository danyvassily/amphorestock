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
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Calendar,
  Download,
  Target,
  Activity,
  Clock,
  Users,
  Zap,
  AlertCircle,
  Wine,
  Coffee,
  Coffee as SoftIcon,
  Truck,
  Star,
  Trophy,
  Filter,
} from "lucide-react";
import { Product } from "@/types";
import { toast } from "sonner";
import { useStocks } from "@/hooks/useStocks";
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
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

// Mock data pour les statistiques de ventes - Données à zéro pour démarrage propre
const generateSalesData = () => {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      ventesMidi: 0,
      ventesSoir: 0,
      chiffreAffaires: 0,
      benefices: 0,
    };
  }).reverse();

  return last30Days;
};

const generateCategoryStats = () => [
  { 
    name: 'Vins', 
    ventes: 0, 
    revenus: 0, 
    marge: 0, 
    color: '#ef4444',
    tendance: '0%',
    topProduits: ['Aucune vente']
  },
  { 
    name: 'Spiritueux', 
    ventes: 0, 
    revenus: 0, 
    marge: 0, 
    color: '#f59e0b',
    tendance: '0%',
    topProduits: ['Aucune vente']
  },
  { 
    name: 'Bières', 
    ventes: 0, 
    revenus: 0, 
    marge: 0, 
    color: '#10b981',
    tendance: '0%',
    topProduits: ['Aucune vente']
  },
  { 
    name: 'Softs', 
    ventes: 0, 
    revenus: 0, 
    marge: 0, 
    color: '#3b82f6',
    tendance: '0%',
    topProduits: ['Aucune vente']
  },
];

const generateHourlyData = () => [
  { heure: '11h', midi: 0, soir: 0 },
  { heure: '12h', midi: 0, soir: 0 },
  { heure: '13h', midi: 0, soir: 0 },
  { heure: '14h', midi: 0, soir: 0 },
  { heure: '15h', midi: 0, soir: 0 },
  { heure: '16h', midi: 0, soir: 0 },
  { heure: '17h', midi: 0, soir: 0 },
  { heure: '18h', midi: 0, soir: 0 },
  { heure: '19h', midi: 0, soir: 0 },
  { heure: '20h', midi: 0, soir: 0 },
  { heure: '21h', midi: 0, soir: 0 },
  { heure: '22h', midi: 0, soir: 0 },
  { heure: '23h', midi: 0, soir: 0 },
  { heure: '00h', midi: 0, soir: 0 },
];

const generateTopProducts = () => [
  { nom: 'Aucune vente', vendus: 0, revenus: 0, profit: 0, rotation: 'Aucune' },
  { nom: 'Aucune vente', vendus: 0, revenus: 0, profit: 0, rotation: 'Aucune' },
  { nom: 'Aucune vente', vendus: 0, revenus: 0, profit: 0, rotation: 'Aucune' },
  { nom: 'Aucune vente', vendus: 0, revenus: 0, profit: 0, rotation: 'Aucune' },
  { nom: 'Aucune vente', vendus: 0, revenus: 0, profit: 0, rotation: 'Aucune' },
];

const generatePerformanceMetrics = () => ({
  chiffreAffairesTotal: 0,
  chiffreAffairesTendance: '0%',
  beneficesTotal: 0,
  beneficesTendance: '0%',
  margeMoyenne: 0,
  margeTendance: '0%',
  rotationStock: 0,
  rotationTendance: '0',
  clientsMoyensJour: 0,
  clientsTendance: '0%',
  panierMoyen: 0,
  panierTendance: '0%',
});

export default function StatisticsPage() {
  const { stocks, loading, error, totalValue } = useStocks();
  const [salesData] = useState(generateSalesData());
  const [categoryStats] = useState(generateCategoryStats());
  const [hourlyData] = useState(generateHourlyData());
  const [topProducts] = useState(generateTopProducts());
  const [performanceMetrics] = useState(generatePerformanceMetrics());
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30d");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const getTrendIcon = (trend: string) => {
    return trend.startsWith('+') ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendColor = (trend: string) => {
    return trend.startsWith('+') ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistiques & Analytics</h1>
          <p className="text-muted-foreground">
            Analyse détaillée des performances et tendances de l&apos;établissement
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">3 derniers mois</SelectItem>
              <SelectItem value="1y">Dernière année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques de performance principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d&apos;Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{performanceMetrics.chiffreAffairesTotal.toLocaleString()}</div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(performanceMetrics.chiffreAffairesTendance)}
              <p className={`text-xs ${getTrendColor(performanceMetrics.chiffreAffairesTendance)}`}>
                {performanceMetrics.chiffreAffairesTendance} vs mois dernier
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéfices</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{performanceMetrics.beneficesTotal.toLocaleString()}</div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(performanceMetrics.beneficesTendance)}
              <p className={`text-xs ${getTrendColor(performanceMetrics.beneficesTendance)}`}>
                {performanceMetrics.beneficesTendance} vs mois dernier
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marge Moyenne</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.margeMoyenne}%</div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(performanceMetrics.margeTendance)}
              <p className={`text-xs ${getTrendColor(performanceMetrics.margeTendance)}`}>
                {performanceMetrics.margeTendance} vs mois dernier
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Évolution du chiffre d'affaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Évolution du Chiffre d&apos;Affaires
            </CardTitle>
            <CardDescription>
              Comparaison service midi vs soir sur 30 jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ventesMidi" fill="#3b82f6" name="Service Midi" />
                <Bar dataKey="ventesSoir" fill="#ef4444" name="Service Soir" />
                <Line 
                  type="monotone" 
                  dataKey="chiffreAffaires" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="CA Total"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des ventes par heure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Répartition Horaire des Ventes
            </CardTitle>
            <CardDescription>
              Pic d&apos;activité par tranche horaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="heure" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="midi" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="Service Midi"
                />
                <Area 
                  type="monotone" 
                  dataKey="soir" 
                  stackId="1" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6}
                  name="Service Soir"
                />
                <ReferenceLine x="13h" stroke="orange" strokeDasharray="5 5" />
                <ReferenceLine x="20h" stroke="orange" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="mr-2 h-5 w-5" />
            Performance par Catégorie
          </CardTitle>
          <CardDescription>
            Analyse détaillée des ventes et marges par type de produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categoryStats.map((category, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <h3 className="font-semibold">{category.name}</h3>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    {category.tendance}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ventes</span>
                    <span className="font-medium">{category.ventes}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenus</span>
                    <span className="font-medium">€{category.revenus}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Marge</span>
                    <span className="font-medium">{category.marge}%</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Top produits :</p>
                  <div className="space-y-1">
                    {category.topProduits.map((produit, i) => (
                      <p key={i} className="text-xs">{produit}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top produits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="mr-2 h-5 w-5" />
            Top 5 des Produits Performants
          </CardTitle>
          <CardDescription>
            Produits les plus rentables et leur performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold">{product.nom}</h3>
                    <p className="text-sm text-muted-foreground">
                      {product.vendus} unités vendues
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-6 text-right">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenus</p>
                    <p className="font-semibold">€{product.revenus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profit</p>
                    <p className="font-semibold text-green-600">€{product.profit}</p>
                  </div>
                  <div>
                    <Badge 
                      variant="outline" 
                      className={
                        product.rotation === 'Très rapide' ? 'text-green-600 border-green-600' :
                        product.rotation === 'Rapide' ? 'text-blue-600 border-blue-600' :
                        'text-orange-600 border-orange-600'
                      }
                    >
                      {product.rotation}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métriques additionnelles */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rotation du Stock</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.rotationStock}x</div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics.rotationTendance} vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients / Jour</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.clientsMoyensJour}</div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics.clientsTendance} vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <ShoppingCart className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{performanceMetrics.panierMoyen}</div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics.panierTendance} vs mois dernier
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 