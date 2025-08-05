'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings, 
  Plus, 
  Trash2, 
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  Loader2,
  Layout as LayoutIcon
} from 'lucide-react';
import { toast } from 'sonner';

// Composants de widgets
import { RecentActivityWidget } from '../widgets/RecentActivityWidget';
import { ReportGeneratorWidget } from '../widgets/ReportGeneratorWidget';
import { AIAlertsWidget } from '../widgets/AIAlertsWidget';
import { StatsDashboard } from '../charts/StatsDashboard';

// Types
import { DashboardWidget, WidgetConfig } from '@/types';

// Styles pour react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DraggableDashboardProps {
  userId?: string;
  layoutId?: string;
  className?: string;
}

// Configuration par défaut des widgets optimisée pour iPad
const DEFAULT_WIDGETS: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'stats_overview',
    title: 'Statistiques de vente',
    position: { x: 0, y: 0, w: 12, h: 8 }, // Pleine largeur sur desktop
    isVisible: true,
    config: {
      showTitle: true,
      statsConfig: {
        showPeriodSelector: true,
        defaultPeriod: 'month',
        metricsToShow: ['sales', 'revenue', 'profit', 'avgDaily']
      }
    }
  },
  {
    type: 'recent_activity',
    title: 'Activités récentes',
    position: { x: 0, y: 8, w: 4, h: 6 }, // Adaptatif : 4/12 sur desktop, 3/8 sur iPad
    isVisible: true,
    config: {
      showTitle: true,
      activityConfig: {
        maxItems: 8, // Réduit pour iPad
        showUserActions: true,
        showSystemActions: true,
        groupByDate: false
      }
    }
  },
  {
    type: 'ai_alerts',
    title: 'Intelligence Artificielle',
    position: { x: 4, y: 8, w: 4, h: 6 }, // Adaptatif : 4/12 sur desktop, 3/8 sur iPad
    isVisible: true,
    config: {
      showTitle: true,
      alertsConfig: {
        maxItems: 6, // Réduit pour iPad
        autoRefresh: true
      }
    }
  },
  {
    type: 'report_generator',
    title: 'Rapports Automatiques',
    position: { x: 8, y: 8, w: 4, h: 6 }, // Adaptatif : 4/12 sur desktop, 2/8 sur iPad
    isVisible: true,
    config: {
      showTitle: true
    }
  }
];

