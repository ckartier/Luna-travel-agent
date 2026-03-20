import { auth } from '@/src/lib/firebase/client';

/**
 * Wrapper around fetch that automatically injects the Firebase Auth
 * ID token as a Bearer token in the Authorization header.
 * Use this for all internal API calls that require authentication.
 * 
 * NOTE: When body is FormData, Content-Type is NOT set so the browser
 * can auto-set multipart/form-data with the correct boundary.
 */
export async function fetchWithAuth(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const user = auth.currentUser;
    const headers: Record<string, string> = {};

    // Copy existing headers (if any)
    if (options.headers) {
        if (options.headers instanceof Headers) {
            options.headers.forEach((v, k) => { headers[k] = v; });
        } else if (Array.isArray(options.headers)) {
            options.headers.forEach(([k, v]) => { headers[k] = v; });
        } else {
            Object.assign(headers, options.headers);
        }
    }

    // Add auth token
    if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }

    // When body is FormData, remove Content-Type so browser sets multipart boundary
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    return fetch(url, { ...options, headers });
}
