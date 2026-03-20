'use client';

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
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
        console.error('[Auth] Google sign-in error:', error.code, error.message);
        
        // If popup blocked, fall back to redirect
        if (error.code === 'auth/popup-blocked' ||
            error.code === 'auth/cancelled-popup-request') {
            try {
                await signInWithRedirect(auth, googleProvider);
                return { user: null, error: null }; // redirect will handle the rest
            } catch (redirectErr) {
                const rError = redirectErr as AuthError;
                console.error('[Auth] Google redirect error:', rError.code, rError.message);
                return { user: null, error: getAuthErrorMessage(rError) };
            }
        }
        
        // User closed popup — not an error per se
        if (error.code === 'auth/popup-closed-by-user') {
            return { user: null, error: 'Connexion annulée.' };
        }
        
        // Unauthorized domain — show clear error
        if (error.code === 'auth/unauthorized-domain') {
            return { user: null, error: 'Domaine non autorisé. Ajoutez localhost dans Firebase Console → Authentication → Settings → Authorized Domains.' };
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

/** Create a new account with email + password */
export async function signUpWithEmail(email: string, password: string, displayName: string) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Set the display name
        await updateProfile(result.user, { displayName });
        return { user: result.user, error: null };
    } catch (err) {
        const error = err as AuthError;
        const messages: Record<string, string> = {
            'auth/email-already-in-use': 'Un compte avec cet email existe déjà. Connectez-vous.',
            'auth/invalid-email': 'Adresse email invalide.',
            'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
        };
        return { user: null, error: messages[error.code] || 'Erreur lors de la création du compte.' };
    }
}

/** Send a password reset email */
export async function sendPasswordReset(email: string) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { error: null };
    } catch (err) {
        const error = err as AuthError;
        const messages: Record<string, string> = {
            'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
            'auth/invalid-email': 'Adresse email invalide.',
        };
        return { error: messages[error.code] || 'Erreur lors de l\'envoi du lien.' };
    }
}

/** Set auth persistence (remember me toggle) */
export async function setRememberMe(remember: boolean) {
    try {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    } catch {
        // Silently fail — doesn't break UX
    }
}

export type { User };
