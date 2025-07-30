import * as XLSX from 'xlsx';
import { ImportedProduct } from './importAIService';

export interface FileProcessingResult {
  success: boolean;
  data: any[];
  fileType: string;
  error?: string;
  metadata: {
    rowCount: number;
    columnCount: number;
    hasHeaders: boolean;
    detectedFormat: string;
  };
}

export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  error?: string;
}

export class FileProcessor {
  
  /**
   * Détecte le type de fichier et le traite en conséquence
   */
  static async processFile(file: File): Promise<FileProcessingResult> {
    try {
      const fileType = this.detectFileType(file);
      
      switch (fileType) {
        case 'excel':
          return await this.processExcelFile(file);
        case 'csv':
          return await this.processCSVFile(file);
        case 'pdf':
          return await this.processPDFFile(file);
        case 'image':
          return await this.processImageFile(file);
        case 'text':
          return await this.processTextFile(file);
        default:
          throw new Error(`Type de fichier non supporté: ${file.type}`);
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        fileType: 'unknown',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        metadata: {
          rowCount: 0,
          columnCount: 0,
          hasHeaders: false,
          detectedFormat: 'unknown'
        }
      };
    }
  }

  /**
   * Détecte le type de fichier basé sur l'extension et le MIME type
   */
  private static detectFileType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();

    // Excel files
    if (extension === 'xlsx' || extension === 'xls' || 
        mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return 'excel';
    }

    // CSV files
    if (extension === 'csv' || mimeType === 'text/csv') {
      return 'csv';
    }

    // PDF files
    if (extension === 'pdf' || mimeType === 'application/pdf') {
      return 'pdf';
    }

    // Image files
    if (['jpg', 'jpeg', 'png', 'bmp', 'tiff'].includes(extension || '') ||
        mimeType.startsWith('image/')) {
      return 'image';
    }

    // Text files
    if (extension === 'txt' || mimeType === 'text/plain') {
      return 'text';
    }

    // Word documents
    if (extension === 'docx' || extension === 'doc' ||
        mimeType.includes('word') || mimeType.includes('document')) {
      return 'word';
    }

