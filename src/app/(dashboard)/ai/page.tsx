"use client";

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AIService } from '@/lib/aiService';
import { PresetPrompt, AIResponse } from '@/types';
import { 
  Brain, 
  FileUp, 
  Send, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Copy,
  Download,
  RefreshCw,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AIPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<(AIResponse & { prompt: string })[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presetPrompts = AIService.getPresetPrompts();

  const handleSubmit = async (customPrompt?: string, requiresConfirmation = false) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) {
      toast.error('Veuillez saisir une question ou choisir une action prédéfinie');
      return;
    }

    if (requiresConfirmation) {
      setPendingAction(() => () => executePrompt(finalPrompt));
      setShowConfirmDialog(true);
      return;
    }

    await executePrompt(finalPrompt);
  };

  const executePrompt = async (finalPrompt: string) => {
    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      let response: AIResponse;

      // Déterminer le type d'action basé sur le prompt
      if (finalPrompt.toLowerCase().includes('cocktail')) {
        response = await AIService.getSuggestedCocktails(user?.uid || 'anonymous', finalPrompt);
      } else if (finalPrompt.toLowerCase().includes('stock') || finalPrompt.toLowerCase().includes('analyse')) {
        response = await AIService.analyzeStock(user?.uid || 'anonymous');
      } else if (finalPrompt.toLowerCase().includes('rapport') || finalPrompt.toLowerCase().includes('vente')) {
        response = await AIService.generateReport('week', user?.uid || 'anonymous');
      } else if (finalPrompt.toLowerCase().includes('commande') || finalPrompt.toLowerCase().includes('réapprovision')) {
        response = await AIService.getRestockSuggestions(user?.uid || 'anonymous');
      } else {
        // Appel générique
        response = await AIService.callGemini({
          prompt: finalPrompt,
          userId: user?.uid || 'anonymous',
          action: 'general'
        });
      }

      if (response.success) {
        setResponses(prev => [{ ...response, prompt: finalPrompt }, ...prev]);
        setPrompt('');
        toast.success('Analyse IA terminée avec succès ! 🎉');
      } else {
        // Messages d'erreur plus explicites
        if (response.error?.includes('overloaded') || response.error?.includes('503')) {
          toast.error('L\'IA Gemini est temporairement surchargée. Retry automatique en cours... ⏳');
        } else if (response.error?.includes('quota') || response.error?.includes('429')) {
          toast.error('Quota API dépassé. Veuillez réessayer dans quelques minutes. ⏰');
        } else {
          toast.error(response.error || 'Erreur lors de l\'analyse IA');
        }
        
        // Ajouter la réponse d'erreur à l'historique pour debug
        setResponses(prev => [{ ...response, prompt: finalPrompt }, ...prev]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'appel à l\'IA');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (preset: PresetPrompt) => {
    const requiresConfirmation = preset.action !== 'general' && preset.requiresData;
    handleSubmit(preset.prompt, requiresConfirmation);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        toast.success(`Fichier sélectionné: ${file.name}`);
      } else {
        toast.error('Format de fichier non supporté. Utilisez CSV, Excel ou TXT.');
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Aucun fichier sélectionné');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AIService.processUploadedFile(selectedFile, user?.uid || 'anonymous');
      
      if (result.success) {
        toast.success(`Fichier traité avec succès: ${result.fileName}`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Ajouter la réponse du traitement
        const aiResponse: AIResponse & { prompt: string } = {
          success: true,
          response: `Fichier "${result.fileName}" traité avec succès. ${result.processedData ? 'Données extraites et formatées.' : ''}`,
          timestamp: new Date().toISOString(),
          prompt: `Import du fichier: ${result.fileName}`
        };
        setResponses(prev => [aiResponse, ...prev]);
      } else {
        toast.error(result.error || 'Erreur lors du traitement du fichier');
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload du fichier');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers');
  };

  const downloadResponse = (response: AIResponse & { prompt: string }) => {
    const content = `Prompt: ${response.prompt}\n\nRéponse IA:\n${response.response}\n\nTimestamp: ${response.timestamp}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-response-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analysis': return '📊';
      case 'reporting': return '📈';
      case 'management': return '🛒';
      case 'import': return '📁';
      default: return '🤖';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analysis': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'reporting': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'management': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'import': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Intelligence Artificielle</h1>
          <p className="text-muted-foreground">
            Analysez, optimisez et gérez votre stock avec l'aide de l'IA Gemini
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Zone principale */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Formulaire de prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Poser une question à l'IA
              </CardTitle>
              <CardDescription>
                Décrivez ce que vous souhaitez analyser ou demandez des recommandations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Ex: Analyse tout mon stock et propose-moi les produits à recommander cette semaine..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] resize-none"
                  disabled={isLoading}
                />
                
                <div className="flex gap-2">
                                     <Button 
                    onClick={() => handleSubmit()}
                    disabled={isLoading || !prompt.trim()}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setPrompt('')}
                    disabled={isLoading}
                  >
                    Effacer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload de fichier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Import intelligent de fichier
              </CardTitle>
              <CardDescription>
                Uploadez un fichier Excel/CSV pour traitement automatique par l'IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    aria-label="Sélectionner un fichier à traiter par l'IA"
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileUp className="h-8 w-8 mx-auto text-green-500" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileUp className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="font-medium">Cliquez pour sélectionner un fichier</p>
                      <p className="text-sm text-muted-foreground">
                        Formats supportés: CSV, Excel (.xlsx, .xls), TXT
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    Choisir un fichier
                  </Button>
                  
                  <Button
                    onClick={handleFileUpload}
                    disabled={isLoading || !selectedFile}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 mr-2" />
                    )}
                    Traiter avec l'IA
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historique des réponses */}
          {responses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Historique des analyses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {responses.map((response, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {response.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium text-sm">
                          {new Date(response.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(response.response)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadResponse(response)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Question: {response.prompt}
                      </p>
                      <div className="bg-muted/50 rounded p-3">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {response.response}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar avec actions prédéfinies */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Cliquez sur une action pour l'exécuter directement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {presetPrompts.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => handlePresetClick(preset)}
                  disabled={isLoading}
                >
                  <div className="flex items-start gap-3 text-left">
                    <span className="text-lg">{preset.icon}</span>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{preset.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {preset.description}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(preset.category)}`}
                      >
                        {getCategoryIcon(preset.category)} {preset.category}
                      </Badge>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Toutes les requêtes sont loggées</p>
              <p>• Les modifications nécessitent confirmation</p>
              <p>• Vos données restent privées</p>
              <p>• L'IA n'a accès qu'aux données nécessaires</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de confirmation */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'action IA</DialogTitle>
            <DialogDescription>
              Cette action va analyser vos données et peut proposer des modifications.
              Voulez-vous continuer ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
            >
              Annuler
            </Button>
            <Button onClick={pendingAction}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 