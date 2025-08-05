#!/usr/bin/env npx tsx

import * as XLSX from 'xlsx';
import fuzzysort from 'fuzzysort';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Types pour l'import
interface ExcelRow {
  nomOrigine: string;
  nomOfficiel: string;
  categorie: string;
  quantite: number;
}

interface ImportLogEntry {
  action: 'updated' | 'created' | 'skipped' | 'error';
  nomOrigine: string;
  nomOfficiel: string;
  categorie: string;
  quantite: number;
  productId?: string;
  oldQuantity?: number;
  newQuantity?: number;
  matchScore?: number;
  matchedWith?: string;
  error?: string;
}

interface ImportResult {
  totalProcessed: number;
  updated: number;
  created: number;
  skipped: number;
  errors: number;
  logs: ImportLogEntry[];
}

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDx4gKFQtbDFqhZDpZ6gFEJ7JhPeSXPhEc",
  authDomain: "amphore-stock.firebaseapp.com",
  projectId: "amphore-stock",
  storageBucket: "amphore-stock.firebasestorage.app",
  messagingSenderId: "698312579475",
  appId: "1:698312579475:web:f650d691e1ed210e93b066",
  measurementId: "G-7LMYPEWM0T"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🍷 === AMPHORE - IMPORT STOCK AOÛT 2025 === 🍷\n');

/**
 * Utilitaires de nettoyage et validation
 */
const utils = {
  cleanString: (str: any): string => {
    if (!str || typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ');
  },
  
  toNumber: (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(',', '.'));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  },
  
  normalizeCategory: (categorie: string): string => {
    const cat = categorie.toLowerCase().trim();
    
    // Mapping des catégories communes
    const categoryMapping: Record<string, string> = {
      'vins rouge': 'vin-rouge',
      'vin rouge': 'vin-rouge',
      'rouge': 'vin-rouge',
      'vins blanc': 'vin-blanc',
      'vin blanc': 'vin-blanc',
      'blanc': 'vin-blanc',
      'vins rosé': 'vin-rose',
      'vin rosé': 'vin-rose',
      'rosé': 'vin-rose',
      'rose': 'vin-rose',
      'spiritueux': 'spiritueux',
      'alcool': 'spiritueux',
      'bières': 'bieres',
      'biere': 'bieres',
      'beer': 'bieres',
      'softs': 'softs',
      'soda': 'softs',
      'jus': 'jus',
      'juice': 'jus',
      'eaux': 'eaux',
      'eau': 'eaux',
      'water': 'eaux',
      'cocktails': 'cocktails',
      'autres': 'autres'
    };
    
    return categoryMapping[cat] || 'autres';
  }
};

/**
 * Lire et analyser le fichier Excel d'août 2025
 */
function parseExcelFile(): ExcelRow[] {
  console.log('📊 Analyse du fichier Excel d\'août 2025...');
  
  try {
    const filePath = 'src/donnees/Stocks boissons août 2025 .xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`   📋 ${data.length} lignes trouvées dans le fichier`);
    
    const products: ExcelRow[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      
      // Identifier automatiquement les colonnes (flexible)
      let nomOrigine = '';
      let nomOfficiel = '';
      let categorie = '';
      let quantite = 0;
      
      // Recherche des colonnes par mots-clés
      const keys = Object.keys(row);
      
      for (const key of keys) {
        const keyLower = key.toLowerCase();
        
        if (keyLower.includes('origine') || keyLower.includes('court') || keyLower.includes('historique')) {
          nomOrigine = utils.cleanString(row[key]);
        } else if (keyLower.includes('officiel') || keyLower.includes('complet') || keyLower.includes('corrigé')) {
          nomOfficiel = utils.cleanString(row[key]);
        } else if (keyLower.includes('catégorie') || keyLower.includes('categorie') || keyLower.includes('type')) {
          categorie = utils.cleanString(row[key]);
        } else if (keyLower.includes('quantité') || keyLower.includes('quantite') || keyLower.includes('stock')) {
          quantite = utils.toNumber(row[key]);
        }
      }
      
      // Si pas de nom officiel, utiliser le nom d'origine
      if (!nomOfficiel && nomOrigine) {
        nomOfficiel = nomOrigine;
      }
      
      // Validation
      if (!nomOfficiel || quantite < 0) {
        console.log(`   ⚠️  Ligne ${i + 2} ignorée: nom manquant ou quantité invalide`);
        continue;
      }
      
      products.push({
        nomOrigine: nomOrigine || nomOfficiel,
        nomOfficiel,
        categorie: utils.normalizeCategory(categorie),
        quantite
      });
    }
    
    console.log(`   ✅ ${products.length} produits valides extraits`);
    return products;
    
  } catch (error) {
    console.error(`   ❌ Erreur lors de la lecture du fichier: ${error}`);
    return [];
  }
}

