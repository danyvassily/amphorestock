import { 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  addDoc,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, StockMovement, MovementType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class StockService {
  
  /**
   * Ajouter un nouveau produit
   */
  static async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    const now = new Date();
    
    const newProduct: Product = {
      ...product,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'stocks', id), {
      ...newProduct,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    return id;
  }

  /**
   * Mettre à jour un produit
   */
  static async updateProduct(id: string, updates: Partial<Product>, userId = 'system'): Promise<void> {
    const docRef = doc(db, 'stocks', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
      modifiedBy: userId,
    });
  }

  /**
   * Supprimer un produit
   */
  static async deleteProduct(id: string): Promise<void> {
    await deleteDoc(doc(db, 'stocks', id));
  }

  /**
   * Mettre à jour la quantité d'un produit et enregistrer le mouvement
   */
  static async updateQuantity(
    productId: string, 
    newQuantity: number, 
    type: MovementType,
    reason?: string,
    notes?: string,
    userId = 'system'
  ): Promise<void> {
    // Récupérer le produit actuel
    const productDoc = await getDoc(doc(db, 'stocks', productId));
    if (!productDoc.exists()) {
      throw new Error('Produit non trouvé');
    }

    const product = productDoc.data() as Product;
    const previousQuantity = product.quantite;
    const quantityChange = newQuantity - previousQuantity;

    // Mettre à jour le produit
    await this.updateProduct(productId, { 
      quantite: newQuantity 
    });

    // Enregistrer le mouvement
    await this.addMovement({
      productId,
      productName: product.nom,
      type,
      quantity: Math.abs(quantityChange),
      previousQuantity,
      newQuantity,
      reason,
      notes,
      createdBy: userId
    });
  }

  /**
   * Ajouter du stock (entrée)
   */
  static async addStock(
    productId: string, 
    quantity: number, 
    reason?: string,
    userId = 'system'
  ): Promise<void> {
    const productDoc = await getDoc(doc(db, 'stocks', productId));
    if (!productDoc.exists()) {
      throw new Error('Produit non trouvé');
    }

    const product = productDoc.data() as Product;
    const newQuantity = product.quantite + quantity;

    await this.updateQuantity(productId, newQuantity, 'entree', reason, undefined, userId);
  }

  /**
   * Retirer du stock (sortie/vente)
   */
  static async removeStock(
    productId: string, 
    quantity: number, 
    reason?: string,
    userId = 'system'
  ): Promise<void> {
    const productDoc = await getDoc(doc(db, 'stocks', productId));
    if (!productDoc.exists()) {
      throw new Error('Produit non trouvé');
    }

    const product = productDoc.data() as Product;
    const newQuantity = Math.max(0, product.quantite - quantity);

    await this.updateQuantity(productId, newQuantity, 'sortie', reason, undefined, userId);
  }

  /**
   * Enregistrer un mouvement de stock
   */
  static async addMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<string> {
    const movementData = {
      ...movement,
      createdAt: Timestamp.fromDate(new Date()),
    };

    const docRef = await addDoc(collection(db, 'stock-movements'), movementData);
    return docRef.id;
  }

  /**
   * Obtenir un produit par ID
   */
  static async getProduct(id: string): Promise<Product | null> {
    const docSnap = await getDoc(doc(db, 'stocks', id));
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Product;
  }

  /**
   * Méthodes pratiques pour le service
   */
  static async sellProduct(productId: string, quantity: number, userId = 'system'): Promise<void> {
    await this.removeStock(productId, quantity, 'Vente', userId);
  }

  static async restockProduct(productId: string, quantity: number, userId = 'system'): Promise<void> {
    await this.addStock(productId, quantity, 'Réapprovisionnement', userId);
  }

  static async reportLoss(productId: string, quantity: number, reason: string, userId = 'system'): Promise<void> {
    const productDoc = await getDoc(doc(db, 'stocks', productId));
    if (!productDoc.exists()) {
      throw new Error('Produit non trouvé');
    }

    const product = productDoc.data() as Product;
    const newQuantity = Math.max(0, product.quantite - quantity);

    await this.updateQuantity(productId, newQuantity, 'perte', reason, undefined, userId);
  }

  static async adjustInventory(productId: string, newQuantity: number, reason: string, userId = 'system'): Promise<void> {
    await this.updateQuantity(productId, newQuantity, 'inventaire', reason, undefined, userId);
  }
} 