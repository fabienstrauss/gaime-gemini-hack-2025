import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a short-lived upload URL for file uploads
export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

// Save asset metadata after a successful upload
export const saveAsset = mutation({
    args: {
        name: v.string(),
        storageId: v.id("_storage"),
        type: v.string(),
        mimeType: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if asset with this name already exists
        const existing = await ctx.db
            .query("assets")
            .withIndex("by_name", (q) => q.eq("name", args.name))
            .first();

        if (existing) {
            // Update existing asset
            await ctx.db.patch(existing._id, {
                storageId: args.storageId,
                type: args.type,
                mimeType: args.mimeType,
            });
            return existing._id;
        } else {
            // Create new asset
            return await ctx.db.insert("assets", {
                name: args.name,
                storageId: args.storageId,
                type: args.type,
                mimeType: args.mimeType,
            });
        }
    },
});

// Get asset URL by name
export const getAssetUrl = query({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        const asset = await ctx.db
            .query("assets")
            .withIndex("by_name", (q) => q.eq("name", args.name))
            .first();

        if (!asset) {
            return null;
        }

        const url = await ctx.storage.getUrl(asset.storageId);
        return url;
    },
});

// Get multiple assets by their names
export const getAssetsByNames = query({
    args: { names: v.array(v.string()) },
    handler: async (ctx, args) => {
        const assetsWithUrls = await Promise.all(
            args.names.map(async (name) => {
                const asset = await ctx.db
                    .query("assets")
                    .withIndex("by_name", (q) => q.eq("name", name))
                    .first();

                if (!asset) {
                    return { name, url: null };
                }

                const url = await ctx.storage.getUrl(asset.storageId);
                return { name, url };
            })
        );

        return assetsWithUrls;
    },
});

// Get all assets
export const listAssets = query({
    args: {},
    handler: async (ctx) => {
        const assets = await ctx.db.query("assets").collect();

        const assetsWithUrls = await Promise.all(
            assets.map(async (asset) => {
                const url = await ctx.storage.getUrl(asset.storageId);
                return {
                    ...asset,
                    url,
                };
            })
        );

        return assetsWithUrls;
    },
});

// Delete an asset
export const deleteAsset = mutation({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        const asset = await ctx.db
            .query("assets")
            .withIndex("by_name", (q) => q.eq("name", args.name))
            .first();

        if (asset) {
            await ctx.storage.delete(asset.storageId);
            await ctx.db.delete(asset._id);
        }
    },
});
