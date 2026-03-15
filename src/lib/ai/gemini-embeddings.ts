import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

export const GEMINI_MULTIMODAL_EMBEDDING_MODEL = 'text-embedding-004'; // Fallback to text if multimodal preview fails
export const GEMINI_MULTIMODAL_EMBEDDING_V2 = 'gemini-embedding-2-preview';

export interface MultimodalEmbeddingParams {
    text?: string;
    imageBase64s?: string[];    // Array of base64 image strings 
    imagePaths?: string[];      // Array of local paths or GCS uris
    dimension?: number;         // e.g., 768 or 3072
}

/**
 * Generates an embedding vector using Gemini Embedding 2
 * Supports text, images, and combined inputs.
 */
export async function generateMultimodalEmbedding({ 
    text, 
    imageBase64s = [], 
    dimension = 768 
}: MultimodalEmbeddingParams): Promise<number[] | null> {
    try {
        const parts: any[] = [];
        
        // Add text part
        if (text && text.trim().length > 0) {
            parts.push({ text: text.trim() });
        }

        // Add image parts
        for (const base64 of imageBase64s) {
             // Basic format check
             const mimeType = base64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
             const data = base64.includes(',') ? base64.split(',')[1] : base64;
             
             parts.push({
                 inlineData: {
                     mimeType,
                     data
                 }
             });
        }

        if (parts.length === 0) {
            console.warn('[Gemini Embeddings] No text or image provided to generate embedding.');
            return null;
        }

        const response = await ai.models.embedContent({
            model: GEMINI_MULTIMODAL_EMBEDDING_V2,
            contents: parts,
            config: {
                outputDimensionality: dimension,
                taskType: 'RETRIEVAL_DOCUMENT' // We index catalog items as documents
            }
        });

        const embedding = response.embeddings?.[0]?.values;
        if (!embedding) {
            throw new Error('Gemini API returned an empty embedding array.');
        }

        return embedding;

    } catch (error) {
        console.error('[Gemini Embeddings] Error generating embedding:', error);
        return null;
    }
}
