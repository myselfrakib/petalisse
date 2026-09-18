import { createContext, useContext, useState, type ReactNode } from 'react';
import { products, type Product } from '../data/products';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  add: (product: Product, qty?: number) => void;
  remove: (id: string) => void;
  update: (id: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  // Default cart items matching Figma node 9:4 (subtotal ₹57, count 4)
  const [items, setItems] = useState<CartItem[]>(() => {
    const p1 = products.find((p) => p.id === 'rose-garden-charm') || products[0];
    const p2 = products.find((p) => p.id === 'daisy-chain-bag-charm') || products[2];
    const p3 = products.find((p) => p.id === 'surprise-mystery-jar') || products[4];
    return [
      { product: p1, quantity: 2 },
      { product: p2, quantity: 1 },
      { product: p3, quantity: 1 },
    ];
  });

  const add = (product: Product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.product.id !== id));

  const update = (id: string, qty: number) => {
    if (qty <= 0) {
      remove(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i)));
  };

  const clear = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
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
