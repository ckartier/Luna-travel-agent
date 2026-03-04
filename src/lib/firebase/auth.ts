'use client';

import {
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    type User,
    type AuthError,
} from 'firebase/auth';
import { auth } from './client';

const googleProvider = new GoogleAuthProvider();

/** Translate Firebase error codes to user-friendly French messages */
function getAuthErrorMessage(error: AuthError): string {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Adresse email invalide.';
        case 'auth/user-disabled':
            return 'Ce compte a été désactivé.';
        case 'auth/user-not-found':
            return 'Aucun compte trouvé avec cet email.';
        case 'auth/wrong-password':
            return 'Mot de passe incorrect.';
        case 'auth/invalid-credential':
            return 'Identifiants incorrects. Vérifiez votre email et mot de passe.';
        case 'auth/too-many-requests':
            return 'Trop de tentatives. Réessayez dans quelques minutes.';
        case 'auth/network-request-failed':
            return 'Erreur réseau. Vérifiez votre connexion.';
        case 'auth/popup-blocked':
            return 'Le popup a été bloqué. Redirection en cours...';
        case 'auth/popup-closed-by-user':
            return 'Connexion annulée.';
        default:
            return 'Erreur de connexion. Veuillez réessayer.';
    }
}

/** Sign in with email and password */
export async function loginWithEmail(email: string, password: string) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { user: result.user, error: null };
    } catch (err) {
        const error = err as AuthError;
        return { user: null, error: getAuthErrorMessage(error) };
    }
}

/** Sign in with Google — try popup first, fall back to redirect */
export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return { user: result.user, error: null };
    } catch (err) {
        const error = err as AuthError;
        // If popup blocked or failed, fall back to redirect
        if (error.code === 'auth/popup-blocked' ||
            error.code === 'auth/popup-closed-by-user' ||
            error.code === 'auth/cancelled-popup-request' ||
            error.code === 'auth/unauthorized-domain') {
            try {
                await signInWithRedirect(auth, googleProvider);
                return { user: null, error: null }; // redirect will handle the rest
            } catch (redirectErr) {
                const rError = redirectErr as AuthError;
                return { user: null, error: getAuthErrorMessage(rError) };
            }
        }
        return { user: null, error: getAuthErrorMessage(error) };
    }
}

/** Handle redirect result on page load */
export async function handleRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            return { user: result.user, error: null };
        }
        return { user: null, error: null };
    } catch (err) {
        const error = err as AuthError;
        return { user: null, error: getAuthErrorMessage(error) };
    }
}

/** Sign out */
export async function logout() {
    try {
        await signOut(auth);
        return { error: null };
    } catch {
        return { error: 'Erreur lors de la déconnexion.' };
    }
}

/** Listen to auth state changes */
export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}

export type { User };
