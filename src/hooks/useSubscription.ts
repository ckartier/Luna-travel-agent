'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';
import { useAuth } from '@/src/contexts/AuthContext';

export interface Subscription {
    email: string;
    planId: string;
    planName: string;
    status: 'active' | 'cancelled' | 'past_due' | 'trialing';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    activatedAt?: any;
    updatedAt?: any;
}

export function useSubscription() {
    const { user, loading: authLoading } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user?.email) {
            setSubscription(null);
            setLoading(false);
            return;
        }

        // Real-time listener on subscription document
        const unsubscribe = onSnapshot(
            doc(db, 'subscriptions', user.email),
            (snap) => {
                if (snap.exists()) {
                    setSubscription(snap.data() as Subscription);
                } else {
                    setSubscription(null);
                }
                setLoading(false);
            },
            (error) => {
                console.error('Subscription listener error:', error);
                setSubscription(null);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [user, authLoading]);

    const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
    const planId = subscription?.planId || null;
    const planName = subscription?.planName || null;

    return { subscription, loading, isActive, planId, planName };
}