    return 'unknown';
  }

  /**
   * Traite les fichiers Excel (.xlsx, .xls)
   */
  private static async processExcelFile(file: File): Promise<FileProcessingResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Prendre la première feuille
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir en JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Détecter les en-têtes
      const hasHeaders = this.detectHeaders(jsonData[0] as string[]);
      const data = hasHeaders ? jsonData.slice(1) : jsonData;
      
      return {
        success: true,
        data: data,
        fileType: 'excel',
        metadata: {
          rowCount: data.length,
          columnCount: data[0]?.length || 0,
          hasHeaders,
          detectedFormat: 'excel'
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors du traitement Excel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Traite les fichiers CSV
   */
  private static async processCSVFile(file: File): Promise<FileProcessingResult> {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Parser le CSV
      const data = lines.map(line => {
        // Gestion des virgules dans les champs entre guillemets
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });

      const hasHeaders = this.detectHeaders(data[0]);
      const processedData = hasHeaders ? data.slice(1) : data;

      return {
        success: true,
        data: processedData,
        fileType: 'csv',
        metadata: {
          rowCount: processedData.length,
          columnCount: processedData[0]?.length || 0,
          hasHeaders,
          detectedFormat: 'csv'
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors du traitement CSV: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Traite les fichiers PDF avec OCR
   */
  private static async processPDFFile(file: File): Promise<FileProcessingResult> {
    try {
      // Pour l'instant, on simule l'OCR
      // Dans une vraie implémentation, on utiliserait une API comme Google Vision ou Tesseract
      const ocrResult = await this.performOCR(file);
      
      if (!ocrResult.success) {
        throw new Error(ocrResult.error || 'Échec de l\'OCR');
      }

      // Extraire les données structurées du texte OCR
      const extractedData = this.extractDataFromText(ocrResult.text);

      return {
        success: true,
        data: extractedData,
        fileType: 'pdf',
        metadata: {
          rowCount: extractedData.length,
          columnCount: extractedData[0]?.length || 0,
          hasHeaders: false,
          detectedFormat: 'pdf-ocr'
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors du traitement PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Traite les fichiers image avec OCR
   */
  private static async processImageFile(file: File): Promise<FileProcessingResult> {
    try {
      const ocrResult = await this.performOCR(file);
      
      if (!ocrResult.success) {
        throw new Error(ocrResult.error || 'Échec de l\'OCR');
      }

      const extractedData = this.extractDataFromText(ocrResult.text);

      return {
        success: true,
        data: extractedData,
        fileType: 'image',
        metadata: {
          rowCount: extractedData.length,
          columnCount: extractedData[0]?.length || 0,
          hasHeaders: false,
          detectedFormat: 'image-ocr'
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors du traitement image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Traite les fichiers texte
   */
  private static async processTextFile(file: File): Promise<FileProcessingResult> {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Essayer de détecter un format structuré
      const structuredData = this.extractDataFromText(text);

      return {
        success: true,
        data: structuredData,
        fileType: 'text',
        metadata: {
          rowCount: structuredData.length,
          columnCount: structuredData[0]?.length || 0,
          hasHeaders: false,
          detectedFormat: 'text'
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors du traitement texte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Effectue l'OCR sur un fichier (PDF ou image)
   */
  private static async performOCR(file: File): Promise<OCRResult> {
    try {
      // Simulation d'OCR - dans une vraie implémentation, on appellerait une API
      // comme Google Vision API ou Tesseract.js
      
      // Pour l'instant, on simule un délai et on retourne un texte d'exemple
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulation de texte extrait
      const simulatedText = `
        Facture Fournisseur: Vins & Spiritueux
        Date: 15/01/2024
        
        Produits:
        - Bordeaux Rouge 2020, 12 bouteilles, 15€/unité
        - Champagne Brut, 6 bouteilles, 45€/unité
        - Gin Bombay, 4 bouteilles, 25€/unité
        - Whisky Highland, 8 bouteilles, 35€/unité
        
        Total: 890€
      `;

      return {
        success: true,
        text: simulatedText,
        confidence: 85
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        confidence: 0,
        error: error instanceof Error ? error.message : 'Erreur OCR'
      };
    }
  }

  /**
   * Extrait des données structurées d'un texte libre
   */
  private static extractDataFromText(text: string): any[] {
    const lines = text.split('\n').filter(line => line.trim());
    const data: any[] = [];
    
    for (const line of lines) {
      // Chercher des patterns de produits dans le texte
      const productMatch = line.match(/([^,]+?)[\s:]*(\d+)[\s]*(?:bouteilles?|litres?|canettes?)?[\s:]*(\d+(?:\.\d+)?)[\s]*(?:euros?|€)?/i);
      
      if (productMatch) {
        data.push([
          productMatch[1].trim(), // Nom du produit
          productMatch[2],        // Quantité
          productMatch[3],        // Prix
          'bouteille',           // Unité par défaut
          'vins-rouge'           // Catégorie par défaut
        ]);
      }
    }
    
    return data;
  }

  /**
   * Détecte si la première ligne contient des en-têtes
   */
  private static detectHeaders(firstRow: string[]): boolean {
    if (!firstRow || firstRow.length === 0) return false;
    
    // Vérifier si la première ligne contient des mots-clés d'en-tête
    const headerKeywords = ['nom', 'produit', 'quantité', 'prix', 'catégorie', 'fournisseur', 'date'];
    const firstRowText = firstRow.join(' ').toLowerCase();
    
    return headerKeywords.some(keyword => firstRowText.includes(keyword));
  }

  /**
   * Normalise les données extraites en format standard
   */
  static normalizeData(rawData: any[], fileType: string): ImportedProduct[] {
    const normalizedProducts: ImportedProduct[] = [];
    
    for (const row of rawData) {
      if (!row || row.length < 3) continue;
      
      try {
        const product: ImportedProduct = {
          nom: this.cleanProductName(row[0]),
          quantite: this.parseQuantity(row[1]),
          prixAchat: this.parsePrice(row[2]),
          unite: this.detectUnit(row[1], row[0]),
          categorie: this.detectCategory(row[0], row[3]),
          fournisseur: row[4] || '',
          description: row[5] || '',
          confidence: 75 // Confiance par défaut pour données extraites
        };
        
        if (product.nom && product.quantite > 0 && product.prixAchat > 0) {
          normalizedProducts.push(product);
        }
      } catch (error) {
        console.warn('Erreur lors de la normalisation de la ligne:', row, error);
      }
    }
    
    return normalizedProducts;
  }

  /**
   * Nettoie le nom du produit
   */
  private static cleanProductName(name: string): string {
    if (!name) return '';
    
    return name
      .toString()
      .trim()
      .replace(/^[^a-zA-Z0-9]*/, '') // Supprimer caractères spéciaux au début
      .replace(/[^a-zA-Z0-9\s]*$/, '') // Supprimer caractères spéciaux à la fin
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .substring(0, 100); // Limiter la longueur
  }

  /**
   * Parse la quantité
   */
  private static parseQuantity(quantity: any): number {
    if (!quantity) return 0;
    
    const num = parseFloat(quantity.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(num) ? 0 : Math.max(0, num);
  }

  /**
   * Parse le prix
   */
  private static parsePrice(price: any): number {
    if (!price) return 0;
    
    const num = parseFloat(price.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(num) ? 0 : Math.max(0, num);
  }

  /**
   * Détecte l'unité basée sur la quantité et le nom
   */
  private static detectUnit(quantity: any, name: string): string {
    const nameLower = name.toString().toLowerCase();
    
    if (nameLower.includes('litre') || nameLower.includes('l ')) return 'litre';
    if (nameLower.includes('cl') || nameLower.includes('centilitre')) return 'cl';
    if (nameLower.includes('piece') || nameLower.includes('unité')) return 'piece';
    
    // Par défaut, bouteille pour les boissons
    return 'bouteille';
  }

  /**
   * Détecte la catégorie basée sur le nom du produit
   */
  private static detectCategory(name: string, category?: string): string {
    const nameLower = name.toString().toLowerCase();
    
    // Si une catégorie est fournie, l'utiliser
    if (category) {
      const categoryLower = category.toString().toLowerCase();
      if (categoryLower.includes('rouge')) return 'vins-rouge';
      if (categoryLower.includes('blanc')) return 'vins-blanc';
      if (categoryLower.includes('rose')) return 'vins-rose';
      if (categoryLower.includes('champagne')) return 'champagne';
      if (categoryLower.includes('spiritueux')) return 'spiritueux';
      if (categoryLower.includes('liqueur')) return 'liqueur';
      if (categoryLower.includes('biere')) return 'biere';
      if (categoryLower.includes('soft')) return 'soft';
    }
    
    // Détection automatique basée sur le nom
    if (nameLower.includes('bordeaux') || nameLower.includes('rouge')) return 'vins-rouge';
    if (nameLower.includes('blanc') || nameLower.includes('chardonnay')) return 'vins-blanc';
    if (nameLower.includes('rose')) return 'vins-rose';
    if (nameLower.includes('champagne') || nameLower.includes('brut')) return 'champagne';
    if (nameLower.includes('whisky') || nameLower.includes('gin') || nameLower.includes('vodka')) return 'spiritueux';
    if (nameLower.includes('liqueur') || nameLower.includes('amaretto')) return 'liqueur';
    if (nameLower.includes('biere') || nameLower.includes('heineken')) return 'biere';
    if (nameLower.includes('coca') || nameLower.includes('perrier')) return 'soft';
    
    // Par défaut
    return 'vins-rouge';
  }
}