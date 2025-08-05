'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon,
  Loader2,
  Zap,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Package,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

import { ReportGeneratorService } from '@/services/reportGeneratorService';
import { ReportType, ReportFormat, GeneratedReport } from '@/types';

interface ReportGeneratorWidgetProps {
  className?: string;
}

export function ReportGeneratorWidget({ className = '' }: ReportGeneratorWidgetProps) {
  const [generating, setGenerating] = useState(false);
  const [recentReports, setRecentReports] = useState<GeneratedReport[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  
  // Configuration du rapport
  const [reportType, setReportType] = useState<ReportType>('sales_summary');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
    to: new Date()
  });

  // Charger les statistiques de rapports
  useEffect(() => {
    loadReportStats();
  }, []);

  const loadReportStats = async () => {
    try {
      const stats = await ReportGeneratorService.getGenerationStats();
      
      // Simulation de rapports récents
      const mockReports: GeneratedReport[] = [
        {
          id: 'report_1',
          configId: 'manual',
          name: 'Résumé des Ventes',
          type: 'sales_summary',
          format: 'pdf',
          fileName: 'rapport_ventes_2024-01-15.pdf',
          fileSize: 245000,
          generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          generatedBy: 'current-user',
          dataSnapshot: {
            totalProducts: 127,
            totalValue: 15420.50,
            totalSales: 8900.25,
            totalProfit: 3200.75,
            lowStockCount: 8,
            categories: { 'vin-rouge': 45, 'vin-blanc': 32 },
            topProducts: [],
            dateRange: { start: new Date(), end: new Date() }
          },
          emailSent: false
        },
        {
          id: 'report_2',
          configId: 'auto',
          name: 'Rapport Mensuel',
          type: 'monthly_overview',
          format: 'excel',
          fileName: 'rapport_mensuel_2024-01.xlsx',
          fileSize: 180000,
          generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          generatedBy: 'system',
          dataSnapshot: {
            totalProducts: 127,
            totalValue: 15420.50,
            totalSales: 8900.25,
            totalProfit: 3200.75,
            lowStockCount: 8,
            categories: {},
            topProducts: [],
            dateRange: { start: new Date(), end: new Date() }
          },
          emailSent: true
        }
      ];
      
      setRecentReports(mockReports);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      
      const filters = {
        dateRange: dateRange ? {
          start: dateRange.from,
          end: dateRange.to
        } : undefined
      };

      const report = await ReportGeneratorService.generateReport(
        reportType,
        reportFormat,
        filters
      );

      toast.success('Rapport généré avec succès !', {
        description: `${report.name} (${(report.fileSize / 1024).toFixed(0)} Ko)`,
        action: {
          label: 'Voir les détails',
          onClick: () => console.log('Détails du rapport:', report)
        }
      });

      // Actualiser la liste des rapports récents
      setRecentReports(prev => [report, ...prev.slice(0, 4)]);
      setShowGenerator(false);

    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast.error('Erreur lors de la génération', {
        description: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setGenerating(false);
    }
  };

  const getReportTypeIcon = (type: ReportType) => {
    const icons = {
      sales_summary: <TrendingUp className="h-4 w-4" />,
      stock_valuation: <Package className="h-4 w-4" />,
      profit_analysis: <BarChart3 className="h-4 w-4" />,
      low_stock_alert: <AlertTriangle className="h-4 w-4" />,
      category_performance: <BarChart3 className="h-4 w-4" />,
      supplier_analysis: <Users className="h-4 w-4" />,
      monthly_overview: <Calendar className="h-4 w-4" />,
      custom: <FileText className="h-4 w-4" />
    };
    return icons[type] || <FileText className="h-4 w-4" />;
  };

  const getReportTypeLabel = (type: ReportType) => {
    const labels = {
      sales_summary: 'Résumé des Ventes',
      stock_valuation: 'Valorisation Stock',
      profit_analysis: 'Analyse Rentabilité',
      low_stock_alert: 'Alerte Stock',
      category_performance: 'Performance Catégories',
      supplier_analysis: 'Analyse Fournisseurs',
      monthly_overview: 'Vue Mensuelle',
      custom: 'Personnalisé'
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFormatColor = (format: ReportFormat) => {
    const colors = {
      pdf: 'bg-red-100 text-red-800',
      excel: 'bg-green-100 text-green-800',
      both: 'bg-blue-100 text-blue-800'
    };
    return colors[format] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Rapports Automatiques</CardTitle>
              <CardDescription>
                Génération PDF/Excel avancée
              </CardDescription>
            </div>
          </div>
          
          <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Générer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Générer un rapport</DialogTitle>
                <DialogDescription>
                  Créez un rapport personnalisé avec vos données actuelles
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Type de rapport */}
                <div>
                  <label className="block text-sm font-medium mb-2">Type de rapport</label>
                  <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales_summary">📊 Résumé des Ventes</SelectItem>
                      <SelectItem value="stock_valuation">📦 Valorisation Stock</SelectItem>
                      <SelectItem value="profit_analysis">💰 Analyse Rentabilité</SelectItem>
                      <SelectItem value="low_stock_alert">⚠️ Alerte Stock</SelectItem>
                      <SelectItem value="monthly_overview">📅 Vue Mensuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Format */}
                <div>
                  <label className="block text-sm font-medium mb-2">Format</label>
                  <Select value={reportFormat} onValueChange={(value: ReportFormat) => setReportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">📄 PDF</SelectItem>
                      <SelectItem value="excel">📊 Excel</SelectItem>
                      <SelectItem value="both">📋 PDF + Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Période */}
                <div>
                  <label className="block text-sm font-medium mb-2">Période</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, 'dd MMM', { locale: fr })} -{' '}
                              {format(dateRange.to, 'dd MMM', { locale: fr })}
                            </>
                          ) : (
                            format(dateRange.from, 'dd MMM', { locale: fr })
                          )
                        ) : (
                          'Sélectionner une période'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowGenerator(false)}>
                  Annuler
                </Button>
                <Button onClick={handleGenerateReport} disabled={generating}>
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Générer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => ReportGeneratorService.generateMonthlyReport()}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Mensuel</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => ReportGeneratorService.generateLowStockReport()}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Stock Faible</span>
          </Button>
        </div>

        {/* Rapports récents */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Rapports récents</h4>
          
          {recentReports.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun rapport récent</p>
            </div>
          ) : (
            recentReports.map((report) => (
              <div key={report.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0">
                  {getReportTypeIcon(report.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{report.name}</span>
                    <Badge variant="secondary" className={`text-xs ${getFormatColor(report.format)}`}>
                      {report.format.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(report.generatedAt, 'dd/MM à HH:mm')}
                    </div>
                    <span>{formatFileSize(report.fileSize)}</span>
                    {report.emailSent && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Envoyé</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Statistiques rapides */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold">47</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-lg font-semibold">12</p>
              <p className="text-xs text-muted-foreground">Ce mois</p>
            </div>
            <div>
              <p className="text-lg font-semibold">3.2s</p>
              <p className="text-xs text-muted-foreground">Moy. génération</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}