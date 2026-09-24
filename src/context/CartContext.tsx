import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Product } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

interface CartContextValue {
  items: CartItem[];
  add: (product: Product, qty?: number, selectedColor?: string) => void;
  remove: (id: string, selectedColor?: string) => void;
  update: (id: string, qty: number, selectedColor?: string) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  // Start with empty cart or persistent items added by real user
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('petalisse_cart_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('petalisse_cart_items', JSON.stringify(items));
    } catch {}
  }, [items]);

  const add = (product: Product, qty = 1, selectedColor?: string) => {
    setItems((prev) => {
      const colorToMatch = selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : undefined);
      const existing = prev.find(
        (i) => i.product.id === product.id && (i.selectedColor || '') === (colorToMatch || '')
      );
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && (i.selectedColor || '') === (colorToMatch || '')
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { product, quantity: qty, selectedColor: colorToMatch }];
    });
  };

  const remove = (id: string, selectedColor?: string) => {
    setItems((prev) =>
      prev.filter(
        (i) =>
          !(i.product.id === id && (selectedColor === undefined || (i.selectedColor || '') === (selectedColor || '')))
      )
    );
  };

  const update = (id: string, qty: number, selectedColor?: string) => {
    if (qty <= 0) {
      remove(id, selectedColor);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === id && (selectedColor === undefined || (i.selectedColor || '') === (selectedColor || ''))
          ? { ...i, quantity: qty }
          : i
      )
    );
  };

  const clear = () => {
    setItems([]);
    try {
      localStorage.removeItem('petalisse_cart_items');
    } catch {}
  };

  const total = items.reduce(
    (sum, i) => sum + (i.product.discountedPrice !== undefined ? i.product.discountedPrice : i.product.price) * i.quantity,
    0
  );
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, update, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
