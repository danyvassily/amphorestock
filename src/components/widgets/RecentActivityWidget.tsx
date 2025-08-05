'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  History, 
  MoreHorizontal, 
  Undo2,
  Filter,
  Clock,
  User,
  Package,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { ActivityService } from '@/services/activityService';
import { ActivityItem, ActivityType, ActivitySeverity, ActivityFilter } from '@/types';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface RecentActivityWidgetProps {
  maxItems?: number;
  showFilters?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export function RecentActivityWidget({
  maxItems = 15,
  showFilters = true,
  autoRefresh = true,
  refreshInterval = 30000, // 30 secondes
  className = ''
}: RecentActivityWidgetProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoingActivity, setUndoingActivity] = useState<string | null>(null);
  
  // Filtres
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<ActivitySeverity | 'all'>('all');
  const [showUndoableOnly, setShowUndoableOnly] = useState(false);

  // Charger les activités
  useEffect(() => {
    let unsubscribe: () => void;

    const loadActivities = () => {
      const filter: ActivityFilter = {
        limit: maxItems,
        ...(typeFilter !== 'all' && { types: [typeFilter] }),
        ...(severityFilter !== 'all' && { severities: [severityFilter] }),
        ...(showUndoableOnly && { canUndo: true })
      };

      unsubscribe = ActivityService.subscribeToActivities(
        (newActivities) => {
          setActivities(newActivities);
          setLoading(false);
        },
        filter
      );
    };

    loadActivities();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [maxItems, typeFilter, severityFilter, showUndoableOnly]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Le subscription onSnapshot gère déjà le refresh automatique
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const handleUndoActivity = async (activity: ActivityItem) => {
    if (!activity.canUndo || activity.undoneAt) return;

    try {
      setUndoingActivity(activity.id);
      
      await ActivityService.undoActivity(
        activity.id,
        'current-user', // TODO: récupérer l'utilisateur actuel
        'Utilisateur actuel'
      );

      toast.success('Action annulée', {
        description: `L'action "${activity.title}" a été annulée avec succès`
      });
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      toast.error('Erreur lors de l\'annulation', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    } finally {
      setUndoingActivity(null);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    return ActivityService.getActivityIcon(type);
  };

  const getSeverityColor = (severity: ActivitySeverity) => {
    return ActivityService.getSeverityColor(severity);
  };

  const formatRelativeTime = (date: Date) => {
    return formatDistance(date, new Date(), { 
      addSuffix: true, 
      locale: fr 
    });
  };

  const canUndoActivity = (activity: ActivityItem): boolean => {
    if (!activity.canUndo || activity.undoneAt) return false;
    if (!activity.undoExpiry) return false;
    return new Date() < activity.undoExpiry;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Activités récentes</CardTitle>
              <CardDescription>
                Historique des dernières actions
              </CardDescription>
            </div>
          </div>
          
          {showFilters && (
            <div className="flex items-center gap-2">
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as ActivityType | 'all')}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="sale_recorded">🛒 Ventes</SelectItem>
                  <SelectItem value="stock_added">📈 Stock +</SelectItem>
                  <SelectItem value="stock_removed">📉 Stock -</SelectItem>
                  <SelectItem value="product_created">➕ Produits</SelectItem>
                  <SelectItem value="product_updated">✏️ Modifs</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={severityFilter}
                onValueChange={(value) => setSeverityFilter(value as ActivitySeverity | 'all')}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="success">✅ OK</SelectItem>
                  <SelectItem value="warning">⚠️ Attention</SelectItem>
                  <SelectItem value="error">❌ Erreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Chargement...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune activité récente</p>
            <p className="text-sm">Les actions apparaîtront ici</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                    activity.undoneAt ? 'opacity-50' : ''
                  }`}
                >
                  {/* Icône et indicateur */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                      {getActivityIcon(activity.type)}
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {activity.title}
                          {activity.undoneAt && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Annulée
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                        
                        {/* Métadonnées */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {activity.userName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(activity.createdAt)}
                          </div>
                          {activity.productName && (
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              <span className="truncate max-w-20">{activity.productName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getSeverityColor(activity.severity)}`}
                        >
                          {activity.severity}
                        </Badge>

                        {canUndoActivity(activity) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUndoActivity(activity)}
                            disabled={undoingActivity === activity.id}
                            className="h-6 w-6 p-0"
                          >
                            {undoingActivity === activity.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Undo2 className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Détails supplémentaires pour certains types */}
                    {(activity.quantity || activity.price) && (
                      <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                        {activity.quantity && (
                          <span>Quantité: {activity.quantity}</span>
                        )}
                        {activity.price && (
                          <span className="ml-3">Prix: {activity.price.toFixed(2)}€</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Pied de widget */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>{activities.length} activité(s) récente(s)</span>
          <div className="flex items-center gap-2">
            {autoRefresh && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Temps réel</span>
              </div>
            )}
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              Voir tout
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}