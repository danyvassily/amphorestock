import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  doc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '@/types';

export interface ImportedProduct extends Omit<Product, 'id' | 'createdAt' | 'updatedAt'> {
  isNew?: boolean;
  isDuplicate?: boolean;
  duplicateId?: string;
  confidence?: number;
  aiSuggestions?: string[];
}

export interface ImportAlert {
  type: 'error' | 'warning' | 'info';
  message: string;
  productIndex?: number;
}

export interface ImportPreview {
  products: ImportedProduct[];
  summary: {
    totalProducts: number;
    newProducts: number;
    updatedProducts: number;
    duplicates: number;
    errors: number;
  };
  alerts: ImportAlert[];
  suggestions: string[];
  aiAnalysis: string;
  estimatedImpact: {
    stockValue: number;
    newCategories: string[];
    potentialIssues: string[];
  };
}

export interface ImportResult {
  success: boolean;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  error?: string;
  importId: string;
}

export interface ImportHistory {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  fileNames?: string[];
  textInput?: string;
  productsCount: number;
  success: boolean;
  addedCount?: number;
  updatedCount?: number;
  error?: string;
  rollbackAvailable: boolean;
  aiAnalysisLog: string;
}

export interface FileProcessingStep {
  step: string;
  progress: number;
}

export class ImportAIService {
  
  /**
   * Import direct automatique avec validation minimale
   */
  static async processAndImportDirectly(
    files: File[],
    userId: string,
    minConfidence: number = 80,
    onProgress?: (step: string, progress: number) => void
  ): Promise<ImportResult> {
    onProgress?.('Initialisation import automatique...', 0);

    try {
      // Étape 1: Traitement IA standard
      onProgress?.('Analyse IA des fichiers...', 20);
      const preview = await this.processFiles(files, userId, (step, progress) => {
        onProgress?.(step, Math.floor(progress * 0.7)); // 70% pour le traitement
      });

      // Étape 2: Validation de confiance
      onProgress?.('Validation des données extraites...', 70);
      const highConfidenceProducts = preview.products.filter(p => (p.confidence || 0) >= minConfidence);
      const lowConfidenceCount = preview.products.length - highConfidenceProducts.length;

      if (lowConfidenceCount > 0) {
        console.warn(`${lowConfidenceCount} produit(s) ignoré(s) - confiance < ${minConfidence}%`);
      }

      if (highConfidenceProducts.length === 0) {
        throw new Error(`Aucun produit avec confiance >= ${minConfidence}%. Import automatique annulé.`);
      }

      // Étape 3: Import direct
      onProgress?.('Import automatique en cours...', 80);
      const filteredPreview: ImportPreview = {
        ...preview,
        products: highConfidenceProducts,
        summary: {
          ...preview.summary,
          totalProducts: highConfidenceProducts.length,
          newProducts: highConfidenceProducts.filter(p => p.isNew).length,
          updatedProducts: highConfidenceProducts.filter(p => p.isDuplicate).length,
        }
      };

      const result = await this.validateAndImport(filteredPreview, userId, true);
      
      onProgress?.('Import automatique terminé !', 100);
      return result;

    } catch (error) {
      console.error('Erreur lors de l\'import automatique:', error);
      throw error;
    }
  }

  /**
   * Import direct depuis texte/dictée
   */
  static async processTextAndImportDirectly(
    textInput: string,
    userId: string,
    minConfidence: number = 75,
    onProgress?: (step: string, progress: number) => void
  ): Promise<ImportResult> {
    onProgress?.('Analyse IA du texte...', 20);

    try {
      const preview = await this.processTextInput(textInput, userId);
      
      onProgress?.('Validation et import automatique...', 60);
      const highConfidenceProducts = preview.products.filter(p => (p.confidence || 0) >= minConfidence);
      
      if (highConfidenceProducts.length === 0) {
        throw new Error(`Aucun produit avec confiance >= ${minConfidence}%. Import automatique annulé.`);
      }

      const filteredPreview: ImportPreview = {
        ...preview,
        products: highConfidenceProducts
      };

      const result = await this.validateAndImport(filteredPreview, userId, true);
      onProgress?.('Import automatique terminé !', 100);
      return result;

    } catch (error) {
      console.error('Erreur lors de l\'import automatique texte:', error);
      throw error;
    }
  }

