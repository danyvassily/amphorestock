import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, ProductCategory } from '@/types';

export interface UseStocksOptions {
  category?: ProductCategory;
  source?: 'vins' | 'boissons';
  onlyLowStock?: boolean;
  limit?: number;
}

export interface UseStocksReturn {
  stocks: Product[];
  loading: boolean;
  error: string | null;
  totalValue: number;
  lowStockCount: number;
  categoriesStats: { [key: string]: { count: number; value: number } };
}

export function useStocks(options: UseStocksOptions = {}): UseStocksReturn {
  const [stocks, setStocks] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let q = query(collection(db, 'stocks'), orderBy('nom'));

    // Appliquer les filtres
    if (options.category) {
      q = query(q, where('categorie', '==', options.category));
    }
    
    if (options.source) {
      q = query(q, where('source', '==', options.source));
    }

    // Écouter les changements en temps réel
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const stocksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as Product[];

          // Filtrer les stocks faibles si demandé
          let filteredStocks = stocksData;
          if (options.onlyLowStock) {
            filteredStocks = stocksData.filter(stock => stock.quantite <= stock.seuilAlerte);
          }

          // Limiter les résultats si demandé
          if (options.limit) {
            filteredStocks = filteredStocks.slice(0, options.limit);
          }

          setStocks(filteredStocks);
          setError(null);
        } catch (err) {
          setError(`Erreur lors du chargement des stocks: ${err}`);
          console.error('Erreur useStocks:', err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(`Erreur Firestore: ${err.message}`);
        setLoading(false);
        console.error('Erreur Firestore:', err);
      }
    );

    return () => unsubscribe();
  }, [options.category, options.source, options.onlyLowStock, options.limit]);

  // Calculer les statistiques
  const totalValue = stocks.reduce((sum, stock) => {
    return sum + (stock.quantite * stock.prixAchat);
  }, 0);

  const lowStockCount = stocks.filter(stock => stock.quantite <= stock.seuilAlerte).length;

  const categoriesStats = stocks.reduce((stats, stock) => {
    const category = stock.categorie;
    if (!stats[category]) {
      stats[category] = { count: 0, value: 0 };
    }
    stats[category].count += 1;
    stats[category].value += stock.quantite * stock.prixAchat;
    return stats;
  }, {} as { [key: string]: { count: number; value: number } });

  return {
    stocks,
    loading,
    error,
    totalValue,
    lowStockCount,
    categoriesStats,
  };
} 