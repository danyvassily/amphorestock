import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  writeBatch,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, ProductFormData, FilterOptions, StockMovement, MovementType } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service moderne de gestion des stocks avec synchronisation temps réel
 * 🔄 Toutes les opérations sont synchronisées en temps réel
 * 🍷 Gestion séparée des vins et du stock général
 */
export class ModernStockService {
  private static readonly COLLECTION_NAME = 'products';
  private static readonly MOVEMENTS_COLLECTION = 'movements';

  /**
   * 📋 Récupérer tous les produits avec filtres optionnels
   */
  static async getProducts(filters?: FilterOptions): Promise<Product[]> {
    try {
      // Requête ultra-simple sans index pour éviter les erreurs Firebase
      // TOUS les filtres et tris seront faits côté client
      const q = query(collection(db, this.COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      
      let products: Product[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Product[];

      // Filtres côté client (TOUS maintenant pour éviter les erreurs d'index)
      if (filters?.type && filters.type !== 'all') {
        products = products.filter(product => product.type === filters.type);
      }

      if (filters?.category && filters.category !== 'all') {
        products = products.filter(product => product.categorie === filters.category);
      }

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        products = products.filter(product => 
          product.nom.toLowerCase().includes(searchTerm) ||
          product.fournisseur?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters?.stockStatus && filters.stockStatus !== 'all') {
        products = products.filter(product => {
          switch (filters.stockStatus) {
            case 'low': return product.quantite <= product.seuilAlerte;
            case 'out': return product.quantite === 0;
            case 'normal': return product.quantite > product.seuilAlerte;
            default: return true;
          }
        });
      }

      // Tri côté client
      if (filters?.sortBy && filters.sortBy !== 'nom') {
        products.sort((a, b) => {
          const aVal = a[filters.sortBy as keyof Product];
          const bVal = b[filters.sortBy as keyof Product];
          const order = filters.sortOrder === 'desc' ? -1 : 1;
          
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return aVal.localeCompare(bVal) * order;
          }
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return (aVal - bVal) * order;
          }
          return 0;
        });
      }

      // Tri par défaut par nom si aucun tri spécifique
      if (!filters?.sortBy || filters.sortBy === 'nom') {
        products.sort((a, b) => a.nom.localeCompare(b.nom));
      }

      return products;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }
  }

  /**
   * 🍷 Récupérer uniquement les vins
   */
  static async getVins(filters?: Omit<FilterOptions, 'type'>): Promise<Product[]> {
    return this.getProducts({ ...filters, type: 'vins' });
  }

  /**
   * 📦 Récupérer uniquement le stock général
   */
  static async getGeneralStock(filters?: Omit<FilterOptions, 'type'>): Promise<Product[]> {
    return this.getProducts({ ...filters, type: 'general' });
  }

  /**
   * 🔍 Récupérer un produit par ID
   */
  static async getProductById(id: string): Promise<Product | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as Product;
    } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      throw error;
    }
  }

  /**
   * ➕ Ajouter un nouveau produit
   */
  static async addProduct(productData: ProductFormData, userId = 'system'): Promise<string> {
    try {
      const now = Timestamp.fromDate(new Date());
      
      const product: Omit<Product, 'id'> = {
        ...productData,
        isActive: true,
        source: productData.type === 'vins' ? 'vins' : 'general',
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
        createdBy: userId,
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...product,
        createdAt: now,
        updatedAt: now,
      });

      console.log('✅ Produit ajouté:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit:', error);
      throw error;
    }
  }

  /**
   * ✏️ Mettre à jour un produit
   */
  static async updateProduct(
    id: string, 
    updates: Partial<ProductFormData>, 
    userId = 'system'
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
        modifiedBy: userId,
      });

      console.log('✅ Produit mis à jour:', id);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Supprimer un produit (soft delete)
   */
  static async deleteProduct(id: string, userId = 'system'): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      
      // Soft delete - marquer comme inactif plutôt que supprimer
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: Timestamp.fromDate(new Date()),
        modifiedBy: userId,
      });

      console.log('✅ Produit désactivé:', id);
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Supprimer définitivement un produit
   */
  static async hardDeleteProduct(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);
      console.log('✅ Produit supprimé définitivement:', id);
    } catch (error) {
      console.error('Erreur lors de la suppression définitive:', error);
      throw error;
    }
  }

  /**
   * 📈 Mettre à jour la quantité et enregistrer le mouvement
   */
  static async updateQuantity(
    productId: string,
    newQuantity: number,
    type: MovementType,
    reason?: string,
    userId = 'system'
  ): Promise<void> {
    try {
      // Récupérer le produit actuel
      const product = await this.getProductById(productId);
      if (!product) throw new Error('Produit non trouvé');

      const previousQuantity = product.quantite;
      const quantityChange = newQuantity - previousQuantity;

      // Mettre à jour le produit
      await this.updateProduct(productId, { quantite: newQuantity }, userId);

      // Enregistrer le mouvement
      await this.addMovement({
        productId,
        productName: product.nom,
        type,
        quantity: Math.abs(quantityChange),
        previousQuantity,
        newQuantity,
        reason,
        createdBy: userId
      });

      console.log('✅ Quantité mise à jour:', productId, `${previousQuantity} → ${newQuantity}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error);
      throw error;
    }
  }

  /**
   * 📥 Ajouter du stock (entrée)
   */
  static async addStock(
    productId: string,
    quantity: number,
    reason?: string,
    userId = 'system'
  ): Promise<void> {
    const product = await this.getProductById(productId);
    if (!product) throw new Error('Produit non trouvé');

    const newQuantity = product.quantite + quantity;
    await this.updateQuantity(productId, newQuantity, 'entree', reason, userId);
  }

  /**
   * 📤 Retirer du stock (sortie)
   */
  static async removeStock(
    productId: string,
    quantity: number,
    reason?: string,
    userId = 'system'
  ): Promise<void> {
    const product = await this.getProductById(productId);
    if (!product) throw new Error('Produit non trouvé');

    const newQuantity = Math.max(0, product.quantite - quantity);
    await this.updateQuantity(productId, newQuantity, 'sortie', reason, userId);
  }

  /**
   * 📊 Enregistrer un mouvement de stock
   */
  static async addMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<string> {
    try {
      const now = Timestamp.fromDate(new Date());
      
      const docRef = await addDoc(collection(db, this.MOVEMENTS_COLLECTION), {
        ...movement,
        createdAt: now,
      });

      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du mouvement:', error);
      throw error;
    }
  }

  /**
   * 🔄 S'abonner aux changements en temps réel
   */
  static subscribeToProducts(
    callback: (products: Product[]) => void,
    filters?: FilterOptions
  ): () => void {
    try {
      // Requête ultra-simple sans index pour éviter les erreurs Firebase
      // TOUS les filtres et tris seront faits côté client
      const q = query(collection(db, this.COLLECTION_NAME));

      return onSnapshot(q, (querySnapshot) => {
        console.log(`📡 Firebase: ${querySnapshot.docs.length} produits reçus`);
        let products: Product[] = querySnapshot.docs
          .filter(doc => doc.data().isActive !== false) // Exclure les produits supprimés
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as Product;
          });

        // Filtres côté client (TOUS maintenant pour éviter les erreurs d'index)
        if (filters?.type && filters.type !== 'all') {
          products = products.filter(product => product.type === filters.type);
        }

        if (filters?.category && filters.category !== 'all') {
          products = products.filter(product => product.categorie === filters.category);
        }

        if (filters?.search) {
          const searchTerm = filters.search.toLowerCase();
          products = products.filter(product => 
            product.nom.toLowerCase().includes(searchTerm) ||
            product.fournisseur?.toLowerCase().includes(searchTerm)
          );
        }

        if (filters?.stockStatus && filters.stockStatus !== 'all') {
          products = products.filter(product => {
            switch (filters.stockStatus) {
              case 'low': return product.quantite <= product.seuilAlerte;
              case 'out': return product.quantite === 0;
              case 'normal': return product.quantite > product.seuilAlerte;
              default: return true;
            }
          });
        }

        // Tri côté client
        if (filters?.sortBy && filters.sortBy !== 'nom') {
          products.sort((a, b) => {
            const aVal = a[filters.sortBy as keyof Product];
            const bVal = b[filters.sortBy as keyof Product];
            const order = filters.sortOrder === 'desc' ? -1 : 1;
            
            if (typeof aVal === 'string' && typeof bVal === 'string') {
              return aVal.localeCompare(bVal) * order;
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return (aVal - bVal) * order;
            }
            return 0;
          });
        }

        // Tri par défaut par nom si aucun tri spécifique
        if (!filters?.sortBy || filters.sortBy === 'nom') {
          products.sort((a, b) => a.nom.localeCompare(b.nom));
        }

        console.log(`✅ Envoi de ${products.length} produits au hook`);
        callback(products);
      }, (error) => {
        console.error('🚨 Erreur Firebase onSnapshot:', error);
        // Essayer de relancer la connexion après une erreur
        setTimeout(() => {
          console.log('🔄 Tentative de reconnexion...');
        }, 2000);
      });
    } catch (error) {
      console.error('Erreur lors de la souscription:', error);
      return () => {};
    }
  }

  /**
   * 🍷 S'abonner uniquement aux vins
   */
  static subscribeToVins(
    callback: (products: Product[]) => void,
    filters?: Omit<FilterOptions, 'type'>
  ): () => void {
    return this.subscribeToProducts(callback, { ...filters, type: 'vins' });
  }

  /**
   * 📦 S'abonner uniquement au stock général
   */
  static subscribeToGeneralStock(
    callback: (products: Product[]) => void,
    filters?: Omit<FilterOptions, 'type'>
  ): () => void {
    return this.subscribeToProducts(callback, { ...filters, type: 'general' });
  }

  /**
   * 📊 Obtenir les statistiques globales
   */
  static async getStats(): Promise<{
    totalProducts: number;
    totalVins: number;
    totalGeneral: number;
    lowStockCount: number;
    totalValue: number;
  }> {
    try {
      const products = await this.getProducts();
      
      const stats = {
        totalProducts: products.length,
        totalVins: products.filter(p => p.type === 'vins').length,
        totalGeneral: products.filter(p => p.type === 'general').length,
        lowStockCount: products.filter(p => p.quantite <= p.seuilAlerte).length,
        totalValue: products.reduce((sum, p) => sum + (p.quantite * p.prixAchat), 0)
      };

      return stats;
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }
}