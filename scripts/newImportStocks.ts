#!/usr/bin/env npx tsx

import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Types simplifiés et modernes
interface ModernProduct {
  id: string;
  nom: string;
  categorie: 'vins' | 'vin-rouge' | 'vin-blanc' | 'vin-rose' | 'spiritueux' | 'bieres' | 'softs' | 'jus' | 'eaux' | 'autres';
  type: 'vins' | 'general'; // Nouveau: distingue les vins du stock général
  quantite: number;
  unite: 'bouteille' | 'litre' | 'centilitre' | 'verre' | 'cannette' | 'piece';
  prixAchat: number;
  prixVente: number;
  
  // Prix spécifiques pour les vins
  prixVerre?: number;
  prixBouteille?: number;
  
  // Informations détaillées (optionnelles)
  description?: string;
  fournisseur?: string;
  seuilAlerte: number;
  isActive: boolean;
  
  // Métadonnées
  source: string; // 'vins' | 'boissons'
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface ImportStats {
  totalProcessed: number;
  vinsImported: number;
  generalImported: number;
  errors: string[];
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

console.log('🍷 === AMPHORE - NOUVEL IMPORT MODERNE === 🍷\n');

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
  
  categorizeProduct: (nom: string): 'vins' | 'vin-rouge' | 'vin-blanc' | 'vin-rose' | 'spiritueux' | 'bieres' | 'softs' | 'jus' | 'eaux' | 'autres' => {
    const nomLower = nom.toLowerCase();
    
    if (nomLower.includes('rouge') || nomLower.includes('red')) return 'vin-rouge';
    if (nomLower.includes('blanc') || nomLower.includes('white')) return 'vin-blanc';
    if (nomLower.includes('rosé') || nomLower.includes('rose')) return 'vin-rose';
    if (nomLower.includes('vin') || nomLower.includes('wine')) return 'vins';
    if (nomLower.includes('whisky') || nomLower.includes('vodka') || nomLower.includes('gin') || nomLower.includes('rhum')) return 'spiritueux';
    if (nomLower.includes('bière') || nomLower.includes('beer')) return 'bieres';
    if (nomLower.includes('jus') || nomLower.includes('juice')) return 'jus';
    if (nomLower.includes('eau') || nomLower.includes('water')) return 'eaux';
    if (nomLower.includes('coca') || nomLower.includes('pepsi') || nomLower.includes('sprite')) return 'softs';
    
    return 'autres';
  }
};

/**
 * Parser moderne pour le fichier des vins
 */
function parseVinsFile(): ModernProduct[] {
  console.log('🍷 Analyse du fichier des vins...');
  
  try {
    const filePath = 'src/donnees/L\'Almanach Montmartre - vins - coûts matières - 2024.xlsx';
    const workbook = XLSX.readFile(filePath);
    
    // Trouver la feuille correcte
    const sheetNames = workbook.SheetNames;
    console.log(`   📋 Feuilles disponibles: ${sheetNames.join(', ')}`);
    
    let worksheet;
    const possibleSheets = ['Actuels ', 'Actuels', 'Sheet1', 'Feuil1'];
    for (const sheetName of possibleSheets) {
      if (workbook.Sheets[sheetName]) {
        worksheet = workbook.Sheets[sheetName];
        console.log(`   ✅ Utilisation de la feuille: "${sheetName}"`);
        break;
      }
    }
    
    if (!worksheet) {
      console.log(`   ❌ Aucune feuille trouvée. Feuilles disponibles: ${sheetNames.join(', ')}`);
      return [];
    }
    
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`   📊 ${rawData.length} lignes trouvées`);
    
    const products: ModernProduct[] = [];
    let currentCategory: 'vins' | 'vin-rouge' | 'vin-blanc' | 'vin-rose' = 'vins';
    
    rawData.forEach((row: any, index) => {
      // Essayer différentes colonnes pour le nom
      const possibleNameColumns = ['__EMPTY', '__EMPTY_1', 'Produit', 'Nom', 'Article'];
      let nom = '';
      
      for (const col of possibleNameColumns) {
        if (row[col] && utils.cleanString(row[col])) {
          nom = utils.cleanString(row[col]);
          break;
        }
      }
      
      if (!nom || nom.length < 3) return;
      
      // Ignorer les en-têtes et catégories
      if (nom.includes('PU ACHAT') || nom.includes('COEFF') || nom.includes('Prix')) return;
      
      // Détecter les changements de catégorie
      if (nom.includes('Rouge') || nom.includes('ROUGE')) {
        currentCategory = 'vin-rouge';
        return;
      }
      if (nom.includes('Blanc') || nom.includes('BLANC')) {
        currentCategory = 'vin-blanc';
        return;
      }
      if (nom.includes('Rosé') || nom.includes('ROSE')) {
        currentCategory = 'vin-rose';
        return;
      }
      
      // Extraire les prix (essayer différentes colonnes)
      const priceColumns = Object.keys(row).filter(key => key.includes('EMPTY') || key.includes('Prix') || key.includes('VERRE') || key.includes('BOUTEILLE'));
      const prices = priceColumns.map(col => utils.toNumber(row[col])).filter(p => p > 0);
      
      if (prices.length === 0) return; // Ignorer si pas de prix
      
      const prixAchat = prices[0] || 0;
      const prixVente = prices[prices.length - 1] || prixAchat * 3;
      const prixVerre = prices.length >= 2 ? prices[1] : undefined;
      const prixBouteille = prices.length >= 3 ? prices[2] : prixVente;
      
      const product: ModernProduct = {
        id: uuidv4(),
        nom,
        categorie: currentCategory,
        type: 'vins',
        quantite: 0, // Sera mis à jour manuellement ou via import séparé
        unite: 'bouteille',
        prixAchat,
        prixVente,
        prixVerre,
        prixBouteille,
        seuilAlerte: 3,
        isActive: true,
        source: 'vins',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'new-import-script'
      };
      
      products.push(product);
    });
    
    console.log(`   ✅ ${products.length} vins traités avec succès`);
    return products;
    
  } catch (error) {
    console.error(`   ❌ Erreur lors du parsing des vins: ${error}`);
    return [];
  }
}

