import { createContext, useContext, useState, useRef, type ReactNode } from "react";
import type { Product } from "../types/Products";

type CartItem = Product & { quantity: number };

type CartContextType = {
  items: CartItem[];
  addToCart: (p: Product) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  lastAdded: string | null;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const clearTimer = useRef<number | null>(null);

  function addToCart(p: Product) {
    setItems((current) => {
      const existing = current.find((it) => it.id === p.id);
      if (existing) {
        return current.map((it) => (it.id === p.id ? { ...it, quantity: it.quantity + 1 } : it));
      }
      // prefer salePriceCents when available so cart charges sale price
      const priceCents = typeof (p as any).salePriceCents === 'number' ? (p as any).salePriceCents : (p.priceCents ?? 0);
      const item: CartItem = { ...p, priceCents, quantity: 1 } as CartItem;
      return [...current, item];
    });
    // set transient feedback for UI
    setLastAdded(p.name);
    if (clearTimer.current) {
      window.clearTimeout(clearTimer.current);
    }
    clearTimer.current = window.setTimeout(() => setLastAdded(null), 2000);
  }

  function removeFromCart(id: string) {
    setItems((current) => current.filter((it) => it.id !== id));
  }

  function clearCart() {
    setItems([]);
  }

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, lastAdded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export default CartContext;
