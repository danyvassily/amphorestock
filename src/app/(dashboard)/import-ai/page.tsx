"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ImportAIService, ImportPreview, ImportResult, ImportHistory } from '@/lib/importAIService';
import { FirebaseErrorHandler, createFirebaseError } from '@/components/firebase-error-handler';
import { 
  Upload, 
  FileUp, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Download,
  History,
  Mic,
  MessageSquare,
  Loader2,
  Eye,
  Save,
  X,
  FileText,
  Zap,
  Shield,
  TrendingUp,
  Package,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function ImportAIPage() {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedTab, setSelectedTab] = useState('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [autoImportEnabled, setAutoImportEnabled] = useState(false);
  const [minConfidence, setMinConfidence] = useState(80);
  const [showAutoImportSettings, setShowAutoImportSettings] = useState(false);
  const [firebaseError, setFirebaseError] = useState<any>(null);

  // Gestion de l'upload de fichiers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      toast.error('Certains fichiers ont été ignorés (format non supporté)');
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    toast.success(`${validFiles.length} fichier(s) sélectionné(s)`);
  };

  // Traitement IA des fichiers
  const processFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Aucun fichier sélectionné');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      if (autoImportEnabled) {
        // Import automatique direct
        setProcessingStep('Import automatique en cours...');
        const result = await ImportAIService.processAndImportDirectly(
          selectedFiles,
          user?.uid || 'anonymous',
          minConfidence,
          (step, progress) => {
            setProcessingStep(step);
            setProcessingProgress(progress);
          }
        );

        if (result.success) {
          toast.success(`Import automatique réussi ! ${result.addedCount} produits ajoutés, ${result.updatedCount} mis à jour 🚀`);
          setSelectedFiles([]);
          loadImportHistory();
        } else {
          toast.error(result.error || "Erreur lors de l'import automatique");
        }
      } else {
        // Mode aperçu standard
        setProcessingStep('Lecture des fichiers...');
        setProcessingProgress(20);

        const preview = await ImportAIService.processFiles(
          selectedFiles,
          user?.uid || 'anonymous',
          (step, progress) => {
            setProcessingStep(step);
            setProcessingProgress(progress);
          }
        );

        setImportPreview(preview);
        setShowPreview(true);
        setProcessingProgress(100);
        toast.success("Analyse IA terminée ! Vérifiez l'aperçu.");
      }

    } catch (error) {
      console.error('Erreur lors du traitement:', error);
              toast.error(autoImportEnabled ? "Erreur lors de l'import automatique" : "Erreur lors de l'analyse IA");
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Traitement du texte libre
  const processTextInput = async () => {
    if (!textInput.trim()) {
      toast.error('Veuillez saisir du texte');
      return;
    }

    setIsProcessing(true);
    try {
      if (autoImportEnabled) {
        // Import automatique direct
        const result = await ImportAIService.processTextAndImportDirectly(
          textInput,
          user?.uid || 'anonymous',
          minConfidence,
          (step, progress) => {
            setProcessingStep(step);
            setProcessingProgress(progress);
          }
        );

        if (result.success) {
          toast.success(`Import automatique réussi ! ${result.addedCount} produits ajoutés 🚀`);
          setTextInput('');
          loadImportHistory();
        } else {
          toast.error(result.error || "Erreur lors de l'import automatique");
        }
      } else {
        // Mode aperçu standard
        const preview = await ImportAIService.processTextInput(
          textInput,
          user?.uid || 'anonymous'
        );
        
        setImportPreview(preview);
        setShowPreview(true);
        toast.success("Texte analysé par l'IA !");
      }
    } catch (error) {
      toast.error(autoImportEnabled ? "Erreur lors de l'import automatique" : "Erreur lors de l'analyse du texte");
    } finally {
      setIsProcessing(false);
    }
  };

  // Dictée vocale
  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Reconnaissance vocale non supportée par votre navigateur');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
      setIsListening(true);
      toast.success('Écoute en cours... Parlez maintenant');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTextInput(prev => prev + ' ' + finalTranscript);
      }
    };

    recognition.onerror = () => {
      toast.error('Erreur de reconnaissance vocale');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Validation de l'import
  const validateImport = async () => {
    if (!importPreview) return;

    try {
      const result = await ImportAIService.validateAndImport(
        importPreview,
        user?.uid || 'anonymous'
      );

      if (result.success) {
        toast.success(`Import réussi ! ${result.addedCount} produits ajoutés, ${result.updatedCount} mis à jour`);
        setShowPreview(false);
        setSelectedFiles([]);
        setTextInput('');
        setImportPreview(null);
        
        // Rafraîchir l'historique
        loadImportHistory();
      } else {
        toast.error(result.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };

  // Charger l'historique des imports
  const loadImportHistory = useCallback(async () => {
    try {
      setFirebaseError(null); // Réinitialiser l'erreur
      const history = await ImportAIService.getImportHistory(user?.uid || 'anonymous');
      setImportHistory(history);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      
      // Capturer les erreurs Firebase spécifiquement
      if (error instanceof Error && error.message.includes('index')) {
        setFirebaseError(createFirebaseError(error));
      } else {
        toast.error('Erreur lors du chargement de l\'historique');
      }
    }
  }, [user?.uid]);

  // Charger l'historique au montage
  React.useEffect(() => {
    loadImportHistory();
  }, [loadImportHistory]);

  // Supprimer un fichier sélectionné
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Import IA Intelligent</h1>
            <p className="text-muted-foreground">
                              Importez vos stocks avec l&apos;aide de l&apos;intelligence artificielle
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowHistoryDialog(true)}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Historique
          </Button>
          <Button
            variant="outline"
            onClick={loadImportHistory}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Gestion des erreurs Firebase */}
      <FirebaseErrorHandler 
        error={firebaseError}
        onDismiss={() => setFirebaseError(null)}
        showRetry={true}
        onRetry={loadImportHistory}
      />

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Imports aujourd&apos;hui</span>
            </div>
            <p className="text-2xl font-bold">
              {importHistory.filter(h => 
                new Date(h.timestamp).toDateString() === new Date().toDateString()
              ).length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Imports réussis</span>
            </div>
            <p className="text-2xl font-bold">
              {importHistory.filter(h => h.success).length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Produits importés</span>
            </div>
            <p className="text-2xl font-bold">
              {importHistory.reduce((sum, h) => sum + (h.productsCount || 0), 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Taux de succès</span>
            </div>
            <p className="text-2xl font-bold">
              {importHistory.length > 0 
                ? Math.round((importHistory.filter(h => h.success).length / importHistory.length) * 100)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interface principale */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Fichiers
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Texte/Dictée
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Avancé
          </TabsTrigger>
        </TabsList>

        {/* Upload de fichiers */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Upload de fichiers
              </CardTitle>
              <CardDescription>
                Supporté : Excel (.xlsx, .xls), CSV, Word (.docx, .doc), TXT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Zone de drop */}
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    const validFiles = files.filter(file => {
                      const validTypes = [
                        'text/csv',
                        'application/vnd.ms-excel', 
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'text/plain'
                      ];
                      return validTypes.includes(file.type);
                    });
                    setSelectedFiles(prev => [...prev, ...validFiles]);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Glissez vos fichiers ici ou cliquez pour sélectionner</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports multiples fichiers • Traitement IA automatique
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.docx,.doc,.txt"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                                        aria-label="Sélectionner des fichiers à importer avec l&apos;IA"
                />

                {/* Fichiers sélectionnés */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Fichiers sélectionnés :</h4>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{file.name}</span>
                          <Badge variant="outline">
                            {(file.size / 1024).toFixed(1)} KB
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress bar */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{processingStep}</span>
                      <span className="text-sm text-muted-foreground">{processingProgress}%</span>
                    </div>
                    <Progress value={processingProgress} />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={processFiles}
                    disabled={isProcessing || selectedFiles.length === 0}
                    className={`flex-1 ${autoImportEnabled ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyse IA en cours...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        {autoImportEnabled ? `Import Direct (≥${minConfidence}%)` : 'Analyser avec l\'IA'}
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedFiles([])}
                    disabled={isProcessing}
                  >
                    Effacer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Texte et dictée */}
        <TabsContent value="text" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Import par texte ou dictée vocale
              </CardTitle>
              <CardDescription>
                                    Tapez ou dictez votre inventaire, l&apos;IA le structurera automatiquement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Ex: J'ai reçu 10 bouteilles de Bordeaux 2020 à 15€, 5 caisses de Perrier, 3 bouteilles de Gin Bombay..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="min-h-[150px] resize-none"
                  disabled={isProcessing}
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={processTextInput}
                    disabled={isProcessing || !textInput.trim()}
                    className={`flex-1 ${autoImportEnabled ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {autoImportEnabled ? 'Import automatique...' : 'Analyse IA...'}
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        {autoImportEnabled ? `Import Direct (≥${minConfidence}%)` : 'Analyser le texte'}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={startVoiceRecognition}
                    disabled={isProcessing || isListening}
                    className="flex items-center gap-2"
                  >
                    <Mic className={`h-4 w-4 ${isListening ? 'text-red-500' : ''}`} />
                    {isListening ? 'Écoute...' : 'Dictée'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setTextInput('')}
                    disabled={isProcessing}
                  >
                    Effacer
                  </Button>
                </div>

                {isListening && (
                  <Alert>
                    <Mic className="h-4 w-4" />
                    <AlertTitle>Reconnaissance vocale active</AlertTitle>
                    <AlertDescription>
                      Parlez clairement. La reconnaissance s&apos;arrêtera automatiquement après une pause.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fonctionnalités avancées */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Import Automatique
                </CardTitle>
                <CardDescription>
                                        L&apos;IA importe directement sans aperçu si la confiance est suffisante
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Switch import automatique */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">Mode automatique</h4>
                      <p className="text-sm text-muted-foreground">
                        Importer directement sans validation manuelle
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoImportEnabled}
                      onChange={(e) => setAutoImportEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                              aria-label="Activer l&apos;import automatique"
                    />
                  </div>

                  {/* Seuil de confiance */}
                  {autoImportEnabled && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-medium text-sm">
                          Confiance minimum IA : {minConfidence}%
                        </label>
                        <Badge variant={minConfidence >= 80 ? "default" : "destructive"}>
                          {minConfidence >= 80 ? "Recommandé" : "Risqué"}
                        </Badge>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        value={minConfidence}
                        onChange={(e) => setMinConfidence(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        aria-label={`Seuil de confiance minimum: ${minConfidence}%`}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>50% (Risqué)</span>
                        <span>75% (Moyen)</span>
                        <span>90% (Sûr)</span>
                      </div>
                    </div>
                  )}

                  {/* Explications */}
                  <Alert className={autoImportEnabled ? "border-orange-500" : "border-blue-500"}>
                    <Zap className="h-4 w-4" />
                    <AlertTitle>
                      {autoImportEnabled ? "Import automatique activé" : "Mode aperçu standard"}
                    </AlertTitle>
                    <AlertDescription>
                      {autoImportEnabled 
                        ? `Seuls les produits avec ≥${minConfidence}% de confiance seront importés automatiquement. Les autres seront ignorés.`
                        : "Vous verrez toujours un aperçu avant validation. Mode recommandé pour débuter."
                      }
                    </AlertDescription>
                  </Alert>

                  {autoImportEnabled && (
                    <div className="text-sm space-y-2">
                      <h5 className="font-medium">Sécurités actives :</h5>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Validation de confiance IA minimum</li>
                        <li>Logs détaillés de tous les imports</li>
                        <li>Possibilité de rollback</li>
                        <li>Détection automatique des doublons</li>
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité et rôles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Permissions actuelles</AlertTitle>
                    <AlertDescription>
                      Vous avez les droits d&apos;import complets. Tous les imports sont loggés.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="text-sm space-y-2">
                    <p><strong>Utilisateur :</strong> {user?.email}</p>
                    <p><strong>Rôle :</strong> Administrateur</p>
                    <p><strong>Mode actuel :</strong> {autoImportEnabled ? "Import automatique" : "Aperçu manuel"}</p>
                    <p><strong>Dernière activité :</strong> {new Date().toLocaleString()}</p>
                  </div>

                  {autoImportEnabled && (
                    <Alert className="border-yellow-500">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Import automatique activé</AlertTitle>
                      <AlertDescription>
                        Les données seront importées directement. Vérifiez régulièrement l&apos;historique.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prochaines fonctionnalités */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Fonctionnalités futures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <h5 className="font-medium">Auto-Import avancé</h5>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Google Drive sync</li>
                    <li>• Import par email</li>
                    <li>• Planning récurrent</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium">IA améliorée</h5>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• OCR photos factures</li>
                    <li>• Apprentissage adaptatif</li>
                    <li>• Prédictions stocks</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium">Intégrations</h5>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Catalogues fournisseurs</li>
                    <li>• Sync caisses</li>
                    <li>• Export comptabilité</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog d'aperçu */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Aperçu de l&apos;import IA
            </DialogTitle>
            <DialogDescription>
                              Vérifiez les données analysées par l&apos;IA avant validation
            </DialogDescription>
          </DialogHeader>
          
          {importPreview && (
            <div className="space-y-6">
              {/* Résumé */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{importPreview.summary.newProducts}</p>
                      <p className="text-sm">Nouveaux produits</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{importPreview.summary.updatedProducts}</p>
                      <p className="text-sm">Mises à jour</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{importPreview.summary.duplicates}</p>
                      <p className="text-sm">Doublons détectés</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{importPreview.summary.errors}</p>
                      <p className="text-sm">Erreurs</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alertes */}
              {importPreview.alerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Alertes détectées :</h4>
                  {importPreview.alerts.map((alert, index) => (
                    <Alert key={index} className={alert.type === 'error' ? 'border-red-500' : 'border-yellow-500'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{alert.type === 'error' ? 'Erreur' : 'Attention'}</AlertTitle>
                      <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Suggestions IA */}
              {importPreview.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Suggestions IA :</h4>
                  {importPreview.suggestions.map((suggestion, index) => (
                    <Alert key={index} className="border-blue-500">
                      <Brain className="h-4 w-4" />
                      <AlertTitle>Suggestion</AlertTitle>
                      <AlertDescription>{suggestion}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Tableau des produits */}
              <div>
                <h4 className="font-medium mb-3">Produits à importer :</h4>
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.products.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{product.nom}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.categorie}</Badge>
                          </TableCell>
                          <TableCell>{product.quantite} {product.unite}</TableCell>
                          <TableCell>{product.prixAchat}€</TableCell>
                          <TableCell>
                            {product.isNew ? (
                              <Badge className="bg-green-500">Nouveau</Badge>
                            ) : product.isDuplicate ? (
                              <Badge variant="destructive">Doublon</Badge>
                            ) : (
                              <Badge variant="secondary">Mise à jour</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={validateImport} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
                              Valider l&apos;import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog historique */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des imports
            </DialogTitle>
            <DialogDescription>
                              Consultez l&apos;historique complet de vos imports IA
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {importHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun import effectué pour le moment
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Fichiers</TableHead>
                    <TableHead>Produits</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importHistory.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{entry.userEmail}</TableCell>
                      <TableCell>{entry.fileNames?.join(', ') || 'Texte'}</TableCell>
                      <TableCell>{entry.productsCount}</TableCell>
                      <TableCell>
                        {entry.success ? (
                          <Badge className="bg-green-500">Succès</Badge>
                        ) : (
                          <Badge variant="destructive">Échec</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 