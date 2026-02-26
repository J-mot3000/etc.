import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Product } from './types/Products';

const PRODUCTS_COLLECTION = 'products';

export async function loadRemoteProducts() {
  try {
    const res = await fetch('https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Could not load remote products', err);
    return [];
  }
}

// Check if products already exist in Firestore
export async function hasProducts(): Promise<boolean> {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (err) {
    console.error('Error checking products', err);
    return false;
  }
}

// Seed Firestore with products from remote API
export async function seedProducts() {
  try {
    const exists = await hasProducts();
    if (exists) return; // Already seeded

    const remoteProducts = await loadRemoteProducts();
    if (remoteProducts.length === 0) return;

    for (const p of remoteProducts) {
      await addDoc(collection(db, PRODUCTS_COLLECTION), {
        image: p.image || '',
        name: p.name || 'Product',
        rating: p.rating || { stars: 0, count: 0 },
        priceCents: typeof p.priceCents === 'number' ? p.priceCents : Math.round((p.price || 0) * 100),
        category: p.category || 'uncategorized',
        subCategory: p.subCategory || '',
        keywords: p.keywords || [],
        description: p.description || '',
        inventory: typeof p.inventory === 'number' ? p.inventory : 10,
        discountPercent: p.discountPercent || undefined,
        salePriceCents: p.salePriceCents || undefined,
        createdAt: new Date(),
      });
    }

    console.log('Seeded Firestore with', remoteProducts.length, 'products');
  } catch (err) {
    console.error('Error seeding products', err);
  }
}

// Get all products for public view
export async function getPublicProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as Product));
  } catch (err) {
    console.error('Error getting products', err);
    return [];
  }
}

// Add product (admin only)
export async function addProduct(data: Partial<Product>): Promise<Product> {
  try {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...data,
      priceCents: Math.round((typeof data.priceCents === 'number' ? data.priceCents : (data.price || 0) * 100)),
      createdAt: new Date(),
    });

    return {
      id: docRef.id,
      ...data,
    } as Product;
  } catch (err) {
    console.error('Error adding product', err);
    throw err;
  }
}

// Update product inventory (admin only)
export async function updateProductInventory(productId: string, inventory: number): Promise<void> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, { inventory });
  } catch (err) {
    console.error('Error updating inventory', err);
    throw err;
  }
}

// Delete product (admin only)
export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
  } catch (err) {
    console.error('Error deleting product', err);
    throw err;
  }
}

// Apply discount to multiple products (admin only)
export async function applyDiscount(productIds: string[], discountPercent: number): Promise<void> {
  try {
    for (const productId of productIds) {
      const productRef = doc(db, PRODUCTS_COLLECTION, productId);
      
      if (discountPercent === 0) {
        await updateDoc(productRef, {
          discountPercent: undefined,
          salePriceCents: undefined,
        });
      } else {
        const productSnap = await getDocs(query(collection(db, PRODUCTS_COLLECTION), where('__name__', '==', productId)));
        if (!productSnap.empty) {
          const product = productSnap.docs[0].data();
          const baseCents = product.priceCents || 0;
          const saleCents = Math.round(baseCents * (100 - discountPercent) / 100);
          await updateDoc(productRef, {
            discountPercent,
            salePriceCents: saleCents,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error applying discount', err);
    throw err;
  }
}