/**
 * Parser moderne pour le fichier des boissons (stock général)
 */
function parseBoissonsFile(): ModernProduct[] {
  console.log('🥤 Analyse du fichier des boissons...');
  
  try {
    const filePath = 'src/donnees/Stocks boisson juillet 2025.xlsx';
    const workbook = XLSX.readFile(filePath);
    
    const sheetNames = workbook.SheetNames;
    console.log(`   📋 Feuilles disponibles: ${sheetNames.join(', ')}`);
    
    let worksheet;
    const possibleSheets = ['Stocks et prix ', 'Stocks et prix', 'Sheet1', 'Feuil1'];
    for (const sheetName of possibleSheets) {
      if (workbook.Sheets[sheetName]) {
        worksheet = workbook.Sheets[sheetName];
        console.log(`   ✅ Utilisation de la feuille: "${sheetName}"`);
        break;
      }
    }
    
    if (!worksheet) {
      console.log(`   ❌ Aucune feuille trouvée. Feuilles disponibles: ${sheetNames.join(', ')}`);
      return [];
    }
    
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`   📊 ${rawData.length} lignes trouvées`);
    
    const products: ModernProduct[] = [];
    
    rawData.forEach((row: any) => {
      // Chercher le nom dans différentes colonnes
      const possibleNameColumns = ['__EMPTY', '__EMPTY_1', '__EMPTY_2', 'Produit', 'Article'];
      let nom = '';
      
      for (const col of possibleNameColumns) {
        if (row[col] && utils.cleanString(row[col])) {
          nom = utils.cleanString(row[col]);
          break;
        }
      }
      
      if (!nom || nom.length < 3) return;
      
      // Ignorer les en-têtes
      if (nom.includes('Quantité') || nom.includes('Prix') || nom.includes('Total')) return;
      
      // Extraire quantité et prix
      const quantiteColumns = Object.keys(row).filter(key => key.toLowerCase().includes('quantit'));
      const prixColumns = Object.keys(row).filter(key => key.toLowerCase().includes('prix') && key.toLowerCase().includes('ht'));
      
      const quantite = quantiteColumns.length > 0 ? utils.toNumber(row[quantiteColumns[0]]) : 0;
      const prixAchat = prixColumns.length > 0 ? utils.toNumber(row[prixColumns[0]]) : 0;
      
      // Ne garder que les produits avec des données significatives
      if (quantite === 0 && prixAchat === 0) return;
      
      const categorie = utils.categorizeProduct(nom);
      const unite = categorie === 'eaux' ? 'bouteille' : 
                   categorie === 'bieres' ? 'cannette' : 'piece';
      
      const product: ModernProduct = {
        id: uuidv4(),
        nom,
        categorie,
        type: 'general',
        quantite,
        unite,
        prixAchat,
        prixVente: prixAchat * 3.5, // Coefficient par défaut
        seuilAlerte: 5,
        isActive: true,
        source: 'boissons',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'new-import-script'
      };
      
      products.push(product);
    });
    
    console.log(`   ✅ ${products.length} boissons traitées avec succès`);
    return products;
    
  } catch (error) {
    console.error(`   ❌ Erreur lors du parsing des boissons: ${error}`);
    return [];
  }
}

