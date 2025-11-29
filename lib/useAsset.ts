"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook to get multiple asset URLs by their names
 * @param names - Array of asset names to retrieve
 * @returns Record mapping asset names to their URLs (undefined if not found)
 */
export function useAssets(names: string[]) {
    const assets = useQuery(api.assets.getAssetsByNames, { names });

    // Convert array to a record for easy lookup
    if (!assets) return undefined;

    return assets.reduce((acc, asset) => {
        if (asset.url) {
            acc[asset.name] = asset.url;
        }
        return acc;
    }, {} as Record<string, string>);
}

/**
 * Hook to store an asset
 * @returns Function to upload and store an asset
 */
export function useStoreAsset() {
    const generateUploadUrl = useMutation(api.assets.generateUploadUrl);
    const saveAsset = useMutation(api.assets.saveAsset);

    return async (file: File, name: string) => {
        try {
            // Generate upload URL
            const uploadUrl = await generateUploadUrl();

            // Upload the file
            const response = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            const { storageId } = await response.json();

            // Determine asset type from MIME type
            const assetType = file.type.split('/')[0]; // "image", "audio", "video", etc.

            // Save asset metadata
            await saveAsset({
                name,
                storageId,
                type: assetType,
                mimeType: file.type,
            });

            return { success: true, name, storageId };
        } catch (error) {
            console.error("Failed to store asset:", error);
            return { success: false, error };
        }
    };
}
