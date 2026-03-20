'use server';

import { admin } from '@/src/lib/firebase/admin';

export async function uploadFileAction(formData: FormData) {
    const token = formData.get('token') as string;
    if (!token) {
        throw new Error('Unauthorized: No token provided');
    }

    try {
        await admin.auth().verifyIdToken(token);
    } catch (e) {
        throw new Error('Unauthorized: Invalid token');
    }

    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file provided');
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Use JPEG, PNG, WebP, GIF, SVG, MP4, WebM, MOV, PDF.');
    }

    // Validate file size (max 100MB for video, 25MB for images/PDF)
    const isVideo = file.type.startsWith('video/');
    const maxSizeMB = isVideo ? 100 : 25;
    if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${maxSizeMB}MB.`);
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^.]+$/, '').substring(0, 60);
    const filename = `${sanitized}_${timestamp}.${ext}`;
    const subDir = isVideo ? 'media' : 'editor';
    const storagePath = `uploads/${subDir}/${filename}`;

    try {
        // Upload to Firebase Storage via Admin SDK
        const bucket = admin.storage().bucket();
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileRef = bucket.file(storagePath);
        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
                cacheControl: 'public, max-age=31536000',
            },
        });

        // Make the file publicly readable
        await fileRef.makePublic();

        // Build the permanent public URL
        const bucketName = bucket.name;
        const encodedPath = encodeURIComponent(storagePath);
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodedPath}`;

        return {
            url: publicUrl,
            filename,
            size: file.size,
            type: file.type,
        };
    } catch (error: any) {
        console.error('[Upload Action] Firebase Storage error:', error);
        throw new Error(error.message || 'Upload failed');
    }
}
