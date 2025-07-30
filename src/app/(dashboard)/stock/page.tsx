"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { FileUploadZone } from '@/components/file-upload-zone';
import { TimelineActions } from '@/components/timeline-actions';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { 
  Package, 
  Upload, 
  Clock, 
  QrCode, 
  Settings, 
  Download,
  Plus,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function StockPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Gestion des fichiers uploadés
  const handleFilesSelected = (files: File[]) => {
    console.log('Fichiers sélectionnés:', files);
    toast.success(`${files.length} fichier(s) prêt(s) pour l'import IA`);
  };

  const handleProcessingComplete = (results: any[]) => {
    console.log('Traitement terminé:', results);
    toast.success(`Traitement terminé: ${results.filter(r => r.success).length}/${results.length} fichiers traités`);
  };

  // Gestion du scan de code-barres
  const handleBarcodeDetected = (barcode: string) => {
    console.log('Code-barres détecté:', barcode);
    toast.success(`Code-barres détecté: ${barcode}`);
  };

  const handleProductFound = (product: any) => {
    console.log('Produit trouvé:', product);
    toast.success(`Produit trouvé: ${product.name}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gestion de Stock</h1>
            <p className="text-muted-foreground">
              Système automatisé de gestion des stocks avec IA
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter produit
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Produits en stock</span>
            </div>
            <p className="text-2xl font-bold">1,247</p>
            <p className="text-xs text-muted-foreground">+12% ce mois</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Imports IA</span>
            </div>
            <p className="text-2xl font-bold">156</p>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Scans code-barres</span>
            </div>
            <p className="text-2xl font-bold">89</p>
            <p className="text-xs text-muted-foreground">Aujourd'hui</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Actions timeline</span>
            </div>
            <p className="text-2xl font-bold">2,341</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Interface principale */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import IA
          </TabsTrigger>
          <TabsTrigger value="scanner" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Scanner
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recherche et filtres */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Recherche de produits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Catégories
                    </Button>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Fournisseurs
                    </Button>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Stock faible
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Import IA</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <QrCode className="h-6 w-6" />
                    <span className="text-sm">Scanner</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <Download className="h-6 w-6" />
                    <span className="text-sm">Export</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <Plus className="h-6 w-6" />
                    <span className="text-sm">Ajouter</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des produits récents */}
          <Card>
            <CardHeader>
              <CardTitle>Produits récemment ajoutés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Bordeaux Rouge 2020', category: 'vins-rouge', quantity: 12, price: 15.50 },
                  { name: 'Champagne Brut', category: 'champagne', quantity: 6, price: 45.00 },
                  { name: 'Gin Bombay', category: 'spiritueux', quantity: 8, price: 25.00 },
                  { name: 'Whisky Highland', category: 'spiritueux', quantity: 4, price: 35.00 }
                ].map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{product.category}</Badge>
                          <span>{product.quantity} en stock</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{product.price}€</p>
                      <p className="text-xs text-muted-foreground">Prix unitaire</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import IA */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import IA Intelligent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onFilesSelected={handleFilesSelected}
                onProcessingComplete={handleProcessingComplete}
                maxFiles={10}
                maxFileSize={10}
                showPreview={true}
                autoProcess={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scanner de code-barres */}
        <TabsContent value="scanner" className="space-y-6">
          <BarcodeScanner
            onBarcodeDetected={handleBarcodeDetected}
            onProductFound={handleProductFound}
          />
        </TabsContent>

        {/* Timeline des actions */}
        <TabsContent value="timeline" className="space-y-6">
          <TimelineActions userId={user?.uid || 'anonymous'} />
        </TabsContent>
      </Tabs>

      {/* Footer avec informations système */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Système automatisé v2.1</span>
              <span>•</span>
              <span>IA active</span>
              <span>•</span>
              <span>OCR disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Dernière sync: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 