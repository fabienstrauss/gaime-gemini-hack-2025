import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    assets: defineTable({
        name: v.string(),
        storageId: v.id("_storage"),
        type: v.string(), // "image" | "audio" | "video" etc.
        mimeType: v.string(),
    }).index("by_name", ["name"]),

    stories: defineTable({
        prompt: v.string(),
        artStyle: v.union(v.literal("comic"), v.literal("drawing"), v.literal("photorealistic")),
        goal: v.string(),
        totalRooms: v.number(),
    }),

    rooms: defineTable({
        storyId: v.id("stories"),
        roomNumber: v.number(), // 1, 2, or 3
        roomData: v.any(), // JSON object matching Room schema
        transitionVideoUrl: v.optional(v.string()),
    }).index("by_story", ["storyId"]),
});