  /**
   * Traite plusieurs fichiers avec l'IA
   */
  static async processFiles(
    files: File[],
    userId: string,
    onProgress?: (step: string, progress: number) => void
  ): Promise<ImportPreview> {
    onProgress?.('Initialisation...', 0);

    try {
      // Étape 1: Lecture des fichiers
      onProgress?.('Lecture des fichiers...', 20);
      const filesContent = await Promise.all(
        files.map(file => this.readFileContent(file))
      );

      // Étape 2: Parsing IA initial
      onProgress?.('Analyse IA des données...', 40);
      const rawData = await this.parseFilesWithAI(files, filesContent, userId);

      // Étape 3: Validation et enrichissement
      onProgress?.('Validation et détection de doublons...', 60);
      const validatedData = await this.validateAndEnrichData(rawData, userId);

      // Étape 4: Génération de l'aperçu
      onProgress?.('Génération de l\'aperçu...', 80);
      const preview = await this.generatePreview(validatedData, files.map(f => f.name));

      onProgress?.('Terminé !', 100);
      return preview;

    } catch (error) {
      console.error('Erreur lors du traitement des fichiers:', error);
      throw new Error(`Erreur de traitement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Traite du texte libre avec l'IA
   */
  static async processTextInput(
    textInput: string,
    userId: string
  ): Promise<ImportPreview> {
    try {
      // Parsing du texte avec l'IA
      const rawData = await this.parseTextWithAI(textInput, userId);
      
      // Validation et enrichissement
      const validatedData = await this.validateAndEnrichData(rawData, userId);
      
      // Génération de l'aperçu
      const preview = await this.generatePreview(validatedData, undefined, textInput);
      
      return preview;

    } catch (error) {
      console.error('Erreur lors du traitement du texte:', error);
      throw new Error(`Erreur de traitement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Valide et importe les données dans Firestore
   */
  static async validateAndImport(
    preview: ImportPreview,
    userId: string,
    isAutoImport: boolean = false
  ): Promise<ImportResult> {
    try {
      let addedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      // Créer l'entrée d'historique
      const importHistoryRef = await addDoc(collection(db, 'import-history'), {
        timestamp: Timestamp.fromDate(new Date()),
        userId,
        userEmail: '', // À remplir depuis le contexte utilisateur
        productsCount: preview.products.length,
        success: false, // Sera mis à jour à la fin
        aiAnalysisLog: preview.aiAnalysis,
        rollbackAvailable: true,
        isAutoImport, // Marquer si c'est un import automatique
        autoImportSettings: isAutoImport ? {
          minConfidence: Math.min(...preview.products.map(p => p.confidence || 0)),
          avgConfidence: Math.round(preview.products.reduce((sum, p) => sum + (p.confidence || 0), 0) / preview.products.length),
          autoApproved: true
        } : undefined
      });

      // Traiter chaque produit
      for (const product of preview.products) {
        try {
          if (product.isDuplicate && product.duplicateId) {
            // Mettre à jour le produit existant
            const productRef = doc(db, 'stocks', product.duplicateId);
            await updateDoc(productRef, {
              quantite: product.quantite,
              prixAchat: product.prixAchat,
              prixVente: product.prixVente || product.prixAchat * 1.3,
              updatedAt: Timestamp.fromDate(new Date()),
              lastImportId: importHistoryRef.id
            });
            updatedCount++;
          } else if (product.isNew) {
            // Ajouter nouveau produit
            await addDoc(collection(db, 'stocks'), {
              ...product,
              createdAt: Timestamp.fromDate(new Date()),
              updatedAt: Timestamp.fromDate(new Date()),
              importId: importHistoryRef.id,
              prixVente: product.prixVente || product.prixAchat * 1.3,
              seuilAlerte: this.calculateAlertThreshold(product.quantite)
            });
            addedCount++;
          } else {
            skippedCount++;
          }
        } catch (productError) {
          console.error('Erreur lors de l\'import du produit:', product.nom, productError);
          skippedCount++;
        }
      }

      // Mettre à jour l'historique avec les résultats
      await updateDoc(importHistoryRef, {
        success: true,
        addedCount,
        updatedCount,
        skippedCount: skippedCount
      });

      // Créer les mouvements de stock pour les nouveaux produits
      await this.createStockMovements(preview.products.filter(p => p.isNew), importHistoryRef.id);

      return {
        success: true,
        addedCount,
        updatedCount,
        skippedCount,
        importId: importHistoryRef.id
      };

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      return {
        success: false,
        addedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        importId: ''
      };
    }
  }

  /**
   * Récupère l'historique des imports
   */
  static async getImportHistory(userId: string): Promise<ImportHistory[]> {
    try {
      // Requête simplifiée pour éviter l'erreur d'index composé
      // On fait d'abord la requête avec where seulement
      const historyQuery = query(
        collection(db, 'import-history'),
        where('userId', '==', userId),
        limit(50)
      );

      const snapshot = await getDocs(historyQuery);
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString()
      })) as ImportHistory[];

      // Trier côté client par timestamp décroissant
      return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      
      // Fallback : retourner un tableau vide plutôt que de faire planter l'app
      if (error instanceof Error && error.message.includes('index')) {
        console.warn('Index manquant pour l\'historique d\'import - retour d\'un historique vide');
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Parse les fichiers avec l'IA Gemini
   */
  private static async parseFilesWithAI(
    files: File[],
    filesContent: string[],
    userId: string
  ): Promise<ImportedProduct[]> {
    try {
      const prompt = `
Tu es un expert en import et structuration de données pour un système de gestion de stock de bar/restaurant.

Fichiers à analyser:
${files.map((file, index) => `
Fichier: ${file.name}
Contenu: ${filesContent[index].substring(0, 2000)}${filesContent[index].length > 2000 ? '...' : ''}
`).join('\n')}

MISSION:
1. Extraire tous les produits de ces fichiers
2. Structurer chaque produit au format JSON suivant:
{
  "nom": "string",
  "categorie": "vins-rouge|vins-blanc|vins-rose|spiritueux|liqueur|biere|soft|champagne",
  "quantite": number,
  "unite": "bouteille|litre|cl|piece",
  "prixAchat": number,
  "prixVente": number (optionnel),
  "fournisseur": "string" (optionnel),
  "description": "string" (optionnel),
  "confidence": number (0-100, confiance dans l'extraction)
}

RÈGLES IMPORTANTES:
- Identifier automatiquement la catégorie la plus appropriée
- Normaliser les noms de produits (pas de doublons, casse correcte)
- Convertir les unités en format standard
- Si prix de vente manquant, le calculer avec marge 30%
- Ignorer les lignes d'en-tête, totaux, ou données non-produits
- Attribuer un score de confiance pour chaque extraction

RETOUR: JSON Array des produits extraits uniquement, pas de texte additionnel.
`;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          data: { fileNames: files.map(f => f.name), contentLength: filesContent.join('').length },
          userId,
          action: 'import_parse'
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'analyse IA');
      }

      // Extraire le JSON de la réponse
      const products = this.extractJsonFromAIResponse(result.response);
      if (!Array.isArray(products)) {
        throw new Error('Format de réponse IA invalide');
      }

      return products.map(product => ({
        ...product,
        isNew: true,
        confidence: product.confidence || 80
      }));

    } catch (error) {
      console.error('Erreur lors du parsing IA:', error);
      throw error;
    }
  }

  /**
   * Parse du texte libre avec l'IA
   */
  private static async parseTextWithAI(
    textInput: string,
    userId: string
  ): Promise<ImportedProduct[]> {
    try {
      const prompt = `
Tu es un expert en import et structuration de données pour un système de gestion de stock de bar/restaurant.

Texte à analyser:
"${textInput}"

MISSION:
1. Extraire tous les produits mentionnés dans ce texte
2. Interpréter les quantités, prix, et informations produit
3. Structurer chaque produit au format JSON suivant:
{
  "nom": "string",
  "categorie": "vins-rouge|vins-blanc|vins-rose|spiritueux|liqueur|biere|soft|champagne",
  "quantite": number,
  "unite": "bouteille|litre|cl|piece",
  "prixAchat": number,
  "prixVente": number (optionnel),
  "fournisseur": "string" (optionnel),
  "description": "string" (optionnel),
  "confidence": number (0-100, confiance dans l'extraction)
}

RÈGLES:
- Identifier intelligemment les produits et leurs caractéristiques
- Comprendre le langage naturel ("J'ai reçu", "livraison de", etc.)
- Normaliser les noms et catégories
- Estimer les prix manquants selon le type de produit
- Attribuer un score de confiance réaliste

RETOUR: JSON Array des produits extraits uniquement.
`;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          data: { textInput, textLength: textInput.length },
          userId,
          action: 'import_text_parse'
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'analyse IA');
      }

      const products = this.extractJsonFromAIResponse(result.response);
      if (!Array.isArray(products)) {
        throw new Error('Format de réponse IA invalide');
      }

      return products.map(product => ({
        ...product,
        isNew: true,
        confidence: product.confidence || 75
      }));

    } catch (error) {
      console.error('Erreur lors du parsing texte IA:', error);
      throw error;
    }
  }

  /**
   * Valide et enrichit les données avec détection de doublons
   */
  private static async validateAndEnrichData(
    rawProducts: ImportedProduct[],
    userId: string
  ): Promise<ImportedProduct[]> {
    try {
      // Récupérer les produits existants
      const existingSnapshot = await getDocs(collection(db, 'stocks'));
      const existingProducts = existingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Product & { id: string })[];

      // Valider et enrichir chaque produit
      const validatedProducts = await Promise.all(
        rawProducts.map(async (product) => {
          // Validation des données
          const validationErrors = this.validateProduct(product);
          
          // Détection de doublons
          const duplicate = this.findDuplicate(product, existingProducts);
          
          // Enrichissement IA
          const enrichedProduct = await this.enrichProductWithAI(product, validationErrors);

          return {
            ...enrichedProduct,
            isDuplicate: !!duplicate,
            duplicateId: duplicate?.id,
            isNew: !duplicate
          };
        })
      );

      return validatedProducts;

    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      return rawProducts;
    }
  }

  /**
   * Génère l'aperçu complet de l'import
   */
  private static async generatePreview(
    products: ImportedProduct[],
    fileNames?: string[],
    textInput?: string
  ): Promise<ImportPreview> {
    const newProducts = products.filter(p => p.isNew).length;
    const updatedProducts = products.filter(p => p.isDuplicate).length;
    const duplicates = products.filter(p => p.isDuplicate).length;
    const errors = products.filter(p => (p.confidence || 0) < 50).length;

    // Génération des alertes
    const alerts: ImportAlert[] = [];
    
    if (errors > 0) {
      alerts.push({
        type: 'error',
        message: `${errors} produit(s) avec une confiance faible (<50%)`
      });
    }
    
    if (duplicates > 0) {
      alerts.push({
        type: 'warning',
        message: `${duplicates} doublon(s) détecté(s) - seront mis à jour`
      });
    }

    // Suggestions IA
    const suggestions = await this.generateAISuggestions(products);

    // Analyse d'impact
    const stockValue = products.reduce((sum, p) => sum + (p.prixAchat * p.quantite), 0);
    const newCategories = [...new Set(products.map(p => p.categorie))];
    
    return {
      products,
      summary: {
        totalProducts: products.length,
        newProducts,
        updatedProducts,
        duplicates,
        errors
      },
      alerts,
      suggestions,
      aiAnalysis: `Import de ${products.length} produits analysé par IA. Confiance moyenne: ${Math.round(products.reduce((sum, p) => sum + (p.confidence || 0), 0) / products.length)}%`,
      estimatedImpact: {
        stockValue,
        newCategories,
        potentialIssues: alerts.filter(a => a.type === 'error').map(a => a.message)
      }
    };
  }

  /**
   * Utilitaires privés
   */
  private static async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private static extractJsonFromAIResponse(response: string): any {
    try {
      console.log('Réponse IA brute:', response.substring(0, 500) + '...');
      
      // Nettoyer la réponse de base
      let cleanResponse = response
        .replace(/```json|```/g, '')
        .replace(/^[^[{]*/, '') // Supprimer tout avant le premier [ ou {
        .replace(/[^}\]]*$/, '') // Supprimer tout après le dernier } ou ]
        .trim();

      // Si la réponse contient du texte avant/après le JSON
      if (!cleanResponse.startsWith('[') && !cleanResponse.startsWith('{')) {
        // Chercher spécifiquement un array JSON
        const arrayMatch = response.match(/\[[\s\S]*?\]/);
        if (arrayMatch) {
          cleanResponse = arrayMatch[0];
        } else {
          // Chercher un objet JSON
          const objectMatch = response.match(/\{[\s\S]*?\}/);
          if (objectMatch) {
            cleanResponse = objectMatch[0];
          }
        }
      }

      // Nettoyer les caractères problématiques
      cleanResponse = cleanResponse
        .replace(/[\u0000-\u0019]+/g, '') // Supprimer caractères de contrôle
        .replace(/,(\s*[}\]])/g, '$1') // Supprimer virgules finales
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Ajouter guillemets aux clés si manquantes

      console.log('JSON nettoyé:', cleanResponse.substring(0, 300) + '...');

      // Essayer de parser
      const parsed = JSON.parse(cleanResponse);
      
      // Valider que c'est un array
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed && typeof parsed === 'object') {
        // Si c'est un objet, le mettre dans un array
        return [parsed];
      }
      
      throw new Error('Réponse IA ne contient pas d\'array valide');

    } catch (error) {
      console.error('Erreur lors de l\'extraction JSON:', error);
      console.error('Réponse problématique:', response);
      
      // Fallback: essayer d'extraire au moins quelques informations
      return this.fallbackExtraction(response);
    }
  }

  private static fallbackExtraction(response: string): any[] {
    console.log('Tentative d\'extraction de secours...');
    
    // Si tout échoue, essayer d'extraire des informations basiques
    const products = [];
    const lines = response.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Chercher des patterns simples comme "nom: quantité: prix"
      const match = line.match(/([^:,]+?)[\s:]*(\d+)[\s]*(?:bouteilles?|litres?|canettes?)?[\s:]*(\d+(?:\.\d+)?)[\s]*(?:euros?|€)?/i);
      if (match) {
        products.push({
          nom: match[1].trim(),
          quantite: parseInt(match[2]),
          prixAchat: parseFloat(match[3]),
          categorie: 'vins-rouge', // Défaut
          unite: 'bouteille',
          confidence: 50 // Faible confiance pour extraction de secours
        });
      }
    }
    
    if (products.length > 0) {
      console.log('Extraction de secours réussie:', products.length, 'produits');
      return products;
    }
    
    throw new Error('Impossible d\'extraire des données de la réponse IA');
  }

  private static validateProduct(product: ImportedProduct): string[] {
    const errors: string[] = [];
    
    if (!product.nom || product.nom.trim().length < 2) {
      errors.push('Nom de produit manquant ou trop court');
    }
    
    if (!product.categorie) {
      errors.push('Catégorie manquante');
    }
    
    if (!product.quantite || product.quantite <= 0) {
      errors.push('Quantité invalide');
    }
    
    if (!product.prixAchat || product.prixAchat <= 0) {
      errors.push('Prix d\'achat manquant ou invalide');
    }
    
    return errors;
  }

  private static findDuplicate(
    product: ImportedProduct,
    existingProducts: (Product & { id: string })[]
  ): (Product & { id: string }) | null {
    // Recherche par nom exact
    let duplicate = existingProducts.find(existing => 
      existing.nom.toLowerCase().trim() === product.nom.toLowerCase().trim()
    );
    
    if (duplicate) return duplicate;
    
    // Recherche par similarité
    duplicate = existingProducts.find(existing => {
      const similarity = this.calculateSimilarity(existing.nom, product.nom);
      return similarity > 0.8 && existing.categorie === product.categorie;
    });
    
    return duplicate || null;
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private static async enrichProductWithAI(
    product: ImportedProduct,
    validationErrors: string[]
  ): Promise<ImportedProduct> {
    // Pour l'instant, retourner le produit tel quel
    // Dans une version future, on peut enrichir avec l'IA
    return {
      ...product,
      aiSuggestions: validationErrors.length > 0 ? [`Erreurs détectées: ${validationErrors.join(', ')}`] : undefined
    };
  }

  private static async generateAISuggestions(products: ImportedProduct[]): Promise<string[]> {
    const suggestions: string[] = [];
    
    const categories = [...new Set(products.map(p => p.categorie))];
    if (categories.length > 5) {
      suggestions.push(`Vous importez ${categories.length} catégories différentes. Considérez regrouper certaines catégories similaires.`);
    }
    
    const lowConfidenceCount = products.filter(p => (p.confidence || 0) < 70).length;
    if (lowConfidenceCount > 0) {
      suggestions.push(`${lowConfidenceCount} produit(s) nécessitent une vérification manuelle avant import.`);
    }
    
    const highValueProducts = products.filter(p => p.prixAchat > 50).length;
    if (highValueProducts > 0) {
      suggestions.push(`${highValueProducts} produit(s) de valeur élevée détecté(s). Vérifiez les prix d'achat.`);
    }
    
    return suggestions;
  }

  private static calculateAlertThreshold(quantity: number): number {
    // Calcul du seuil d'alerte basé sur la quantité initiale
    if (quantity <= 5) return 1;
    if (quantity <= 20) return Math.floor(quantity * 0.2);
    return Math.floor(quantity * 0.1);
  }

  private static async createStockMovements(
    newProducts: ImportedProduct[],
    importId: string
  ): Promise<void> {
    try {
      const movements = newProducts.map(product => ({
        productName: product.nom,
        type: 'entree',
        quantity: product.quantite,
        reason: `Import IA - ${importId}`,
        createdAt: Timestamp.fromDate(new Date()),
        importId
      }));

      // Ajouter tous les mouvements
      await Promise.all(
        movements.map(movement => addDoc(collection(db, 'stock-movements'), movement))
      );
    } catch (error) {
      console.error('Erreur lors de la création des mouvements de stock:', error);
    }
  }
} 