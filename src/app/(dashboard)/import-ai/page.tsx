'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileSpreadsheet,
  Database,
  Zap,
  TrendingUp,
  X,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ModernStockService } from '@/services/modernStockService';
import { BulkImportResult } from '@/types';

interface FileInfo {
  file: File;
  id: string;
  type: 'vins' | 'general';
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: BulkImportResult;
}

export default function ImportPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    const newFiles: FileInfo[] = selectedFiles
      .filter(file => {
        const isValidType = file.type.includes('spreadsheet') || 
                           file.name.endsWith('.xlsx') || 
                           file.name.endsWith('.xls') || 
                           file.name.endsWith('.csv');
        
        if (!isValidType) {
          toast.error(`Format non supporté: ${file.name}`);
          return false;
        }
        return true;
      })
      .map(file => ({
        file,
        id: crypto.randomUUID(),
        type: file.name.toLowerCase().includes('vin') ? 'vins' : 'general',
        progress: 0,
        status: 'pending' as const,
      }));

    setFiles(prev => [...prev, ...newFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processFile = async (fileInfo: FileInfo): Promise<BulkImportResult> => {
    // Simuler le traitement du fichier avec le nouveau service
    const formData = new FormData();
    formData.append('file', fileInfo.file);
    
    // Mise à jour du progrès
    const updateProgress = (progress: number) => {
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id ? { ...f, progress, status: 'processing' as const } : f
      ));
    };

    // Simulation du traitement
    for (let i = 0; i <= 100; i += 20) {
      updateProgress(i);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Simuler le résultat (à remplacer par l'appel réel au service)
    const mockResult: BulkImportResult = {
      success: true,
      totalProcessed: Math.floor(Math.random() * 50) + 10,
      successCount: Math.floor(Math.random() * 45) + 10,
      errorCount: Math.floor(Math.random() * 3),
      errors: [],
      importedProducts: []
    };

    return mockResult;
  };

  const handleProcessAllFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    
    try {
      // Traiter tous les fichiers en parallèle
      const promises = files
        .filter(f => f.status === 'pending')
        .map(async (fileInfo) => {
          try {
            const result = await processFile(fileInfo);
            
            setFiles(prev => prev.map(f => 
              f.id === fileInfo.id 
                ? { ...f, status: 'completed' as const, result, progress: 100 }
                : f
            ));
            
            return { fileInfo, result, success: true };
          } catch (error) {
            setFiles(prev => prev.map(f => 
              f.id === fileInfo.id 
                ? { ...f, status: 'error' as const, progress: 0 }
                : f
            ));
            
            return { fileInfo, error, success: false };
          }
        });

      const results = await Promise.all(promises);
      
      // Afficher les résultats
      const totalImported = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.result?.successCount || 0), 0);
      
      const totalErrors = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.result?.errorCount || 0), 0);

      if (totalImported > 0) {
        toast.success(`Import terminé ! ${totalImported} produits importés`, {
          description: totalErrors > 0 ? `${totalErrors} erreurs rencontrées` : undefined,
        });
      }
      
    } catch (error) {
      toast.error('Erreur lors du traitement des fichiers');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: FileInfo['status']) => {
    switch (status) {
      case 'pending': return <FileText className="h-5 w-5 text-gray-500" />;
      case 'processing': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: FileInfo['status']) => {
    switch (status) {
      case 'pending': return 'border-gray-300 bg-gray-50';
      case 'processing': return 'border-blue-300 bg-blue-50';
      case 'completed': return 'border-green-300 bg-green-50';
      case 'error': return 'border-red-300 bg-red-50';
    }
  };

  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const errorFiles = files.filter(f => f.status === 'error').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Upload className="h-8 w-8" />
          Import de Fichiers
        </h1>
        <p className="text-muted-foreground">
          Importez vos fichiers Excel ou CSV pour mettre à jour votre stock automatiquement
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Fichiers Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              {files.filter(f => f.status === 'pending').length} en attente
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Traités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedFiles}</div>
            <p className="text-xs text-muted-foreground">fichiers réussis</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Erreurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorFiles}</div>
            <p className="text-xs text-muted-foreground">fichiers échoués</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Produits Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.reduce((sum, f) => sum + (f.result?.successCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">importés avec succès</p>
          </CardContent>
        </Card>
      </div>

      {/* Zone d'upload */}
      <Card>
        <CardHeader>
          <CardTitle>Sélection de Fichiers</CardTitle>
          <CardDescription>
            Sélectionnez un ou plusieurs fichiers Excel/CSV à importer. Les fichiers contenant "vin" seront automatiquement catégorisés comme vins.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Zone de drop */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Cliquez pour sélectionner des fichiers</h3>
            <p className="text-muted-foreground mb-4">
              Formats supportés: Excel (.xlsx, .xls) et CSV
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Badge variant="outline" className="mr-2">XLSX</Badge>
            <Badge variant="outline" className="mr-2">XLS</Badge>
            <Badge variant="outline">CSV</Badge>
          </div>

          {/* Actions globales */}
          {files.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {files.length} fichier(s) sélectionné(s)
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setFiles([])}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Effacer tout
                </Button>
                <Button 
                  onClick={handleProcessAllFiles}
                  disabled={isProcessing || files.every(f => f.status !== 'pending')}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Importer tous
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fichiers à Traiter</CardTitle>
            <CardDescription>
              État du traitement de chaque fichier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((fileInfo) => (
                <div 
                  key={fileInfo.id}
                  className={`p-4 rounded-lg border-2 transition-colors ${getStatusColor(fileInfo.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(fileInfo.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{fileInfo.file.name}</p>
                          <Badge variant={fileInfo.type === 'vins' ? 'default' : 'secondary'}>
                            {fileInfo.type === 'vins' ? '🍷 Vins' : '📦 Stock général'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(fileInfo.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {fileInfo.status === 'processing' && (
                        <div className="flex items-center gap-2 min-w-24">
                          <Progress value={fileInfo.progress} className="w-16" />
                          <span className="text-xs text-muted-foreground">
                            {fileInfo.progress}%
                          </span>
                        </div>
                      )}
                      
                      {fileInfo.status === 'completed' && fileInfo.result && (
                        <div className="text-sm text-green-600">
                          ✅ {fileInfo.result.successCount} produits importés
                        </div>
                      )}
                      
                      {fileInfo.status === 'error' && (
                        <div className="text-sm text-red-600">
                          ❌ Échec du traitement
                        </div>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileInfo.id)}
                        disabled={fileInfo.status === 'processing'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Détails des résultats */}
                  {fileInfo.result && fileInfo.status === 'completed' && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total traité: </span>
                          <span className="font-semibold">{fileInfo.result.totalProcessed}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Succès: </span>
                          <span className="font-semibold text-green-600">{fileInfo.result.successCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Erreurs: </span>
                          <span className="font-semibold text-red-600">{fileInfo.result.errorCount}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guide d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle>Guide d'Utilisation</CardTitle>
          <CardDescription>
            Conseils pour optimiser vos imports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Format de Fichier
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Utilisez des en-têtes clairs en première ligne</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Colonnes recommandées : Nom, Catégorie, Quantité, Prix</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Évitez les cellules vides ou fusionnées</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Format Excel (.xlsx) recommandé</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Catégorisation Automatique
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Fichiers avec "vin" → Catégorie Vins</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Autres fichiers → Stock général</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Détection automatique des types de produits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Validation des données et formats</span>
                </li>
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Template Excel Vins
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Template Excel Stock
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              📋 Les templates incluent la structure recommandée
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}