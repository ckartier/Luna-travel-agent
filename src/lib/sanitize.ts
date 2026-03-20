'use client';

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML string to prevent XSS attacks.
 * Uses DOMPurify with a permissive but safe configuration.
 * Allows styling elements (for GrapesJS / editor output) but strips scripts.
 */
export function sanitizeHtml(dirty: string): string {
    if (typeof window === 'undefined') return ''; // SSR: strip all HTML to prevent XSS (DOMPurify requires DOM)
    return DOMPurify.sanitize(dirty, {
        USE_PROFILES: { html: true, svg: true },
        ADD_TAGS: ['style'],               // Allow <style> for GrapesJS CSS
        ADD_ATTR: ['target', 'rel', 'style', 'class', 'data-luna-form', 'data-luna', 'data-editor-section'],
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    });
}

/**
 * Sanitize CSS string — strips anything that could execute JS
 * (expression(), url(javascript:), behavior(), @import with data:)
 */
export function sanitizeCss(dirty: string): string {
    return dirty
        .replace(/expression\s*\(/gi, '/* blocked */(')
        .replace(/url\s*\(\s*['"]?\s*javascript:/gi, 'url(/* blocked */')
        .replace(/behavior\s*:/gi, '/* blocked */:')
        .replace(/@import\s+url\s*\(\s*['"]?\s*data:/gi, '/* blocked */');
}
