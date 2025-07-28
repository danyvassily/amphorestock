"use client";

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ExternalLink, X } from 'lucide-react';

interface FirebaseError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
}

interface FirebaseErrorHandlerProps {
  error?: FirebaseError | null;
  onDismiss?: () => void;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function FirebaseErrorHandler({ 
  error, 
  onDismiss, 
  showRetry = false, 
  onRetry 
}: FirebaseErrorHandlerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
    }
  }, [error]);

  if (!error || !isVisible) {
    return null;
  }

  const getErrorType = (code: string) => {
    if (code.includes('index') || code.includes('failed-precondition')) {
      return 'index';
    }
    if (code.includes('permission') || code.includes('unauthenticated')) {
      return 'permission';
    }
    if (code.includes('quota') || code.includes('resource-exhausted')) {
      return 'quota';
    }
    if (code.includes('network') || code.includes('unavailable')) {
      return 'network';
    }
    return 'unknown';
  };

  const getErrorMessage = (type: string, code: string, message: string) => {
    switch (type) {
      case 'index':
        return {
          title: 'Index Firebase Manquant',
          description: 'Cette requête nécessite un index composé. L\'index est en cours de création automatiquement.',
          action: 'Créer l\'index'
        };
      case 'permission':
        return {
          title: 'Erreur de Permission',
          description: 'Vous n\'avez pas les permissions nécessaires pour cette opération.',
          action: 'Vérifier les permissions'
        };
      case 'quota':
        return {
          title: 'Quota Dépassé',
          description: 'La limite de requêtes Firebase a été atteinte. Veuillez réessayer plus tard.',
          action: 'Voir les quotas'
        };
      case 'network':
        return {
          title: 'Erreur de Connexion',
          description: 'Impossible de se connecter à Firebase. Vérifiez votre connexion internet.',
          action: 'Réessayer'
        };
      default:
        return {
          title: 'Erreur Firebase',
          description: message || 'Une erreur inattendue s\'est produite.',
          action: 'Réessayer'
        };
    }
  };

  const errorType = getErrorType(error.code);
  const errorInfo = getErrorMessage(errorType, error.code, error.message);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleAction = () => {
    if (errorType === 'index') {
      window.open('https://console.firebase.google.com/project/amphore-stock/firestore/indexes', '_blank');
    } else if (errorType === 'quota') {
      window.open('https://console.firebase.google.com/project/amphore-stock/usage', '_blank');
    } else if (errorType === 'permission') {
      window.open('https://console.firebase.google.com/project/amphore-stock/firestore/rules', '_blank');
    } else if (onRetry) {
      onRetry();
    }
  };

  return (
    <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <div className="flex justify-between items-start w-full">
        <div className="flex-1">
          <AlertTitle className="text-red-800 dark:text-red-200">
            {errorInfo.title}
          </AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300 mt-2">
            {errorInfo.description}
          </AlertDescription>
          
          {error.details && (
            <AlertDescription className="text-red-600 dark:text-red-400 mt-2 text-sm font-mono">
              Détails: {error.details}
            </AlertDescription>
          )}
          
          <AlertDescription className="text-red-600 dark:text-red-400 mt-1 text-xs">
            Code: {error.code} | {error.timestamp.toLocaleTimeString()}
          </AlertDescription>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {errorType === 'index' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAction}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Console Firebase
            </Button>
          )}
          
          {(showRetry || errorType === 'network') && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAction}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {errorInfo.action}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-red-700 hover:bg-red-100 px-2"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}

export function createFirebaseError(error: any): FirebaseError {
  return {
    code: error.code || 'unknown',
    message: error.message || 'Erreur inconnue',
    details: error.details || JSON.stringify(error),
    timestamp: new Date()
  };
} 