/**
 * Récupérer tous les produits existants de Firebase
 */
async function getExistingProducts(): Promise<any[]> {
  console.log('🔍 Récupération des produits existants...');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`   📦 ${products.length} produits trouvés dans Firebase`);
    return products;
    
  } catch (error) {
    console.error(`   ❌ Erreur lors de la récupération: ${error}`);
    return [];
  }
}

/**
 * Chercher une correspondance pour un produit Excel
 */
function findProductMatch(excelProduct: ExcelRow, existingProducts: any[]): { product: any; score: number; matchType: string } | null {
  
  // 1. Correspondance exacte sur nom officiel
  let exactMatch = existingProducts.find(p => 
    p.nom && p.nom.toLowerCase().trim() === excelProduct.nomOfficiel.toLowerCase().trim()
  );
  
  if (exactMatch) {
    return { product: exactMatch, score: 1.0, matchType: 'exact_officiel' };
  }
  
  // 2. Correspondance exacte sur nom d'origine
  exactMatch = existingProducts.find(p => 
    p.nom && p.nom.toLowerCase().trim() === excelProduct.nomOrigine.toLowerCase().trim()
  );
  
  if (exactMatch) {
    return { product: exactMatch, score: 1.0, matchType: 'exact_origine' };
  }
  
  // 3. Fuzzy matching avec fuzzysort
  const searchTargets = existingProducts.map(p => ({
    product: p,
    searchText: p.nom || ''
  }));
  
  // Chercher avec nom officiel
  const officielResults = fuzzysort.go(excelProduct.nomOfficiel, searchTargets, {
    key: 'searchText',
    threshold: -10000 // Seuil très permissif
  });
  
  // Chercher avec nom d'origine
  const origineResults = fuzzysort.go(excelProduct.nomOrigine, searchTargets, {
    key: 'searchText',
    threshold: -10000
  });
  
  // Combiner et trier tous les résultats
  const allResults = [...officielResults, ...origineResults];
  
  if (allResults.length === 0) {
    return null;
  }
  
  // Trier par score et filtrer par catégorie si possible
  const sortedResults = allResults
    .map(result => ({
      product: result.obj.product,
      score: result.score,
      normalizedScore: Math.max(0, (result.score + 1000) / 1000), // Normaliser le score
      matchType: 'fuzzy'
    }))
    .sort((a, b) => b.score - a.score);
  
  // Filtrer par catégorie si définie
  const categoryFiltered = sortedResults.filter(result => {
    if (!excelProduct.categorie || excelProduct.categorie === 'autres') {
      return true; // Pas de filtre de catégorie
    }
    return result.product.categorie === excelProduct.categorie;
  });
  
  const finalResults = categoryFiltered.length > 0 ? categoryFiltered : sortedResults;
  const bestMatch = finalResults[0];
  
  // Seuil de confiance minimum
  if (bestMatch.normalizedScore < 0.3) {
    return null;
  }
  
  return bestMatch;
}

/**
 * Créer un nouveau produit
 */
function createNewProduct(excelProduct: ExcelRow): any {
  const id = uuidv4();
  const now = new Date();
  
  return {
    id,
    nom: excelProduct.nomOfficiel,
    categorie: excelProduct.categorie,
    type: excelProduct.categorie.includes('vin') ? 'vins' : 'general',
    quantite: excelProduct.quantite,
    unite: 'bouteille', // Par défaut
    prixAchat: 0, // À définir plus tard
    prixVente: 0, // À définir plus tard
    seuilAlerte: 5, // Par défaut
    isActive: true,
    source: 'import-aout-2025',
    createdAt: now,
    updatedAt: now,
    createdBy: 'import-script'
  };
}

/**
 * Traiter l'import avec correspondances intelligentes
 */
