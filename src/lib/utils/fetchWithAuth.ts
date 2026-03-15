import { auth } from '@/src/lib/firebase/client';

/**
 * Wrapper around fetch that automatically injects the Firebase Auth
 * ID token as a Bearer token in the Authorization header.
 * Use this for all internal API calls that require authentication.
 */
export async function fetchWithAuth(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const user = auth.currentUser;
    const headers = new Headers(options.headers);

    if (user) {
        const token = await user.getIdToken();
        headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(url, { ...options, headers });
}
