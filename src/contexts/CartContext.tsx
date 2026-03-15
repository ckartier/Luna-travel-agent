'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
    id: string;
    type: string;
    name: string;
    location?: string;
    description?: string;
    clientPrice?: number | string;
    images?: string[];
    video?: string;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
    total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load from local storage
    useEffect(() => {
        const stored = localStorage.getItem('luna_cart');
        if (stored) {
            try {
                setCart(JSON.parse(stored));
            } catch (e) {
                console.error("Failed parsing cart", e);
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('luna_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item: CartItem) => {
        // Optionnel: éviter les doublons ou accumuler des quantités (ici on ajoute simplement)
        setCart(prev => {
            if (prev.find(i => i.id === item.id)) return prev;
            return [...prev, item];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(i => i.id !== id));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('luna_cart');
    };

    // Calc total if price is a valid number, otherwise default to 0 for "Sur mesure"
    const total = cart.reduce((acc, current) => {
        const p = typeof current.clientPrice === 'number' ? current.clientPrice : parseInt(String(current.clientPrice).replace(/[^\d]/g, '') || "0");
        return acc + (!isNaN(p) ? p : 0);
    }, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
