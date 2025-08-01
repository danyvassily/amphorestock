#!/usr/bin/env npx tsx

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

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

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🧹 === NETTOYAGE COMPLET FIREBASE === 🧹\n');

/**
 * Supprime toutes les données d'une collection
 */
async function cleanCollection(collectionName: string): Promise<number> {
  console.log(`🗑️ Nettoyage de la collection "${collectionName}"...`);
  
  const collectionRef = collection(db, collectionName);
  const querySnapshot = await getDocs(collectionRef);
  
  if (querySnapshot.empty) {
    console.log(`   ✅ Collection "${collectionName}" déjà vide`);
    return 0;
  }
  
  const batch = writeBatch(db);
  let count = 0;
  
  querySnapshot.docs.forEach((docSnapshot) => {
    batch.delete(doc(db, collectionName, docSnapshot.id));
    count++;
  });
  
  await batch.commit();
  console.log(`   ✅ ${count} documents supprimés de "${collectionName}"`);
  return count;
}

/**
 * Script principal de nettoyage
 */
async function main() {
  try {
    let totalDeleted = 0;
    
    // Collections à nettoyer
    const collections = [
      'stocks',        // Anciens produits
      'products',      // Nouveaux produits
      'movements',     // Mouvements de stock
      'ai-logs',       // Logs IA
      'users'          // Utilisateurs (optionnel)
    ];
    
    console.log('Collections à nettoyer :', collections.join(', '));
    console.log('⚠️  Cette opération est IRRÉVERSIBLE !\n');
    
    // Nettoyage de chaque collection
    for (const collectionName of collections) {
      try {
        const deleted = await cleanCollection(collectionName);
        totalDeleted += deleted;
      } catch (error) {
        console.log(`   ⚠️ Erreur sur "${collectionName}": ${error}`);
      }
    }
    
    console.log('\n🎉 === NETTOYAGE TERMINÉ === 🎉');
    console.log(`📊 Total supprimé: ${totalDeleted} documents`);
    console.log('🚀 Firebase est maintenant propre et prêt pour les nouvelles données !');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();