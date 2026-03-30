'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { loginWithEmail, loginWithGoogle as firebaseLoginWithGoogle, logout as firebaseLogout, onAuthChange, type User } from '@/src/lib/firebase/auth';
import { getOrCreateUser, getUser, type CRMUser } from '@/src/lib/firebase/crm';

interface AuthContextType {
    user: User | null;
    userProfile: CRMUser | null;
    tenantId: string | null;
    loading: boolean;
    isSuperAdmin: boolean;
    isProTravelOnly: boolean;
    role: string;
    login: (email: string, password: string) => Promise<{ error: string | null }>;
    loginWithGoogle: () => Promise<{ error: string | null }>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<CRMUser | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = useCallback(async (firebaseUser: User) => {
        try {
            const profile = await getOrCreateUser({
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName,
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL,
            });
            setUserProfile(profile);
        } catch (err) {
            console.error('[AuthContext] Failed to load user profile:', err);
            // Retry once after a short delay (Firestore may need time for rules)
            try {
                await new Promise(r => setTimeout(r, 2000));
                const profile = await getOrCreateUser({
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName,
                    email: firebaseUser.email,
                    photoURL: firebaseUser.photoURL,
                });
                setUserProfile(profile);
            } catch (retryErr) {
                console.error('[AuthContext] Retry also failed:', retryErr);
            }
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await loadProfile(firebaseUser);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, [loadProfile]);

    const login = async (email: string, password: string) => {
        const result = await loginWithEmail(email, password);
        return { error: result.error };
    };

    const loginWithGoogle = async () => {
        const result = await firebaseLoginWithGoogle();
        return { error: result.error };
    };

    const logout = async () => {
        await firebaseLogout();
        setUserProfile(null);
    };

    const refreshProfile = async () => {
        if (user) {
            // Read directly from Firestore to get custom-uploaded photoURL
            const profile = await getUser(user.uid);
            if (profile) setUserProfile(profile);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            userProfile,
            tenantId: userProfile?.tenantId || null,
            loading,
            isSuperAdmin: userProfile?.role === 'SuperAdmin',
            isProTravelOnly: userProfile?.accessScope === 'pro_travel',
            role: userProfile?.role || 'Agent',
            login,
            loginWithGoogle,
            logout,
            refreshProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
