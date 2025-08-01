#!/usr/bin/env tsx

import { db } from '../src/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

async function testConnection() {
  console.log('🔍 Test de connexion Firebase...\n');
  
  try {
    // Test ultra-simple: Récupération de tous les produits sans filtres ni tri
    console.log('📋 Test: Récupération de tous les produits (sans filtres)...');
    const allProductsQuery = query(collection(db, 'products'));
    const allSnapshot = await getDocs(allProductsQuery);
    console.log(`✅ ${allSnapshot.docs.length} produits trouvés\n`);

    // Filtrer côté client pour les vins et stock général
    const allProducts = allSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const vins = allProducts.filter(p => p.type === 'vins');
    const stockGeneral = allProducts.filter(p => p.type === 'general');
    
    console.log(`🍷 ${vins.length} vins trouvés (filtrage côté client)`);
    console.log(`📦 ${stockGeneral.length} produits stock général trouvés (filtrage côté client)\n`);

    // Afficher quelques exemples
    console.log('📄 Premiers vins:');
    vins.slice(0, 3).forEach(product => {
      console.log(`   - ${product.nom} (${product.categorie}) - ${product.quantite} ${product.unite}`);
    });

    console.log('\n📄 Premiers produits stock général:');
    stockGeneral.slice(0, 3).forEach(product => {
      console.log(`   - ${product.nom} (${product.categorie}) - ${product.quantite} ${product.unite}`);
    });

    console.log('\n🎉 Test réussi ! Firebase fonctionne avec la requête simplifiée.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testConnection();