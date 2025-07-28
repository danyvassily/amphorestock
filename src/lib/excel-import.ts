/**
 * Utilitaires pour l'import de données Excel vers Firestore
 * 
 * Ce fichier contient les fonctions et structures pour importer
 * les données existantes de vins et boissons depuis des fichiers Excel
 * vers la base de données Firestore.
 */

import { collection, addDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Product, ProductCategory, ProductUnit } from '@/types';

// Structure attendue pour les données Excel des vins
interface ExcelVinData {
  nom: string;
  categorie: string;
  quantite: number;
  unite: string;
  prixAchat: number;
  prixVente: number;
  prixVerre?: number;
  fournisseur?: string;
  description?: string;
  annee?: string;
  region?: string;
}

// Structure attendue pour les données Excel des boissons
interface ExcelBoissonData {
  nom: string;
  categorie: string;
  quantite: number;
  unite: string;
  prixAchat: number;
  prixVente: number;
  seuilAlerte: number;
  fournisseur?: string;
  marque?: string;
  contenance?: string;
}

/**
 * Convertit une chaîne de caractère de catégorie Excel vers le type ProductCategory
 */
export function normalizeCategory(category: string): ProductCategory {
  const normalizedCategory = category.toLowerCase().trim();
  
  switch (normalizedCategory) {
    case 'vin':
    case 'vins':
    case 'wine':
      return 'vins';
    case 'spiritueux':
    case 'alcool':
    case 'spirits':
      return 'spiritueux';
    case 'biere':
    case 'bieres':
    case 'bière':
    case 'bières':
    case 'beer':
      return 'bieres';
    case 'soft':
    case 'softs':
    case 'soda':
    case 'sodas':
      return 'softs';
    case 'jus':
    case 'juice':
      return 'jus';
    case 'eau':
    case 'eaux':
    case 'water':
      return 'eaux';
    case 'cocktail':
    case 'cocktails':
      return 'cocktails';
    default:
      return 'autres';
  }
}

/**
 * Convertit une chaîne de caractère d'unité Excel vers le type ProductUnit
 */
export function normalizeUnit(unit: string): ProductUnit {
  const normalizedUnit = unit.toLowerCase().trim();
  
  switch (normalizedUnit) {
    case 'bouteille':
    case 'bouteilles':
    case 'bottle':
    case 'btl':
      return 'bouteille';
    case 'litre':
    case 'litres':
    case 'l':
    case 'liter':
      return 'litre';
    case 'centilitre':
    case 'centilitres':
    case 'cl':
      return 'centilitre';
    case 'verre':
    case 'verres':
    case 'glass':
      return 'verre';
    case 'cannette':
    case 'cannettes':
    case 'can':
      return 'cannette';
    case 'piece':
    case 'pieces':
    case 'pièce':
    case 'pièces':
    case 'pc':
      return 'piece';
    case 'kilogramme':
    case 'kg':
    case 'kilo':
      return 'kilogramme';
    case 'gramme':
    case 'grammes':
    case 'g':
      return 'gramme';
    default:
      return 'piece';
  }
}

/**
 * Convertit les données Excel de vins vers le format Product
 */
export function excelVinToProduct(
  vinData: ExcelVinData, 
  createdBy: string
): Omit<Product, 'id'> {
  return {
    name: vinData.nom.trim(),
    category: normalizeCategory(vinData.categorie),
    subcategory: vinData.region || undefined,
    quantity: Math.max(0, vinData.quantite || 0),
    unit: normalizeUnit(vinData.unite),
    prixAchat: Math.max(0, vinData.prixAchat || 0),
    prixVente: Math.max(0, vinData.prixVente || 0),
    prixVerre: vinData.prixVerre && vinData.prixVerre > 0 ? vinData.prixVerre : undefined,
    description: vinData.description || `${vinData.nom}${vinData.annee ? ` ${vinData.annee}` : ''}`,
    fournisseur: vinData.fournisseur || undefined,
    seuilAlerte: 5, // Valeur par défaut pour les vins
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy
  };
}

/**
 * Convertit les données Excel de boissons vers le format Product
 */
export function excelBoissonToProduct(
  boissonData: ExcelBoissonData, 
  createdBy: string
): Omit<Product, 'id'> {
  return {
    name: boissonData.nom.trim(),
    category: normalizeCategory(boissonData.categorie),
    subcategory: boissonData.marque || undefined,
    quantity: Math.max(0, boissonData.quantite || 0),
    unit: normalizeUnit(boissonData.unite),
    prixAchat: Math.max(0, boissonData.prixAchat || 0),
    prixVente: Math.max(0, boissonData.prixVente || 0),
    description: boissonData.contenance ? 
      `${boissonData.nom} - ${boissonData.contenance}` : 
      boissonData.nom,
    fournisseur: boissonData.fournisseur || undefined,
    seuilAlerte: Math.max(0, boissonData.seuilAlerte || 10),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy
  };
}

/**
 * Importe une liste de produits vers Firestore par batch
 */
