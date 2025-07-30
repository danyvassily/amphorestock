"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, QrCode, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onProductFound?: (product: any) => void;
  className?: string;
}

export interface ScannedProduct {
  barcode: string;
  name: string;
  category: string;
  price: number;
  found: boolean;
  confidence: number;
}

export function BarcodeScanner({ 
  onBarcodeDetected, 
  onProductFound,
  className = '' 
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedBarcodes, setScannedBarcodes] = useState<ScannedProduct[]>([]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Démarrer le scan
  const startScanning = async () => {
    try {
      setIsScanning(true);
      
      // Vérifier si l'API de caméra est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Caméra non disponible sur ce navigateur');
        return;
      }

      // Demander l'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Caméra arrière si disponible
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }

      // Démarrer la détection de code-barres
      startBarcodeDetection();

    } catch (error) {
      console.error('Erreur lors du démarrage du scan:', error);
      toast.error('Impossible d\'accéder à la caméra');
      setIsScanning(false);
    }
  };

  // Arrêter le scan
  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
    setIsScanning(false);
  };

  // Détection de code-barres (simulation)
  const startBarcodeDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const detectBarcode = () => {
      if (!isScanning) return;

      // Simulation de détection de code-barres
      // Dans une vraie implémentation, on utiliserait une librairie comme QuaggaJS ou ZXing
      const mockBarcodes = [
        '1234567890123',
        '9876543210987',
        '4567891234567',
        '7891234567890'
      ];

      // Simuler une détection aléatoire
      if (Math.random() < 0.1) { // 10% de chance de détecter un code
        const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
        handleBarcodeDetected(randomBarcode);
      }

      // Continuer la détection
      requestAnimationFrame(detectBarcode);
    };

    detectBarcode();
  };

  // Gérer la détection d'un code-barres
  const handleBarcodeDetected = async (barcode: string) => {
    // Éviter les doublons récents
    if (scannedBarcodes.some(p => p.barcode === barcode && 
        Date.now() - new Date().getTime() < 5000)) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // Rechercher le produit dans la base de données
      const product = await searchProductByBarcode(barcode);
      
      const scannedProduct: ScannedProduct = {
        barcode,
        name: product?.name || 'Produit inconnu',
        category: product?.category || 'Non catégorisé',
        price: product?.price || 0,
        found: !!product,
        confidence: product ? 95 : 50
      };

      setScannedBarcodes(prev => [scannedProduct, ...prev]);
      
      // Notifier les callbacks
      onBarcodeDetected(barcode);
      if (onProductFound && product) {
        onProductFound(product);
      }

      toast.success(
        product 
          ? `Produit trouvé: ${product.name}` 
          : `Code-barres détecté: ${barcode}`
      );

    } catch (error) {
      console.error('Erreur lors de la recherche du produit:', error);
      toast.error('Erreur lors de la recherche du produit');
    } finally {
      setIsProcessing(false);
    }
  };

  // Rechercher un produit par code-barres
  const searchProductByBarcode = async (barcode: string): Promise<any> => {
    // Simulation de recherche dans la base de données
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockProducts = {
      '1234567890123': {
        name: 'Bordeaux Rouge 2020',
        category: 'vins-rouge',
        price: 15.50,
        barcode: '1234567890123'
      },
      '9876543210987': {
        name: 'Champagne Brut',
        category: 'champagne',
        price: 45.00,
        barcode: '9876543210987'
      },
      '4567891234567': {
        name: 'Gin Bombay',
        category: 'spiritueux',
        price: 25.00,
        barcode: '4567891234567'
      }
    };

    return mockProducts[barcode as keyof typeof mockProducts] || null;
  };

  // Saisie manuelle de code-barres
  const handleManualBarcodeSubmit = async () => {
    if (!manualBarcode.trim()) {
      toast.error('Veuillez saisir un code-barres');
      return;
    }

    await handleBarcodeDetected(manualBarcode.trim());
    setManualBarcode('');
  };

  // Nettoyer l'historique
  const clearHistory = () => {
    setScannedBarcodes([]);
  };

  // Nettoyer à la fermeture
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner de Code-barres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Scanner automatique */}
            <div className="space-y-4">
              <h3 className="font-medium">Scan automatique</h3>
              
              {!isCameraActive ? (
                <Button 
                  onClick={startScanning}
                  className="w-full"
                  disabled={isScanning}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Démarrer le scan
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full h-64 bg-black rounded-lg object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                      style={{ display: 'none' }}
                    />
                    
                    {/* Overlay de scan */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-white rounded-lg p-8">
                        <div className="w-48 h-32 border-2 border-primary rounded-lg relative">
                          {/* Coin de scan animé */}
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={stopScanning}
                    variant="outline"
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Arrêter le scan
                  </Button>
                </div>
              )}
            </div>

            {/* Saisie manuelle */}
            <div className="space-y-4">
              <h3 className="font-medium">Saisie manuelle</h3>
              
              <div className="space-y-2">
                <Input
                  placeholder="Entrez le code-barres..."
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualBarcodeSubmit();
                    }
                  }}
                />
                <Button 
                  onClick={handleManualBarcodeSubmit}
                  disabled={!manualBarcode.trim() || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Recherche...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Rechercher
                    </>
                  )}
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Scan automatique :</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Utilise la caméra de votre appareil</li>
                  <li>Pointez vers le code-barres</li>
                  <li>Détection automatique en temps réel</li>
                </ul>
                
                <p><strong>Saisie manuelle :</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Entrez le code-barres à la main</li>
                  <li>Appuyez sur Entrée ou cliquez Rechercher</li>
                  <li>Utile si le scan ne fonctionne pas</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des scans */}
      {scannedBarcodes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Historique des scans</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
              >
                <X className="h-4 w-4 mr-2" />
                Effacer
              </Button>
            </div>
            
            <div className="space-y-2">
              {scannedBarcodes.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {product.found ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                    
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{product.barcode}</span>
                        <span>•</span>
                        <Badge variant="outline">{product.category}</Badge>
                        {product.price > 0 && (
                          <>
                            <span>•</span>
                            <span>{product.price}€</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={product.found ? "default" : "secondary"}>
                      {product.found ? "Trouvé" : "Non trouvé"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confiance: {product.confidence}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      {scannedBarcodes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Statistiques</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{scannedBarcodes.length}</p>
                <p className="text-sm text-muted-foreground">Scans totaux</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {scannedBarcodes.filter(p => p.found).length}
                </p>
                <p className="text-sm text-muted-foreground">Produits trouvés</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {scannedBarcodes.filter(p => !p.found).length}
                </p>
                <p className="text-sm text-muted-foreground">Non trouvés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}