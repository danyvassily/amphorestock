#!/usr/bin/env npx tsx

import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Product, ImportResult } from '../src/types';

// Configuration Firebase (même que dans l'app)
const firebaseConfig = {
  apiKey: "AIzaSyDx4gKFQtbDFqhZDpZ6gFEJ7JhPeSXPhEc",
  authDomain: "amphore-stock.firebaseapp.com",
  projectId: "amphore-stock",
  storageBucket: "amphore-stock.firebasestorage.app",
  messagingSenderId: "698312579475",
  appId: "1:698312579475:web:f650d691e1ed210e93b066",
  measurementId: "G-7LMYPEWM0T"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🍷 === AMPHORE - Import des stocks === 🍷\n');

/**
 * Nettoie et normalise une chaîne de caractères
 */
function cleanString(str: any): string {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Convertit une valeur en nombre, en gérant les cas d'erreur
 */
function toNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(',', '.'));
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * Parse le fichier des vins
 */
function parseVinsFile(): Product[] {
  console.log('📋 Parsing du fichier vins...');
  
  const filePath = 'src/donnees/L\'Almanach Montmartre - vins - coûts matières - 2024.xlsx';
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets['Actuels ']; // Note l'espace à la fin
  const rawData = XLSX.utils.sheet_to_json(worksheet);
  
  const products: Product[] = [];
  let currentCategory = 'vins';
  
  rawData.forEach((row: any, index) => {
    // Récupérer le nom du produit (première colonne)
    const nom = cleanString(row.__EMPTY);
    
    // Ignorer les lignes d'en-tête ou vides
    if (!nom || nom.includes('PU ACHAT') || nom.includes('COEFF') || nom.length < 5 ||
        nom === 'Rouges' || nom === 'Blancs' || nom === 'Rosés' || nom === 'Bulles' || nom === 'Orange') {
      // Détecter les catégories
      if (nom && (nom.includes('Rouge') || nom.includes('Blanc') || nom.includes('Rosé') || nom.includes('Bulle') || nom.includes('Orange'))) {
        currentCategory = nom.toLowerCase().includes('rouge') ? 'vin-rouge' :
                         nom.toLowerCase().includes('blanc') ? 'vin-blanc' : 
                         nom.toLowerCase().includes('rosé') ? 'vin-rose' :
                         nom.toLowerCase().includes('bulle') ? 'vins' : 'vins';
      }
      return;
    }
    
    // Extraire les données AU VERRE
    const auVerre = {
      prixAchatHT: toNumber(row['AU VERRE']),
      prixAchatTTC: toNumber(row.__EMPTY_1),
      prixVenteHT: toNumber(row.__EMPTY_2),
      prixVenteTTC: toNumber(row.__EMPTY_4)
    };
    
    // Extraire les données A LA BOUTEILLE
    const aLaBouteille = {
      prixAchatHT: toNumber(row['A LA BOUTEILLE ']),
      prixAchatTTC: toNumber(row.__EMPTY_6),
      prixVenteHT: toNumber(row.__EMPTY_7),
      prixVenteTTC: toNumber(row.__EMPTY_9)
    };
    
    // Créer le produit de base
    const product: any = {
      id: uuidv4(),
      nom,
      categorie: currentCategory as any,
      quantite: 0, // À ajuster manuellement ou via un autre import
      unite: 'bouteille',
      prixAchat: aLaBouteille.prixAchatTTC || auVerre.prixAchatTTC || 0,
      prixVente: aLaBouteille.prixVenteTTC || auVerre.prixVenteTTC || 0,
      seuilAlerte: 3, // Seuil par défaut
      source: 'vins',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'import-script'
    };
    
    // Ajouter les champs optionnels seulement s'ils ont des valeurs
    if (auVerre.prixAchatHT > 0) {
      product.auVerre = auVerre;
      product.prixVerre = auVerre.prixVenteTTC;
    }
    
    if (aLaBouteille.prixAchatHT > 0) {
      product.aLaBouteille = aLaBouteille;
      product.prixBouteille = aLaBouteille.prixVenteTTC;
    }
    
    products.push(product);
  });
  
  console.log(`   ✅ ${products.length} vins parsés`);
  return products;
}

/**
 * Parse le fichier des boissons
 */
function parseBoissonsFile(): Product[] {
  console.log('📋 Parsing du fichier boissons...');
  
  const filePath = 'src/donnees/Stocks boisson juillet 2025.xlsx';
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets['Stocks et prix '];
  const rawData = XLSX.utils.sheet_to_json(worksheet);
  
  const products: Product[] = [];
  let currentCategory = 'softs';
  
  rawData.forEach((row: any) => {
    // Essayer les deux colonnes principales pour le nom
    let nom = cleanString(row.__EMPTY) || cleanString(row.__EMPTY_2);
    
    // Ignorer les lignes d'en-tête ou vides
    if (!nom || nom.length < 3) return;
    
    // Détecter les catégories
    if (nom.includes('Blanc') || nom.includes('blanc')) {
      currentCategory = 'vin-blanc';
      return;
    }
    if (nom.includes('Soft') || nom.includes('soft')) {
      currentCategory = 'softs';
      return;
    }
    if (nom.includes('Bière') || nom.includes('biere')) {
      currentCategory = 'bieres';
      return;
    }
    if (nom.includes('Eau') || nom.includes('eau')) {
      currentCategory = 'eaux';
      return;
    }
    
    // Extraire les données de prix et quantité
    const quantite = toNumber(row['Quantité ']) || toNumber(row['Quantité_1']) || 0;
    const prixHT = toNumber(row['Prix HT']) || toNumber(row['Prix HT_1']) || 0;
    const valeurTotale = toNumber(row['Valeur totale ']) || toNumber(row['Valeur totale _1']) || 0;
    
    // Si on a des données significatives
    if (prixHT > 0 || quantite > 0 || valeurTotale > 0) {
      const product: Product = {
        id: uuidv4(),
        nom,
        categorie: currentCategory as any,
        quantite,
        unite: currentCategory === 'eaux' ? 'bouteille' : 
               currentCategory === 'bieres' ? 'cannette' : 'piece',
        prixAchat: prixHT,
        prixVente: prixHT * 3.5, // Coefficient par défaut
        seuilAlerte: 5, // Seuil par défaut
        source: 'boissons',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'import-script'
      };
      
      products.push(product);
    }
  });
  
  console.log(`   ✅ ${products.length} boissons parsées`);
  return products;
}

/**
 * Importe les produits dans Firestore
 */
async function importToFirestore(products: Product[]): Promise<ImportResult> {
  console.log('\n🔥 Import vers Firestore...');
  
  const errors: string[] = [];
  let importedCount = 0;
  let boissonsCount = 0;
  let vinsCount = 0;
  
  // Optionnel: nettoyer la collection existante
  console.log('   🧹 Nettoyage de la collection stocks...');
  const existingDocs = await getDocs(collection(db, 'stocks'));
  for (const docSnapshot of existingDocs.docs) {
    await deleteDoc(doc(db, 'stocks', docSnapshot.id));
  }
  
  // Importer les nouveaux produits
  for (const product of products) {
    try {
      await setDoc(doc(db, 'stocks', product.id), product);
      importedCount++;
      
      if (product.source === 'boissons') boissonsCount++;
      if (product.source === 'vins') vinsCount++;
      
      if (importedCount % 10 === 0) {
        console.log(`   📦 ${importedCount}/${products.length} produits importés...`);
      }
    } catch (error) {
      errors.push(`Erreur import ${product.nom}: ${error}`);
    }
  }
  
  return {
    success: errors.length === 0,
    importedCount,
    errors,
    summary: {
      boissons: boissonsCount,
      vins: vinsCount,
      total: importedCount
    }
  };
}

/**
 * Script principal
 */
async function main() {
  try {
    // Parser les fichiers
    const vins = parseVinsFile();
    const boissons = parseBoissonsFile();
    const allProducts = [...vins, ...boissons];
    
    console.log(`\n📊 Résumé du parsing:`);
    console.log(`   🍷 Vins: ${vins.length}`);
    console.log(`   🥤 Boissons: ${boissons.length}`);
    console.log(`   📦 Total: ${allProducts.length}`);
    
    // Importer vers Firestore
    const result = await importToFirestore(allProducts);
    
    // Afficher le résultat
    console.log('\n🎉 === RÉSULTATS === 🎉');
    console.log(`✅ Import réussi: ${result.success}`);
    console.log(`📦 Produits importés: ${result.importedCount}`);
    console.log(`🍷 Vins: ${result.summary.vins}`);
    console.log(`🥤 Boissons: ${result.summary.boissons}`);
    
    if (result.errors.length > 0) {
      console.log(`\n❌ Erreurs (${result.errors.length}):`);
      result.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    console.log('\n🚀 Import terminé ! Tes données sont maintenant dans Firestore.');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 