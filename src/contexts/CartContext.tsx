import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Shop, Product } from '../types';
import { calculateCartPricing, type CartPricing } from '../utils/cartPricing';

const CART_STORAGE_KEY = 'apnamart_global_cart';
const CART_SHOP_STORAGE_KEY = 'apnamart_global_cart_shop';
const CART_PRODUCTS_STORAGE_KEY = 'apnamart_global_cart_products';

export interface CartContextType {
  cart: Record<string, number>;
  cartShop: Shop | null;
  cartProducts: Product[];
  addToCart: (shop: Shop, product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalCartCount: number;
  totalCartAmount: number;
  cartPricing: CartPricing;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  syncShopProducts: (shop: Shop, products: Product[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [cartShop, setCartShop] = useState<Shop | null>(() => {
    try {
      const raw = localStorage.getItem(CART_SHOP_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [cartProducts, setCartProducts] = useState<Product[]>(() => {
    try {
      const raw = localStorage.getItem(CART_PRODUCTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      if (cartShop) {
        localStorage.setItem(CART_SHOP_STORAGE_KEY, JSON.stringify(cartShop));
      } else {
        localStorage.removeItem(CART_SHOP_STORAGE_KEY);
      }
      if (cartProducts.length > 0) {
        localStorage.setItem(CART_PRODUCTS_STORAGE_KEY, JSON.stringify(cartProducts));
      } else {
        localStorage.removeItem(CART_PRODUCTS_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Could not sync cart to localStorage:', e);
    }
  }, [cart, cartShop, cartProducts]);

  const syncShopProducts = useCallback((shop: Shop, products: Product[]) => {
    if (cartShop?.id === shop.id || !cartShop) {
      setCartProducts((prev) => {
        const map = new Map<string, Product>();
        for (const p of prev) map.set(p.productId || p.id, p);
        for (const p of products) map.set(p.productId || p.id, p);
        return Array.from(map.values());
      });
    }
  }, [cartShop]);

  const addToCart = useCallback((shop: Shop, product: Product) => {
    const pId = product.productId || product.id;

    // Check if adding from another shop
    if (cartShop && cartShop.id !== shop.id && Object.keys(cart).length > 0) {
      const confirmSwitch = window.confirm(
        `Your cart contains items from "${cartShop.name}". Would you like to clear your current cart and start ordering from "${shop.name}"?`
      );
      if (!confirmSwitch) return;

      // Reset for new shop
      setCart({ [pId]: 1 });
      setCartShop(shop);
      setCartProducts([product]);
      return;
    }

    setCartShop(shop);
    setCartProducts((prev) => {
      if (prev.some((p) => (p.productId || p.id) === pId)) return prev;
      return [...prev, product];
    });

    setCart((prev) => ({
      ...prev,
      [pId]: (prev[pId] || 0) + 1,
    }));
  }, [cart, cartShop]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[productId];
        if (Object.keys(next).length === 0) {
          setCartShop(null);
        }
        return next;
      }
      return { ...prev, [productId]: current - 1 };
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[productId];
        if (Object.keys(next).length === 0) {
          setCartShop(null);
        }
        return next;
      }
      return { ...prev, [productId]: quantity };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
    setCartShop(null);
    setCartProducts([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_SHOP_STORAGE_KEY);
    localStorage.removeItem(CART_PRODUCTS_STORAGE_KEY);
  }, []);

  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, q) => sum + q, 0);
  }, [cart]);

  const totalCartAmount = useMemo(() => {
    return Object.entries(cart).reduce((sum, [pId, qty]) => {
      const p = cartProducts.find((item) => (item.productId || item.id) === pId);
      if (!p) return sum;
      const price = typeof p.sellingPrice === 'number' ? p.sellingPrice : p.price || 0;
      return sum + price * qty;
    }, 0);
  }, [cart, cartProducts]);

  const cartPricing = useMemo(() => {
    return calculateCartPricing(totalCartAmount);
  }, [totalCartAmount]);

  const value = {
    cart,
    cartShop,
    cartProducts,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalCartCount,
    totalCartAmount,
    cartPricing,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    syncShopProducts,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

