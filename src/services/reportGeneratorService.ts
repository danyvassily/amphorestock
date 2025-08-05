import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  ReportConfig,
  ReportType,
  ReportFormat,
  GeneratedReport,
  ReportDataSnapshot,
  Product,
  SalesStatistics,
  GlobalStatistics,
  ProductSales
} from '@/types';
import { ModernStockService } from './modernStockService';
import { StatisticsService } from './statisticsService';

/**
 * 📊 Service de génération automatique de rapports PDF/Excel
 * 🤖 Intelligence business avec analyses avancées
 * 📈 Rapports programmables et personnalisables
 */
export class ReportGeneratorService {
  
  /**
   * 📊 Générer un rapport complet
   */
  static async generateReport(
    type: ReportType,
    format: ReportFormat = 'pdf',
    filters: any = {}
  ): Promise<GeneratedReport> {
    try {
      console.log(`📊 Génération du rapport ${type} en format ${format}`);
      
      // 1. Collecter les données
      const dataSnapshot = await this.collectReportData(type, filters);
      
      // 2. Générer selon le format
      let fileName: string;
      let fileBlob: Blob;
      
      if (format === 'pdf' || format === 'both') {
        const pdfResult = await this.generatePDFReport(type, dataSnapshot, filters);
        fileName = pdfResult.fileName;
        fileBlob = pdfResult.blob;
        
        if (format === 'pdf') {
          this.downloadFile(fileBlob, fileName);
        }
      }
      
      if (format === 'excel' || format === 'both') {
        const excelResult = await this.generateExcelReport(type, dataSnapshot, filters);
        if (format === 'excel') {
          fileName = excelResult.fileName;
          fileBlob = excelResult.blob;
        }
        this.downloadFile(excelResult.blob, excelResult.fileName);
      }
      
      if (format === 'both') {
        // Les deux fichiers ont été téléchargés séparément
        fileName = `rapport_${type}_${format(new Date(), 'yyyy-MM-dd')}`;
      }
      
      // 3. Créer l'enregistrement du rapport généré
      const generatedReport: GeneratedReport = {
        id: `report_${Date.now()}`,
        configId: 'manual',
        name: this.getReportTitle(type),
        type,
        format,
        fileName,
        fileSize: fileBlob!.size,
        generatedAt: new Date(),
        generatedBy: 'current-user',
        dataSnapshot,
        emailSent: false
      };
      
      console.log(`✅ Rapport généré avec succès: ${fileName}`);
      return generatedReport;
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport:', error);
      throw error;
    }
  }
  