export async function importProductsToFirestore(
  products: Omit<Product, 'id'>[],
  batchSize: number = 100
): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;
  
  // Diviser en batches pour éviter les limites de Firestore
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = writeBatch(db);
    const currentBatch = products.slice(i, i + batchSize);
    
    try {
      currentBatch.forEach((product) => {
        const docRef = collection(db, 'products');
        batch.set(docRef, product);
      });
      
      await batch.commit();
      success += currentBatch.length;
      
      console.log(`Batch ${Math.floor(i / batchSize) + 1} importé avec succès (${currentBatch.length} produits)`);
    } catch (error) {
      console.error('Erreur lors de l\'import du batch:', error);
      errors += currentBatch.length;
    }
  }
  
  return { success, errors };
}

/**
 * Vérifie si des produits existent déjà dans Firestore
 */
export async function checkExistingProducts(): Promise<number> {
  try {
    const productsSnapshot = await getDocs(collection(db, 'products'));
    return productsSnapshot.size;
  } catch (error) {
    console.error('Erreur lors de la vérification des produits existants:', error);
    return 0;
  }
}

/**
 * Exemple de données pour tester l'import
 */
export const SAMPLE_VINS_DATA: ExcelVinData[] = [
  {
    nom: "Château Margaux",
    categorie: "vins",
    quantite: 12,
    unite: "bouteille",
    prixAchat: 180,
    prixVente: 220,
    prixVerre: 25,
    fournisseur: "Caviste Martin",
    annee: "2019",
    region: "Bordeaux"
  },
  {
    nom: "Chablis Premier Cru",
    categorie: "vins",
    quantite: 8,
    unite: "bouteille",
    prixAchat: 35,
    prixVente: 45,
    prixVerre: 8,
    fournisseur: "Domaine Dupont",
    annee: "2022",
    region: "Bourgogne"
  }
];

export const SAMPLE_BOISSONS_DATA: ExcelBoissonData[] = [
  {
    nom: "Hendricks Gin",
    categorie: "spiritueux",
    quantite: 6,
    unite: "bouteille",
    prixAchat: 35,
    prixVente: 45,
    seuilAlerte: 3,
    fournisseur: "Distrib Pro",
    marque: "Hendricks",
    contenance: "70cl"
  },
  {
    nom: "Coca-Cola",
    categorie: "softs",
    quantite: 24,
    unite: "cannette",
    prixAchat: 1.2,
    prixVente: 3,
    seuilAlerte: 20,
    fournisseur: "Metro",
    marque: "Coca-Cola",
    contenance: "33cl"
  }
];

/**
 * Fonction principale d'import pour initialiser la base de données
 */
export async function initializeDatabase(userId: string): Promise<{
  success: boolean;
  message: string;
  stats: { vins: number; boissons: number; errors: number };
}> {
  try {
    // Vérifier si la base contient déjà des produits
    const existingCount = await checkExistingProducts();
    if (existingCount > 0) {
      return {
        success: false,
        message: `La base de données contient déjà ${existingCount} produits`,
        stats: { vins: 0, boissons: 0, errors: 0 }
      };
    }
    
    // Convertir les données d'exemple
    const vinsProducts = SAMPLE_VINS_DATA.map(vin => excelVinToProduct(vin, userId));
    const boissonsProducts = SAMPLE_BOISSONS_DATA.map(boisson => excelBoissonToProduct(boisson, userId));
    
    // Importer les produits
    const allProducts = [...vinsProducts, ...boissonsProducts];
    const importResult = await importProductsToFirestore(allProducts);
    
    return {
      success: importResult.errors === 0,
      message: `Import terminé: ${importResult.success} produits importés, ${importResult.errors} erreurs`,
      stats: {
        vins: vinsProducts.length,
        boissons: boissonsProducts.length,
        errors: importResult.errors
      }
    };
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    return {
      success: false,
      message: 'Erreur lors de l\'initialisation de la base de données',
      stats: { vins: 0, boissons: 0, errors: 1 }
    };
  }
}

/**
 * Instructions pour l'import de fichiers Excel réels
 * 
 * Pour importer vos propres fichiers Excel :
 * 
 * 1. Convertissez vos fichiers Excel en JSON ou CSV
 * 2. Adaptez les interfaces ExcelVinData et ExcelBoissonData selon vos colonnes
 * 3. Utilisez les fonctions de normalisation pour mapper vos données
 * 4. Appelez importProductsToFirestore avec vos données converties
 * 
 * Exemple avec une librairie comme xlsx :
 * 
 * ```typescript
 * import * as XLSX from 'xlsx';
 * 
 * // Lire le fichier Excel
 * const workbook = XLSX.readFile('vos-vins.xlsx');
 * const worksheet = workbook.Sheets[workbook.SheetNames[0]];
 * const excelData = XLSX.utils.sheet_to_json(worksheet);
 * 
 * // Convertir et importer
 * const products = excelData.map(row => excelVinToProduct(row, userId));
 * await importProductsToFirestore(products);
 * ```
 */ 