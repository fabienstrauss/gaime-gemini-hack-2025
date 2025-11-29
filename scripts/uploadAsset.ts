#!/usr/bin/env node

/**
 * Upload assets to Convex storage
 * 
 * Usage:
 *   npm run upload-asset -- /path/to/image.png asset-name
 * 
 * Example:
 *   npm run upload-asset -- public/lab_bg.png lab_bg
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { readFileSync } from "fs";
import { basename } from "path";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
    console.error("Error: NEXT_PUBLIC_CONVEX_URL not found in environment");
    process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function uploadAsset(filePath: string, assetName?: string) {
    try {
        console.log(`📤 Uploading ${filePath}...`);

        // Read the file
        const fileData = readFileSync(filePath);
        const fileName = assetName || basename(filePath);

        // Determine MIME type from extension
        const ext = filePath.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'mp4': 'video/mp4',
        };
        const mimeType = mimeTypes[ext || ''] || 'application/octet-stream';

        // Generate upload URL
        const uploadUrl = await client.mutation(api.assets.generateUploadUrl);

        // Upload the file
        const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": mimeType },
            body: fileData,
        });

        const { storageId } = await response.json();

        // Save asset metadata
        const assetType = mimeType.split('/')[0]; // "image", "audio", "video", etc.
        await client.mutation(api.assets.saveAsset, {
            name: fileName,
            storageId,
            type: assetType,
            mimeType,
        });

        console.log(`✅ Uploaded successfully as "${fileName}"`);
        console.log(`   Storage ID: ${storageId}`);

        // Get and display the URL
        const url = await client.query(api.assets.getAssetUrl, { name: fileName });
        console.log(`   URL: ${url}`);

    } catch (error) {
        console.error("❌ Upload failed:", error);
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
    console.log("Usage: npm run upload-asset -- <file-path> [asset-name]");
    console.log("Example: npm run upload-asset -- public/image.png my_image");
    process.exit(1);
}

const [filePath, assetName] = args;
uploadAsset(filePath, assetName);