export function DraggableDashboard({ 
  userId = 'default-user', 
  layoutId = 'default',
  className = '' 
}: DraggableDashboardProps) {
  // Utiliser layoutId et userId pour le localStorage ou la configuration future
  console.debug('DraggableDashboard initialized with layoutId:', layoutId, 'userId:', userId);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Configuration de la grille optimisée pour iPad
  const gridConfig = {
    cols: { 
      lg: 12,        // Desktop large (≥1024px)
      md: 8,         // iPad paysage/petit desktop (768px-1024px) 
      sm: 6,         // Tablette portrait (640px-768px)
      xs: 4,         // Mobile large (480px-640px)
      xxs: 2         // Mobile petit (<480px)
    },
    rowHeight: 35,   // Augmenté pour meilleure lisibilité sur tablette
    margin: [12, 12] as [number, number],     // Réduit pour iPad
    containerPadding: [12, 12] as [number, number],
    // Breakpoints personnalisés pour iPad
    breakpoints: { 
      lg: 1024, 
      md: 768,       // iPad portrait et petit paysage
      sm: 640, 
      xs: 480, 
      xxs: 0 
    }
  };

  // Initialiser les widgets par défaut
  useEffect(() => {
    const initializeWidgets = () => {
      const defaultWidgets: DashboardWidget[] = DEFAULT_WIDGETS.map((widget, index) => ({
        ...widget,
        id: `widget-${index + 1}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      setWidgets(defaultWidgets);
      
      // Convertir en layouts pour react-grid-layout avec optimisation iPad
      const gridLayouts = {
        lg: defaultWidgets.map(widget => ({
          i: widget.id,
          x: widget.position.x,
          y: widget.position.y,
          w: widget.position.w,
          h: widget.position.h,
          minW: 2,
          minH: 2
        })),
        // Layout optimisé pour iPad (md = 8 colonnes)
        md: defaultWidgets.map((widget, index) => {
          switch(widget.type) {
            case 'stats_overview':
              return { i: widget.id, x: 0, y: 0, w: 8, h: 8, minW: 4, minH: 6 };
            case 'recent_activity':
              return { i: widget.id, x: 0, y: 8, w: 3, h: 6, minW: 2, minH: 4 };
            case 'ai_alerts':
              return { i: widget.id, x: 3, y: 8, w: 3, h: 6, minW: 2, minH: 4 };
            case 'report_generator':
              return { i: widget.id, x: 6, y: 8, w: 2, h: 8, minW: 2, minH: 6 };
            default:
              return { i: widget.id, x: 0, y: index * 6, w: 4, h: 4, minW: 2, minH: 2 };
          }
        }),
        // Layout pour tablettes portrait (sm = 6 colonnes) 
        sm: defaultWidgets.map((widget, index) => {
          switch(widget.type) {
            case 'stats_overview':
              return { i: widget.id, x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 };
            case 'recent_activity':
              return { i: widget.id, x: 0, y: 8, w: 6, h: 6, minW: 4, minH: 4 };
            case 'ai_alerts':
              return { i: widget.id, x: 0, y: 14, w: 6, h: 8, minW: 4, minH: 6 };
            case 'report_generator':
              return { i: widget.id, x: 0, y: 22, w: 6, h: 8, minW: 4, minH: 6 };
            default:
              return { i: widget.id, x: 0, y: index * 6, w: 6, h: 4, minW: 4, minH: 2 };
          }
        })
      };
      
      setLayouts(gridLayouts);
    };

    initializeWidgets();
  }, []);

  // Gérer les changements de layout
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    setLayouts(allLayouts);
    
    // Mettre à jour les positions des widgets
    setWidgets(prevWidgets => 
      prevWidgets.map(widget => {
        const layoutItem = currentLayout.find(item => item.i === widget.id);
        if (layoutItem) {
          return {
            ...widget,
            position: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h
            },
            updatedAt: new Date()
          };
        }
        return widget;
      })
    );
  }, []);

  // Supprimer un widget
  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setLayouts(prev => ({
      ...prev,
      lg: prev.lg?.filter(item => item.i !== widgetId) || []
    }));
    toast.success('Widget supprimé');
  }, []);

  // Basculer la visibilité d'un widget
  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    setWidgets(prev => 
      prev.map(widget => 
        widget.id === widgetId 
          ? { ...widget, isVisible: !widget.isVisible, updatedAt: new Date() }
          : widget
      )
    );
  }, []);

  // Ajouter un nouveau widget
  const addWidget = useCallback((type: DashboardWidget['type']) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: getWidgetTitle(type),
      position: { x: 0, y: 0, w: 6, h: 4 },
      isVisible: true,
      config: getDefaultConfig(type),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setWidgets(prev => [...prev, newWidget]);
    
    // Ajouter au layout
    const newLayoutItem: Layout = {
      i: newWidget.id,
      x: 0,
      y: 0,
      w: newWidget.position.w,
      h: newWidget.position.h,
      minW: 2,
      minH: 2
    };

    setLayouts(prev => ({
      ...prev,
      lg: [...(prev.lg || []), newLayoutItem]
    }));

    setShowAddDialog(false);
    toast.success(`Widget "${newWidget.title}" ajouté`);
  }, []);

  // Sauvegarder la configuration
  const saveLayout = useCallback(async () => {
    setSaving(true);
    try {
      // Ici vous pourriez sauvegarder dans Firebase
      // await DashboardService.saveLayout(userId, { widgets, layouts });
      
      // Simulation d'une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Configuration sauvegardée');
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, []);

  // Réinitialiser le layout
  const resetLayout = useCallback(() => {
    const defaultWidgets: DashboardWidget[] = DEFAULT_WIDGETS.map((widget, index) => ({
      ...widget,
      id: `widget-${index + 1}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    setWidgets(defaultWidgets);
    
    const gridLayouts = {
      lg: defaultWidgets.map(widget => ({
        i: widget.id,
        x: widget.position.x,
        y: widget.position.y,
        w: widget.position.w,
        h: widget.position.h,
        minW: 2,
        minH: 2
      }))
    };
    
    setLayouts(gridLayouts);
    toast.success('Layout réinitialisé');
  }, []);

  // Rendu d'un widget
  const renderWidget = useCallback((widget: DashboardWidget) => {
    if (!widget.isVisible) return null;

    const commonProps = {
      className: "h-full",
      ...widget.config
    };

    let content: React.ReactNode;

    switch (widget.type) {
      case 'stats_overview':
        content = (
          <div className="h-full overflow-hidden">
            <StatsDashboard className="h-full" />
          </div>
        );
        break;
        
      case 'recent_activity':
        content = (
          <RecentActivityWidget 
            {...commonProps}
            maxItems={widget.config.activityConfig?.maxItems}
            showFilters={false}
            autoRefresh={true}
          />
        );
        break;
        
      case 'low_stock_alerts':
        content = (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Alertes stock</CardTitle>
              <CardDescription>Produits nécessitant votre attention</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Widget en développement...</p>
            </CardContent>
          </Card>
        );
        break;
        
      case 'ai_alerts':
        content = (
          <AIAlertsWidget 
            {...commonProps}
            maxAlerts={widget.config.alertsConfig?.maxItems}
            autoRefresh={widget.config.alertsConfig?.autoRefresh}
          />
        );
        break;
        
      case 'report_generator':
        content = (
          <ReportGeneratorWidget 
            {...commonProps}
          />
        );
        break;
        
      default:
        content = (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Widget non implémenté</p>
            </CardContent>
          </Card>
        );
    }

    return (
      <div key={widget.id} className="relative group">
        {content}
        
        {/* Contrôles d'édition */}
        {isEditing && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleWidgetVisibility(widget.id)}
                className="h-6 w-6 p-0"
              >
                {widget.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeWidget(widget.id)}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Handle de déplacement */}
        {isEditing && (
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }, [isEditing, removeWidget, toggleWidgetVisibility]);

  // Préparer les éléments pour react-grid-layout
  const gridElements = useMemo(() => {
    return widgets
      .filter(widget => widget.isVisible)
      .map(widget => renderWidget(widget));
  }, [widgets, renderWidget]);

  return (
    <div className={`w-full ${className}`}>
      {/* Barre d'outils */}
      <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <LayoutIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Dashboard personnalisable</h2>
          {isEditing && (
            <Badge variant="outline" className="ml-2">
              Mode édition
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un widget</DialogTitle>
                    <DialogDescription>
                      Choisissez le type de widget à ajouter à votre dashboard
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3 py-4">
                    <Button
                      variant="outline"
                      onClick={() => addWidget('recent_activity')}
                      className="h-20 flex-col p-3"
                    >
                      <span className="text-lg mb-1">📝</span>
                      <span className="text-xs font-medium">Activités</span>
                      <span className="text-xs text-muted-foreground">Historique récent</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => addWidget('ai_alerts')}
                      className="h-20 flex-col p-3"
                    >
                      <span className="text-lg mb-1">🤖</span>
                      <span className="text-xs font-medium">IA</span>
                      <span className="text-xs text-muted-foreground">Alertes intelligentes</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => addWidget('report_generator')}
                      className="h-20 flex-col p-3"
                    >
                      <span className="text-lg mb-1">📊</span>
                      <span className="text-xs font-medium">Rapports</span>
                      <span className="text-xs text-muted-foreground">PDF/Excel auto</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => addWidget('low_stock_alerts')}
                      className="h-20 flex-col p-3"
                    >
                      <span className="text-lg mb-1">⚠️</span>
                      <span className="text-xs font-medium">Alertes</span>
                      <span className="text-xs text-muted-foreground">Stock faible</span>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button size="sm" variant="outline" onClick={resetLayout}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>

              <Button size="sm" onClick={saveLayout} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isEditing ? 'Terminer' : 'Éditer'}
          </Button>
        </div>
      </div>

      {/* Grille de widgets */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        {...gridConfig}
        isDraggable={isEditing}
        isResizable={isEditing}
        preventCollision={false}
        compactType="vertical"
        useCSSTransforms={true}
      >
        {gridElements}
      </ResponsiveGridLayout>
    </div>
  );
}

// Fonctions utilitaires
function getWidgetTitle(type: DashboardWidget['type']): string {
  const titles = {
    stats_overview: 'Statistiques générales',
    sales_chart: 'Graphique des ventes',
    category_chart: 'Répartition par catégorie',
    recent_activity: 'Activités récentes',
    low_stock_alerts: 'Alertes stock faible',
    quick_actions: 'Actions rapides',
    top_products: 'Produits populaires',
    ai_alerts: 'Intelligence Artificielle',
    report_generator: 'Rapports Automatiques'
  };
  return titles[type] || 'Widget personnalisé';
}

function getDefaultConfig(type: DashboardWidget['type']): WidgetConfig {
  switch (type) {
    case 'recent_activity':
      return {
        showTitle: true,
        activityConfig: {
          maxItems: 10,
          showUserActions: true,
          showSystemActions: true
        }
      };
    case 'low_stock_alerts':
      return {
        showTitle: true,
        alertsConfig: {
          maxItems: 10,
          severityFilter: ['warning', 'error'],
          autoRefresh: true
        }
      };
    case 'ai_alerts':
      return {
        showTitle: true,
        alertsConfig: {
          maxItems: 8,
          autoRefresh: true
        }
      };
    case 'report_generator':
      return {
        showTitle: true
      };
    case 'stats_overview':
      return {
        showTitle: true,
        statsConfig: {
          showPeriodSelector: true,
          defaultPeriod: 'month',
          metricsToShow: ['sales', 'revenue', 'profit']
        }
      };
    default:
      return { showTitle: true };
  }
}