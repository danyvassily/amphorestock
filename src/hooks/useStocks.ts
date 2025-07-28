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
    try {
      // Construction de la requête - éviter de combiner orderBy avec where pour éviter les erreurs d'index
      let q;
      
      if (options.category && options.source) {
        // Si on a à la fois category et source, on utilise where sans orderBy pour éviter l'index composé
        q = query(
          collection(db, 'stocks'), 
          where('categorie', '==', options.category),
          where('source', '==', options.source)
        );
      } else if (options.category) {
        q = query(
          collection(db, 'stocks'), 
          where('categorie', '==', options.category)
        );
      } else if (options.source) {
        q = query(
          collection(db, 'stocks'), 
          where('source', '==', options.source)
        );
      } else {
        // Requête simple avec orderBy quand il n'y a pas de where
        q = query(collection(db, 'stocks'), orderBy('nom'));
      }

      // Écouter les changements en temps réel
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const stocksData = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
              };
            }) as Product[];

            // Trier côté client si on n'a pas pu utiliser orderBy
            let sortedStocks = stocksData;
            if (options.category || options.source) {
              sortedStocks = stocksData.sort((a, b) => a.nom.localeCompare(b.nom));
            }

            // Filtrer les stocks faibles si demandé
            let filteredStocks = sortedStocks;
            if (options.onlyLowStock) {
              filteredStocks = sortedStocks.filter(stock => stock.quantite <= stock.seuilAlerte);
            }

            // Limiter les résultats si demandé
            if (options.limit) {
              filteredStocks = filteredStocks.slice(0, options.limit);
            }

            setStocks(filteredStocks);
            setError(null);
            setLoading(false);
          } catch (err) {
            console.error('Erreur lors du traitement des données:', err);
            setError(`Erreur lors du traitement des données: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
            setLoading(false);
          }
        },
        (err) => {
          console.error('Erreur Firestore:', err);
          setError(`Erreur de connexion Firestore: ${err.message}`);
          setLoading(false);
        }
      );

      return () => {
        try {
          unsubscribe();
        } catch (err) {
          console.error('Erreur lors du nettoyage:', err);
        }
      };
    } catch (err) {
      console.error('Erreur lors de l\'initialisation de la requête:', err);
      setError(`Erreur d'initialisation: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      setLoading(false);
      return () => {}; // Retourner une fonction vide pour éviter les erreurs
    }
  }, [options.category, options.source, options.onlyLowStock, options.limit]);

  // Calculer les statistiques avec gestion d'erreurs
  const totalValue = stocks.reduce((sum, stock) => {
    try {
      return sum + (stock.quantite * stock.prixAchat);
    } catch (err) {
      console.warn('Erreur lors du calcul de la valeur pour:', stock.nom, err);
      return sum;
    }
  }, 0);

  const lowStockCount = stocks.filter(stock => {
    try {
      return stock.quantite <= stock.seuilAlerte;
    } catch (err) {
      console.warn('Erreur lors de la vérification du stock faible pour:', stock.nom, err);
      return false;
    }
  }).length;

  const categoriesStats = stocks.reduce((stats, stock) => {
    try {
      const category = stock.categorie;
      if (!stats[category]) {
        stats[category] = { count: 0, value: 0 };
      }
      stats[category].count += 1;
      stats[category].value += stock.quantite * stock.prixAchat;
      return stats;
    } catch (err) {
      console.warn('Erreur lors du calcul des stats pour:', stock.nom, err);
      return stats;
    }
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