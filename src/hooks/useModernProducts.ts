import { useState, useEffect, useCallback, useMemo } from 'react';
import { ModernStockService } from '../services/modernStockService';
import { Product, FilterOptions, ProductFormData, RealtimeConnectionStatus } from '../types';

/**
 * Hook moderne pour la gestion des produits avec synchronisation temps réel
 * 🔄 Synchronisation automatique
 * 🍷 Support des vins et stock général
 * ⚡ Optimisé pour les performances
 */
export function useModernProducts(filters?: FilterOptions) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>({
    isConnected: false,
    lastSync: null,
  });

  // Mémorisation des filtres pour éviter les re-renders inutiles
  const memoizedFilters = useMemo(() => filters, [
    filters?.search,
    filters?.category,
    filters?.type,
    filters?.stockStatus,
    filters?.sortBy,
    filters?.sortOrder,
    // Retrait de 'filters' pour éviter les re-calculs constants
  ]);

  // Initialisation et écoute temps réel
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupRealtimeListener = () => {
      try {
        setLoading(true);
        setError(null);

        unsubscribe = ModernStockService.subscribeToProducts(
          (updatedProducts) => {
            setProducts(updatedProducts);
            setConnectionStatus({
              isConnected: true,
              lastSync: new Date(),
            });
            setLoading(false);
          },
          memoizedFilters
        );

        // Timeout pour détecter les problèmes de connexion
        const connectionTimeout = setTimeout(() => {
          setConnectionStatus(prev => {
            if (!prev.isConnected) {
              return {
                isConnected: false,
                lastSync: null,
                error: 'Timeout de connexion - Vérifiez votre connexion Firebase',
              };
            }
            return prev;
          });
        }, 5000);

        return () => clearTimeout(connectionTimeout);
      } catch (err) {
        setError(`Erreur de connexion: ${err}`);
        setConnectionStatus({
          isConnected: false,
          lastSync: null,
          error: err as string,
        });
        setLoading(false);
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [memoizedFilters]);

  // Actions CRUD
  const addProduct = useCallback(async (productData: ProductFormData): Promise<string> => {
    try {
      const productId = await ModernStockService.addProduct(productData);
      // Les produits seront automatiquement mis à jour via la synchronisation temps réel
      return productId;
    } catch (err) {
      setError(`Erreur lors de l'ajout: ${err}`);
      throw err;
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<ProductFormData>): Promise<void> => {
    try {
      await ModernStockService.updateProduct(id, updates);
      // Les produits seront automatiquement mis à jour via la synchronisation temps réel
    } catch (err) {
      setError(`Erreur lors de la mise à jour: ${err}`);
      throw err;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      await ModernStockService.deleteProduct(id);
      // Les produits seront automatiquement mis à jour via la synchronisation temps réel
    } catch (err) {
      setError(`Erreur lors de la suppression: ${err}`);
      throw err;
    }
  }, []);

  const updateQuantity = useCallback(async (
    productId: string,
    newQuantity: number,
    type: 'entree' | 'sortie' | 'inventaire',
    reason?: string
  ): Promise<void> => {
    try {
      await ModernStockService.updateQuantity(productId, newQuantity, type, reason);
      // Les produits seront automatiquement mis à jour via la synchronisation temps réel
    } catch (err) {
      setError(`Erreur lors de la mise à jour de quantité: ${err}`);
      throw err;
    }
  }, []);

  const addStock = useCallback(async (productId: string, quantity: number, reason?: string): Promise<void> => {
    try {
      await ModernStockService.addStock(productId, quantity, reason);
    } catch (err) {
      setError(`Erreur lors de l'ajout de stock: ${err}`);
      throw err;
    }
  }, []);

  const removeStock = useCallback(async (productId: string, quantity: number, reason?: string): Promise<void> => {
    try {
      await ModernStockService.removeStock(productId, quantity, reason);
    } catch (err) {
      setError(`Erreur lors de la sortie de stock: ${err}`);
      throw err;
    }
  }, []);

  // Statistiques dérivées
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalVins = products.filter(p => p.type === 'vins').length;
    const totalGeneral = products.filter(p => p.type === 'general').length;
    const lowStockCount = products.filter(p => p.quantite <= p.seuilAlerte).length;
    const outOfStockCount = products.filter(p => p.quantite === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.quantite * p.prixAchat), 0);

    return {
      totalProducts,
      totalVins,
      totalGeneral,
      lowStockCount,
      outOfStockCount,
      totalValue,
    };
  }, [products]);

  // Produits par catégorie
  const productsByCategory = useMemo(() => {
    return products.reduce((acc, product) => {
      const category = product.categorie;
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products]);

  // Réinitialiser les erreurs
  const clearError = useCallback(() => setError(null), []);

  return {
    // Données
    products,
    stats,
    productsByCategory,
    
    // États
    loading,
    error,
    connectionStatus,
    
    // Actions
    addProduct,
    updateProduct,
    deleteProduct,
    updateQuantity,
    addStock,
    removeStock,
    clearError,
  };
}

/**
 * Hook spécialisé pour les vins uniquement
 */
export function useVins(filters?: Omit<FilterOptions, 'type'>) {
  return useModernProducts({ ...filters, type: 'vins' });
}

/**
 * Hook spécialisé pour le stock général uniquement
 */
export function useGeneralStock(filters?: Omit<FilterOptions, 'type'>) {
  return useModernProducts({ ...filters, type: 'general' });
}

/**
 * Hook pour un seul produit avec synchronisation temps réel
 */
export function useProduct(productId: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    let unsubscribe: (() => void) | null = null;

    const setupListener = () => {
      // S'abonner aux changements de tous les produits et filtrer par ID
      unsubscribe = ModernStockService.subscribeToProducts((products) => {
        const foundProduct = products.find(p => p.id === productId);
        setProduct(foundProduct || null);
        setLoading(false);
      });
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [productId]);

  const updateProduct = useCallback(async (updates: Partial<ProductFormData>): Promise<void> => {
    if (!productId) throw new Error('Aucun produit sélectionné');
    
    try {
      await ModernStockService.updateProduct(productId, updates);
    } catch (err) {
      setError(`Erreur lors de la mise à jour: ${err}`);
      throw err;
    }
  }, [productId]);

  const deleteProduct = useCallback(async (): Promise<void> => {
    if (!productId) throw new Error('Aucun produit sélectionné');
    
    try {
      await ModernStockService.deleteProduct(productId);
    } catch (err) {
      setError(`Erreur lors de la suppression: ${err}`);
      throw err;
    }
  }, [productId]);

  return {
    product,
    loading,
    error,
    updateProduct,
    deleteProduct,
  };
}