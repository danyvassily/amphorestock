"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onProcessingComplete?: (results: FileProcessingResult[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // en MB
  acceptedTypes?: string[];
  showPreview?: boolean;
  autoProcess?: boolean;
  className?: string;
}

export interface FileProcessingResult {
  file: File;
  success: boolean;
  data?: any[];
  error?: string;
  fileType: string;
  metadata?: {
    rowCount: number;
    columnCount: number;
    hasHeaders: boolean;
    detectedFormat: string;
  };
}

export function FileUploadZone({
  onFilesSelected,
  onProcessingComplete,
  maxFiles = 10,
  maxFileSize = 10,
  acceptedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/pdf',
    'image/jpeg',
    'image/png'
  ],
  showPreview = true,
  autoProcess = false,
  className = ''
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());
  const [processedResults, setProcessedResults] = useState<FileProcessingResult[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation des fichiers
  const validateFiles = useCallback((files: File[]): { valid: File[], invalid: { file: File, reason: string }[] } => {
    const valid: File[] = [];
    const invalid: { file: File, reason: string }[] = [];

    for (const file of files) {
      // Vérifier la taille
      if (file.size > maxFileSize * 1024 * 1024) {
        invalid.push({ file, reason: `Fichier trop volumineux (max ${maxFileSize}MB)` });
        continue;
      }

      // Vérifier le type
      if (!acceptedTypes.includes(file.type)) {
        invalid.push({ file, reason: 'Type de fichier non supporté' });
        continue;
      }

      // Vérifier le nombre maximum
      if (valid.length >= maxFiles) {
        invalid.push({ file, reason: `Nombre maximum de fichiers atteint (${maxFiles})` });
        continue;
      }

      valid.push(file);
    }

    return { valid, invalid };
  }, [maxFiles, maxFileSize, acceptedTypes]);

  // Gestion de la sélection de fichiers
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const { valid, invalid } = validateFiles(files);

    if (invalid.length > 0) {
      invalid.forEach(({ file, reason }) => {
        toast.error(`${file.name}: ${reason}`);
      });
    }

    if (valid.length > 0) {
      setSelectedFiles(prev => [...prev, ...valid]);
      onFilesSelected(valid);
      toast.success(`${valid.length} fichier(s) ajouté(s)`);

      if (autoProcess) {
        processFiles(valid);
      }
    }
  }, [validateFiles, onFilesSelected, autoProcess]);

  // Gestion du drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const { valid, invalid } = validateFiles(files);

    if (invalid.length > 0) {
      invalid.forEach(({ file, reason }) => {
        toast.error(`${file.name}: ${reason}`);
      });
    }

    if (valid.length > 0) {
      setSelectedFiles(prev => [...prev, ...valid]);
      onFilesSelected(valid);
      toast.success(`${valid.length} fichier(s) ajouté(s)`);

      if (autoProcess) {
        processFiles(valid);
      }
    }
  }, [validateFiles, onFilesSelected, autoProcess]);

  // Traitement des fichiers
  const processFiles = useCallback(async (files: File[]) => {
    setProcessingFiles(new Set(files.map(f => f.name)));
    setProcessingProgress(0);

    const results: FileProcessingResult[] = [];
    let processedCount = 0;

    for (const file of files) {
      try {
        // Simuler le traitement (dans une vraie implémentation, on appellerait FileProcessor)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result: FileProcessingResult = {
          file,
          success: true,
          fileType: file.type,
          data: [],
          metadata: {
            rowCount: Math.floor(Math.random() * 50) + 10,
            columnCount: 5,
            hasHeaders: true,
            detectedFormat: file.type.includes('excel') ? 'excel' : 'csv'
          }
        };

        results.push(result);
        processedCount++;
        setProcessingProgress((processedCount / files.length) * 100);

      } catch (error) {
        results.push({
          file,
          success: false,
          fileType: file.type,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    setProcessedResults(prev => [...prev, ...results]);
    setProcessingFiles(new Set());
    setProcessingProgress(100);

    if (onProcessingComplete) {
      onProcessingComplete(results);
    }

    toast.success(`Traitement terminé: ${results.filter(r => r.success).length}/${results.length} fichiers traités`);
  }, [onProcessingComplete]);

  // Supprimer un fichier
  const removeFile = useCallback((fileToRemove: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== fileToRemove));
    setProcessedResults(prev => prev.filter(r => r.file !== fileToRemove));
  }, []);

  // Obtenir l'icône du type de fichier
  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('csv')) return '📋';
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('text')) return '📝';
    if (type.includes('word') || type.includes('document')) return '📄';
    return '📁';
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone de drop */}
      <Card className={`transition-all duration-200 ${isDragOver ? 'border-primary bg-primary/5' : ''}`}>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {isDragOver ? 'Déposez vos fichiers ici' : 'Glissez vos fichiers ici ou cliquez pour sélectionner'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Supporté : Excel, CSV, Word, TXT, PDF, Images • Max {maxFileSize}MB par fichier
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Progress bar */}
      {processingFiles.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Traitement en cours...</span>
                <span className="text-sm text-muted-foreground">{processingProgress.toFixed(0)}%</span>
              </div>
              <Progress value={processingProgress} />
              <p className="text-xs text-muted-foreground">
                {processingFiles.size} fichier(s) en cours de traitement
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Fichiers sélectionnés ({selectedFiles.length})</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => {
                const isProcessing = processingFiles.has(file.name);
                const processed = processedResults.find(r => r.file === file);
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(file)}</span>
                      <div className="flex-1">
                        <p className="font-medium">{file.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{file.type}</span>
                          {processed && (
                            <>
                              <span>•</span>
                              <Badge variant={processed.success ? "default" : "destructive"}>
                                {processed.success ? "Traité" : "Erreur"}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isProcessing && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                      {processed && processed.success && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {processed && !processed.success && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file)}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {!autoProcess && (
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => processFiles(selectedFiles)}
                  disabled={processingFiles.size > 0}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Traiter les fichiers
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFiles([])}
                  disabled={processingFiles.size > 0}
                >
                  Effacer tout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Aperçu des résultats */}
      {showPreview && processedResults.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Résultats du traitement</h4>
            <div className="space-y-2">
              {processedResults.map((result, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{result.file.name}</span>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Succès" : "Erreur"}
                    </Badge>
                  </div>
                  
                  {result.success && result.metadata && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Format détecté: {result.metadata.detectedFormat}</p>
                      <p>Lignes: {result.metadata.rowCount} • Colonnes: {result.metadata.columnCount}</p>
                      <p>En-têtes: {result.metadata.hasHeaders ? "Oui" : "Non"}</p>
                    </div>
                  )}
                  
                  {!result.success && result.error && (
                    <p className="text-sm text-red-600">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}