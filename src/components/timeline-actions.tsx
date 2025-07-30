"use client";

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  Package, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Plus, 
  Minus,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export interface TimelineAction {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  actionType: 'import' | 'export' | 'create' | 'update' | 'delete' | 'stock_movement';
  entityType: 'product' | 'category' | 'supplier' | 'import_batch';
  entityId?: string;
  entityName?: string;
  description: string;
  metadata?: {
    quantity?: number;
    oldValue?: any;
    newValue?: any;
    fileNames?: string[];
    productsCount?: number;
    importId?: string;
    movementType?: 'entree' | 'sortie';
    reason?: string;
  };
  success: boolean;
  error?: string;
}

export interface TimelineFilters {
  actionType?: string;
  entityType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  successOnly?: boolean;
}

interface TimelineActionsProps {
  userId: string;
  className?: string;
}

export function TimelineActions({ userId, className = '' }: TimelineActionsProps) {
  const [actions, setActions] = useState<TimelineAction[]>([]);
  const [filteredActions, setFilteredActions] = useState<TimelineAction[]>([]);
  const [filters, setFilters] = useState<TimelineFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<TimelineAction | null>(null);

  // Charger les actions depuis Firestore
  useEffect(() => {
    loadTimelineActions();
  }, [userId]);

  // Filtrer les actions
  useEffect(() => {
    let filtered = [...actions];

    // Filtre par type d'action
    if (filters.actionType) {
      filtered = filtered.filter(action => action.actionType === filters.actionType);
    }

    // Filtre par type d'entité
    if (filters.entityType) {
      filtered = filtered.filter(action => action.entityType === filters.entityType);
    }

    // Filtre par date
    if (filters.dateRange) {
      filtered = filtered.filter(action => 
        action.timestamp >= filters.dateRange!.start && 
        action.timestamp <= filters.dateRange!.end
      );
    }

    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(action =>
        action.description.toLowerCase().includes(searchLower) ||
        action.entityName?.toLowerCase().includes(searchLower) ||
        action.userEmail.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par succès
    if (filters.successOnly) {
      filtered = filtered.filter(action => action.success);
    }

    setFilteredActions(filtered);
  }, [actions, filters]);

  const loadTimelineActions = async () => {
    try {
      setIsLoading(true);
      
      // Simulation de chargement depuis Firestore
      // Dans une vraie implémentation, on ferait un appel à Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockActions: TimelineAction[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          userId,
          userEmail: 'admin@example.com',
          actionType: 'import',
          entityType: 'import_batch',
          entityName: 'Import IA - Facture fournisseur',
          description: 'Import automatique de 15 produits via IA',
          metadata: {
            fileNames: ['facture_fournisseur.pdf'],
            productsCount: 15,
            importId: 'imp_001'
          },
          success: true
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          userId,
          userEmail: 'admin@example.com',
          actionType: 'stock_movement',
          entityType: 'product',
          entityName: 'Bordeaux Rouge 2020',
          description: 'Entrée en stock: +12 bouteilles',
          metadata: {
            quantity: 12,
            movementType: 'entree',
            reason: 'Import automatique'
          },
          success: true
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          userId,
          userEmail: 'admin@example.com',
          actionType: 'create',
          entityType: 'product',
          entityName: 'Champagne Brut',
          description: 'Nouveau produit créé',
          metadata: {
            quantity: 6
          },
          success: true
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          userId,
          userEmail: 'admin@example.com',
          actionType: 'update',
          entityType: 'product',
          entityName: 'Gin Bombay',
          description: 'Prix de vente mis à jour',
          metadata: {
            oldValue: 25,
            newValue: 28
          },
          success: true
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
          userId,
          userEmail: 'admin@example.com',
          actionType: 'export',
          entityType: 'product',
          entityName: 'Export stock complet',
          description: 'Export Excel du stock actuel',
          metadata: {
            productsCount: 150
          },
          success: true
        }
      ];

      setActions(mockActions);
    } catch (error) {
      console.error('Erreur lors du chargement de la timeline:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir l'icône pour le type d'action
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'import': return <Upload className="h-4 w-4" />;
      case 'export': return <Download className="h-4 w-4" />;
      case 'create': return <Plus className="h-4 w-4" />;
      case 'update': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'stock_movement': return <Package className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Obtenir la couleur du badge selon le type d'action
  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'import': return 'bg-blue-500';
      case 'export': return 'bg-green-500';
      case 'create': return 'bg-purple-500';
      case 'update': return 'bg-orange-500';
      case 'delete': return 'bg-red-500';
      case 'stock_movement': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  // Formater la date relative
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString();
  };

  // Obtenir le statut de l'action
  const getActionStatus = (action: TimelineAction) => {
    if (action.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header avec filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline des Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les actions..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtres */}
            <div className="flex gap-2">
              <Select
                value={filters.actionType || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, actionType: value || undefined }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type d'action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="create">Création</SelectItem>
                  <SelectItem value="update">Modification</SelectItem>
                  <SelectItem value="delete">Suppression</SelectItem>
                  <SelectItem value="stock_movement">Mouvement stock</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.entityType || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, entityType: value || undefined }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type d'entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes</SelectItem>
                  <SelectItem value="product">Produits</SelectItem>
                  <SelectItem value="category">Catégories</SelectItem>
                  <SelectItem value="supplier">Fournisseurs</SelectItem>
                  <SelectItem value="import_batch">Imports</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setFilters({})}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="details">Détails</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Chargement de la timeline...</p>
              </CardContent>
            </Card>
          ) : filteredActions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune action trouvée</p>
                <p className="text-sm">Les actions apparaîtront ici au fur et à mesure de votre utilisation</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredActions.map((action) => (
                <Card key={action.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icône et statut */}
                      <div className="flex flex-col items-center gap-2">
                        <div className={`p-2 rounded-full ${getActionColor(action.actionType)} text-white`}>
                          {getActionIcon(action.actionType)}
                        </div>
                        {getActionStatus(action)}
                      </div>

                      {/* Contenu principal */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getActionColor(action.actionType)}>
                              {action.actionType.toUpperCase()}
                            </Badge>
                            {action.entityName && (
                              <span className="font-medium">{action.entityName}</span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(action.timestamp)}
                          </span>
                        </div>

                        <p className="text-sm">{action.description}</p>

                        {/* Métadonnées */}
                        {action.metadata && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {action.metadata.quantity && (
                              <span>Quantité: {action.metadata.quantity}</span>
                            )}
                            {action.metadata.productsCount && (
                              <span>Produits: {action.metadata.productsCount}</span>
                            )}
                            {action.metadata.movementType && (
                              <span>Type: {action.metadata.movementType}</span>
                            )}
                            {action.metadata.fileNames && (
                              <span>Fichiers: {action.metadata.fileNames.join(', ')}</span>
                            )}
                          </div>
                        )}

                        {/* Erreur si échec */}
                        {!action.success && action.error && (
                          <div className="flex items-center gap-2 text-red-600 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{action.error}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAction(action)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">Statistiques de la Timeline</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{actions.length}</p>
                  <p className="text-sm text-muted-foreground">Actions totales</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {actions.filter(a => a.success).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Actions réussies</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {actions.filter(a => a.actionType === 'import').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Imports</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {actions.filter(a => a.actionType === 'stock_movement').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Mouvements stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de détails */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getActionIcon(selectedAction.actionType)}
                Détails de l'action
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Type d'action</p>
                  <p className="text-sm text-muted-foreground">{selectedAction.actionType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAction.timestamp.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Utilisateur</p>
                  <p className="text-sm text-muted-foreground">{selectedAction.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Statut</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAction.success ? 'Succès' : 'Échec'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{selectedAction.description}</p>
              </div>

              {selectedAction.metadata && (
                <div>
                  <p className="text-sm font-medium">Métadonnées</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(selectedAction.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {!selectedAction.success && selectedAction.error && (
                <div>
                  <p className="text-sm font-medium text-red-600">Erreur</p>
                  <p className="text-sm text-red-600">{selectedAction.error}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAction(null)}
                >
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}