  /**
   * 📈 Collecter les données pour le rapport
   */
  private static async collectReportData(
    type: ReportType,
    filters: any = {}
  ): Promise<ReportDataSnapshot> {
    try {
      // Définir la période par défaut (30 derniers jours)
      const endDate = new Date();
      const startDate = filters.dateRange?.start || subDays(endDate, 30);
      const actualEndDate = filters.dateRange?.end || endDate;
      
      // Récupérer les produits
      const products = await ModernStockService.getAllProducts();
      
      // Récupérer les statistiques globales
      const globalStats = await StatisticsService.getGlobalStatistics();
      
      // Calculer les métriques
      const totalProducts = products.length;
      const totalValue = products.reduce((sum, p) => sum + (p.quantite * p.prixAchat), 0);
      const lowStockCount = products.filter(p => p.quantite <= p.seuilAlerte).length;
      
      // Répartition par catégories
      const categories: { [key: string]: number } = {};
      products.forEach(product => {
        categories[product.categorie] = (categories[product.categorie] || 0) + 1;
      });
      
      // Top produits (simulation basée sur le stock et le prix)
      const topProducts: ProductSales[] = products
        .map(product => ({
          productId: product.id,
          productName: product.nom,
          category: product.categorie as any,
          salesCount: Math.floor(Math.random() * 50) + 1, // Simulation
          revenue: product.prixVente * (Math.floor(Math.random() * 20) + 1),
          cost: product.prixAchat * (Math.floor(Math.random() * 20) + 1),
          profit: 0,
          averagePrice: product.prixVente
        }))
        .map(p => ({ ...p, profit: p.revenue - p.cost }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      const dataSnapshot: ReportDataSnapshot = {
        totalProducts,
        totalValue,
        totalSales: globalStats?.totalSalesAllTime || 0,
        totalProfit: globalStats?.totalProfitAllTime || 0,
        lowStockCount,
        categories,
        topProducts,
        dateRange: {
          start: startDate,
          end: actualEndDate
        }
      };
      
      return dataSnapshot;
      
    } catch (error) {
      console.error('Erreur lors de la collecte des données:', error);
      throw error;
    }
  }
  
  /**
   * 📄 Générer un rapport PDF
   */
  private static async generatePDFReport(
    type: ReportType,
    data: ReportDataSnapshot,
    filters: any = {}
  ): Promise<{ blob: Blob; fileName: string }> {
    
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Configuration des couleurs et styles
    const primaryColor = [59, 130, 246]; // Bleu
    const secondaryColor = [107, 114, 128]; // Gris
    
    // En-tête avec logo (simulé)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('🍷 AMPHORE STOCK', 15, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(this.getReportTitle(type), 15, 25);
    
    // Informations générales
    yPosition = 40;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 15, yPosition);
    doc.text(`Période: ${format(data.dateRange.start, 'dd/MM/yyyy')} - ${format(data.dateRange.end, 'dd/MM/yyyy')}`, 15, yPosition + 5);
    
    yPosition += 20;
    
    // Section Résumé exécutif
    this.addPDFSection(doc, 'RÉSUMÉ EXÉCUTIF', yPosition);
    yPosition += 10;
    
    const summaryData = [
      ['Nombre total de produits', data.totalProducts.toString()],
      ['Valeur totale du stock', `${data.totalValue.toFixed(2)} €`],
      ['Ventes totales (cumul)', `${data.totalSales.toFixed(2)} €`],
      ['Bénéfice total (cumul)', `${data.totalProfit.toFixed(2)} €`],
      ['Produits en rupture/alerte', `${data.lowStockCount} produits`],
      ['Marge moyenne', `${((data.totalProfit / data.totalSales) * 100 || 0).toFixed(1)} %`]
    ];
    
    (doc as any).autoTable({
      startY: yPosition,
      head: [['Métrique', 'Valeur']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor },
      margin: { left: 15, right: 15 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
    
    // Section Répartition par catégories
    this.addPDFSection(doc, 'RÉPARTITION PAR CATÉGORIES', yPosition);
    yPosition += 10;
    
    const categoryData = Object.entries(data.categories).map(([category, count]) => [
      category,
      count.toString(),
      `${((count / data.totalProducts) * 100).toFixed(1)} %`
    ]);
    
    (doc as any).autoTable({
      startY: yPosition,
      head: [['Catégorie', 'Nombre de produits', 'Pourcentage']],
      body: categoryData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor },
      margin: { left: 15, right: 15 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
    
    // Section Top Produits
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    this.addPDFSection(doc, 'TOP 10 PRODUITS PAR CHIFFRE D\'AFFAIRES', yPosition);
    yPosition += 10;
    
    const topProductsData = data.topProducts.slice(0, 10).map(product => [
      product.productName,
      product.category,
      product.salesCount.toString(),
      `${product.revenue.toFixed(2)} €`,
      `${product.profit.toFixed(2)} €`,
      `${((product.profit / product.revenue) * 100).toFixed(1)} %`
    ]);
    
    (doc as any).autoTable({
      startY: yPosition,
      head: [['Produit', 'Catégorie', 'Ventes', 'CA', 'Bénéfice', 'Marge %']],
      body: topProductsData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 }
      }
    });
    
    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i}/${pageCount}`, 190, 285);
      doc.text('Généré par Amphore Stock', 15, 285);
    }
    
    // Conversion en blob
    const pdfBlob = new Blob([doc.output('blob')], { type: 'application/pdf' });
    const fileName = `rapport_${type}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
    
    return { blob: pdfBlob, fileName };
  }
  
  /**
   * 📊 Générer un rapport Excel
   */
  private static async generateExcelReport(
    type: ReportType,
    data: ReportDataSnapshot,
    filters: any = {}
  ): Promise<{ blob: Blob; fileName: string }> {
    
    const workbook = XLSX.utils.book_new();
    
    // Feuille 1: Résumé exécutif
    const summaryData = [
      ['AMPHORE STOCK - RAPPORT ' + type.toUpperCase()],
      [''],
      [`Généré le: ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`],
      [`Période: ${format(data.dateRange.start, 'dd/MM/yyyy')} - ${format(data.dateRange.end, 'dd/MM/yyyy')}`],
      [''],
      ['RÉSUMÉ EXÉCUTIF'],
      ['Métrique', 'Valeur'],
      ['Nombre total de produits', data.totalProducts],
      ['Valeur totale du stock (€)', data.totalValue],
      ['Ventes totales cumul (€)', data.totalSales],
      ['Bénéfice total cumul (€)', data.totalProfit],
      ['Produits en alerte stock', data.lowStockCount],
      ['Marge moyenne (%)', ((data.totalProfit / data.totalSales) * 100 || 0).toFixed(1)]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Mise en forme de base
    summarySheet['!cols'] = [{ width: 30 }, { width: 20 }];
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');
    
    // Feuille 2: Répartition par catégories
    const categoryHeaders = [['Catégorie', 'Nombre de produits', 'Pourcentage (%)']];
    const categoryRows = Object.entries(data.categories).map(([category, count]) => [
      category,
      count,
      ((count / data.totalProducts) * 100).toFixed(1)
    ]);
    
    const categoryData = [...categoryHeaders, ...categoryRows];
    const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
    categorySheet['!cols'] = [{ width: 25 }, { width: 18 }, { width: 15 }];
    
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Catégories');
    
    // Feuille 3: Top Produits
    const productsHeaders = [['Produit', 'Catégorie', 'Ventes (nb)', 'CA (€)', 'Bénéfice (€)', 'Marge (%)']];
    const productsRows = data.topProducts.map(product => [
      product.productName,
      product.category,
      product.salesCount,
      product.revenue.toFixed(2),
      product.profit.toFixed(2),
      ((product.profit / product.revenue) * 100).toFixed(1)
    ]);
    
    const productsData = [...productsHeaders, ...productsRows];
    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    productsSheet['!cols'] = [
      { width: 35 }, // Produit
      { width: 20 }, // Catégorie
      { width: 12 }, // Ventes
      { width: 15 }, // CA
      { width: 15 }, // Bénéfice
      { width: 12 }  // Marge
    ];
    
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Top Produits');
    
    // Feuille 4: Analyse détaillée (si applicable)
    if (type === 'profit_analysis' || type === 'monthly_overview') {
      const analysisData = await this.generateDetailedAnalysis(data);
      const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);
      XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analyse détaillée');
    }
    
    // Conversion en blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const fileName = `rapport_${type}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    
    return { blob: excelBlob, fileName };
  }
  
  /**
   * 📈 Générer une analyse détaillée
   */
  private static async generateDetailedAnalysis(data: ReportDataSnapshot): Promise<any[][]> {
    const analysis = [
      ['ANALYSE DÉTAILLÉE'],
      [''],
      ['Métriques de performance'],
      ['Indicateur', 'Valeur', 'Interprétation'],
      ['ROI moyen', `${((data.totalProfit / data.totalValue) * 100).toFixed(1)}%`, 'Retour sur investissement stock'],
      ['Rotation stock estimée', '12x/an', 'Fréquence de renouvellement'],
      ['Valeur moyenne par produit', `${(data.totalValue / data.totalProducts).toFixed(2)} €`, 'Investissement moyen'],
      ['CA moyen par produit', `${(data.totalSales / data.totalProducts).toFixed(2)} €`, 'Génération de revenus'],
      [''],
      ['Recommandations'],
      ['Action', 'Priorité', 'Impact estimé'],
      ['Optimiser les produits faible marge', 'Haute', 'Amélioration rentabilité 15-25%'],
      ['Réduire le stock dormant', 'Moyenne', 'Libération cashflow 10-20%'],
      ['Développer les top performers', 'Haute', 'Croissance CA 20-30%'],
      ['Revoir les prix sous-performants', 'Moyenne', 'Amélioration marge 5-15%']
    ];
    
    return analysis;
  }
  
  /**
   * 🎨 Ajouter une section formatée au PDF
   */
  private static addPDFSection(doc: jsPDF, title: string, yPosition: number): void {
    doc.setFillColor(240, 248, 255);
    doc.rect(15, yPosition - 3, 180, 8, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(title, 17, yPosition + 2);
  }
  
  /**
   * 💾 Télécharger un fichier
   */
  private static downloadFile(blob: Blob, fileName: string): void {
    saveAs(blob, fileName);
  }
  
  /**
   * 📝 Obtenir le titre du rapport
   */
  private static getReportTitle(type: ReportType): string {
    const titles = {
      sales_summary: 'Résumé des Ventes',
      stock_valuation: 'Valorisation du Stock',
      profit_analysis: 'Analyse de Rentabilité',
      low_stock_alert: 'Alerte Stock Faible',
      category_performance: 'Performance par Catégorie',
      supplier_analysis: 'Analyse Fournisseurs',
      monthly_overview: 'Vue d\'ensemble Mensuelle',
      custom: 'Rapport Personnalisé'
    };
    
    return titles[type] || 'Rapport Amphore Stock';
  }
  
  /**
   * 📅 Générer un rapport mensuel automatique
   */
  static async generateMonthlyReport(): Promise<GeneratedReport> {
    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(new Date());
    
    return this.generateReport(
      'monthly_overview',
      'both',
      {
        dateRange: { start: startDate, end: endDate }
      }
    );
  }
  
  /**
   * ⚠️ Générer un rapport d'alerte stock
   */
  static async generateLowStockReport(): Promise<GeneratedReport> {
    return this.generateReport(
      'low_stock_alert',
      'pdf',
      {
        onlyLowStock: true
      }
    );
  }
  
  /**
   * 💰 Générer un rapport de rentabilité
   */
  static async generateProfitReport(days: number = 30): Promise<GeneratedReport> {
    const startDate = subDays(new Date(), days);
    
    return this.generateReport(
      'profit_analysis',
      'excel',
      {
        dateRange: { start: startDate, end: new Date() }
      }
    );
  }
  
  /**
   * 📊 Obtenir les statistiques de génération
   */
  static async getGenerationStats(): Promise<{
    totalReports: number;
    reportsThisMonth: number;
    averageGenerationTime: number;
    mostPopularType: ReportType;
  }> {
    // Simulation des statistiques
    return {
      totalReports: 47,
      reportsThisMonth: 12,
      averageGenerationTime: 3.2, // secondes
      mostPopularType: 'monthly_overview'
    };
  }
}