/**
 * Import moderne vers Firebase avec organisation par type
 */
async function importToFirestore(products: ModernProduct[]): Promise<ImportStats> {
  console.log('\n🔥 Import vers Firebase...');
  
  const stats: ImportStats = {
    totalProcessed: 0,
    vinsImported: 0,
    generalImported: 0,
    errors: []
  };
  
  const batch = writeBatch(db);
  
  for (const product of products) {
    try {
      // Importer dans la collection 'products' avec une sous-collection par type
      const docRef = doc(db, 'products', product.id);
      batch.set(docRef, product);
      
      stats.totalProcessed++;
      
      if (product.type === 'vins') {
        stats.vinsImported++;
      } else {
        stats.generalImported++;
      }
      
      // Afficher le progrès
      if (stats.totalProcessed % 20 === 0) {
        console.log(`   📦 ${stats.totalProcessed}/${products.length} produits traités...`);
      }
      
    } catch (error) {
      stats.errors.push(`Erreur import ${product.nom}: ${error}`);
    }
  }
  
  // Valider le batch
  try {
    await batch.commit();
    console.log(`   ✅ Batch Firebase validé avec succès`);
  } catch (error) {
    stats.errors.push(`Erreur validation batch: ${error}`);
  }
  
  return stats;
}

/**
 * Script principal
 */
async function main() {
  try {
    console.log('🚀 Démarrage de l\'import moderne...\n');
    
    // Parser les deux fichiers
    const vins = parseVinsFile();
    const boissons = parseBoissonsFile();
    const allProducts = [...vins, ...boissons];
    
    console.log('\n📊 === RÉSUMÉ DU PARSING ===');
    console.log(`🍷 Vins: ${vins.length}`);
    console.log(`🥤 Boissons: ${boissons.length}`);
    console.log(`📦 Total: ${allProducts.length}`);
    
    if (allProducts.length === 0) {
      console.log('❌ Aucun produit à importer !');
      return;
    }
    
    // Afficher quelques exemples
    console.log('\n🔍 Exemples de produits traités:');
    allProducts.slice(0, 3).forEach(p => {
      console.log(`   • ${p.nom} (${p.type}) - ${p.categorie} - ${p.prixAchat}€/${p.prixVente}€`);
    });
    
    // Import vers Firebase
    const stats = await importToFirestore(allProducts);
    
    // Résultats finaux
    console.log('\n🎉 === IMPORT TERMINÉ === 🎉');
    console.log(`📦 Total traité: ${stats.totalProcessed}`);
    console.log(`🍷 Vins importés: ${stats.vinsImported}`);
    console.log(`🥤 Stock général: ${stats.generalImported}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n❌ Erreurs (${stats.errors.length}):`);
      stats.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    console.log('\n✅ Ton nouveau système de stock est prêt !');
    console.log('🔄 Données organisées par type: vins et stock général');
    console.log('⚡ Prêt pour la synchronisation temps réel');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();