import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { admin } from '@/src/lib/firebase/admin';

// Upload image/video files to Firebase Storage for permanent cloud storage
export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP, GIF, SVG, MP4, WebM, MOV.' }, { status: 400 });
        }

        // Validate file size (max 100MB for video, 25MB for images)
        const isVideo = file.type.startsWith('video/');
        const maxSizeMB = isVideo ? 100 : 25;
        if (file.size > maxSizeMB * 1024 * 1024) {
            return NextResponse.json({ error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${maxSizeMB}MB.` }, { status: 400 });
        }

        // Generate unique filename
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const timestamp = Date.now();
        const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^.]+$/, '').substring(0, 60);
        const filename = `${sanitized}_${timestamp}.${ext}`;
        const subDir = isVideo ? 'media' : 'editor';
        const storagePath = `uploads/${subDir}/${filename}`;

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

        return NextResponse.json({
            url: publicUrl,
            filename,
            size: file.size,
            type: file.type,
        });
    } catch (error: any) {
        console.error('[Upload] Firebase Storage error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