async function processImport(): Promise<ImportResult> {
  const result: ImportResult = {
    totalProcessed: 0,
    updated: 0,
    created: 0,
    skipped: 0,
    errors: 0,
    logs: []
  };
  
  console.log('\n🚀 Début du traitement...');
  
  // Récupérer les données
  const excelProducts = parseExcelFile();
  const existingProducts = await getExistingProducts();
  
  if (excelProducts.length === 0) {
    console.log('❌ Aucun produit à traiter');
    return result;
  }
  
  const batch = writeBatch(db);
  let batchCount = 0;
  
  for (const excelProduct of excelProducts) {
    result.totalProcessed++;
    
    try {
      console.log(`\n📦 [${result.totalProcessed}/${excelProducts.length}] ${excelProduct.nomOfficiel}`);
      
      // Chercher une correspondance
      const match = findProductMatch(excelProduct, existingProducts);
      
      if (match) {
        // Mise à jour du produit existant
        const productRef = doc(db, 'products', match.product.id);
        const oldQuantity = match.product.quantite || 0;
        
        batch.update(productRef, {
          quantite: excelProduct.quantite,
          updatedAt: new Date(),
          modifiedBy: 'import-aout-2025'
        });
        
        result.updated++;
        result.logs.push({
          action: 'updated',
          nomOrigine: excelProduct.nomOrigine,
          nomOfficiel: excelProduct.nomOfficiel,
          categorie: excelProduct.categorie,
          quantite: excelProduct.quantite,
          productId: match.product.id,
          oldQuantity,
          newQuantity: excelProduct.quantite,
          matchScore: match.score,
          matchedWith: match.product.nom
        });
        
        console.log(`   ✅ Mis à jour: ${match.product.nom} (${match.matchType}, score: ${match.score.toFixed(2)})`);
        console.log(`   📊 Quantité: ${oldQuantity} → ${excelProduct.quantite}`);
        
      } else {
        // Créer un nouveau produit
        const newProduct = createNewProduct(excelProduct);
        const productRef = doc(db, 'products', newProduct.id);
        
        batch.set(productRef, newProduct);
        
        result.created++;
        result.logs.push({
          action: 'created',
          nomOrigine: excelProduct.nomOrigine,
          nomOfficiel: excelProduct.nomOfficiel,
          categorie: excelProduct.categorie,
          quantite: excelProduct.quantite,
          productId: newProduct.id,
          newQuantity: excelProduct.quantite
        });
        
        console.log(`   🆕 Nouveau produit créé: ${newProduct.nom}`);
        console.log(`   📊 Quantité: ${excelProduct.quantite}`);
      }
      
      batchCount++;
      
      // Commit du batch toutes les 500 opérations
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`   💾 Batch de ${batchCount} opérations committé`);
        batchCount = 0;
      }
      
    } catch (error) {
      result.errors++;
      result.logs.push({
        action: 'error',
        nomOrigine: excelProduct.nomOrigine,
        nomOfficiel: excelProduct.nomOfficiel,
        categorie: excelProduct.categorie,
        quantite: excelProduct.quantite,
        error: String(error)
      });
      
      console.log(`   ❌ Erreur: ${error}`);
    }
  }
  
  // Commit du batch final
  if (batchCount > 0) {
    await batch.commit();
    console.log(`   💾 Batch final de ${batchCount} opérations committé`);
  }
  
  return result;
}

/**
 * Générer un rapport détaillé
 */
function generateReport(result: ImportResult): void {
  console.log('\n📊 === RAPPORT D\'IMPORT === \n');
  console.log(`📦 Total traité: ${result.totalProcessed}`);
  console.log(`✅ Mis à jour: ${result.updated}`);
  console.log(`🆕 Créés: ${result.created}`);
  console.log(`⏭️  Ignorés: ${result.skipped}`);
  console.log(`❌ Erreurs: ${result.errors}`);
  
  if (result.logs.length > 0) {
    console.log('\n📋 === DÉTAILS DES OPÉRATIONS === \n');
    
    // Grouper par action
    const groupedLogs = result.logs.reduce((acc, log) => {
      if (!acc[log.action]) acc[log.action] = [];
      acc[log.action].push(log);
      return acc;
    }, {} as Record<string, ImportLogEntry[]>);
    
    // Afficher les mises à jour
    if (groupedLogs.updated) {
      console.log('🔄 Produits mis à jour:');
      groupedLogs.updated.forEach(log => {
        console.log(`   • ${log.nomOfficiel} → Qté: ${log.oldQuantity} → ${log.newQuantity} (match: ${log.matchedWith}, score: ${log.matchScore?.toFixed(2)})`);
      });
      console.log('');
    }
    
    // Afficher les créations
    if (groupedLogs.created) {
      console.log('🆕 Nouveaux produits:');
      groupedLogs.created.forEach(log => {
        console.log(`   • ${log.nomOfficiel} (${log.categorie}) → Qté: ${log.newQuantity}`);
      });
      console.log('');
    }
    
    // Afficher les erreurs
    if (groupedLogs.error) {
      console.log('❌ Erreurs:');
      groupedLogs.error.forEach(log => {
        console.log(`   • ${log.nomOfficiel}: ${log.error}`);
      });
      console.log('');
    }
  }
  
  console.log('🎉 Import terminé avec succès!\n');
}

/**
 * Script principal
 */
async function main() {
  try {
    const startTime = Date.now();
    
    const result = await processImport();
    generateReport(result);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`⏱️  Durée totale: ${duration.toFixed(2)} secondes`);
    
  } catch (error) {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  }
}

// Lancer le script si appelé directement
if (require.main === module) {
  main().catch(console.error);
}