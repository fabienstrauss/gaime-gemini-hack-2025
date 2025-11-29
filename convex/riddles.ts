import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const createStory_empty = mutation({
    args: {
        prompt: v.string(),
        artStyle: v.union(v.literal("comic"), v.literal("drawing"), v.literal("photorealistic")),
    },
    handler: async (ctx, args) => {
        const storyId = await ctx.db.insert("stories", {
            prompt: args.prompt,
            artStyle: args.artStyle,
            goal: "",
            totalRooms: 3,
        });

        const roomIds: Id<"rooms">[] = [];
        for (let roomNumber = 1; roomNumber <= 3; roomNumber++) {
            const roomId = await ctx.db.insert("rooms", {
                storyId,
                roomNumber,
                roomData: null,
                transitionVideoUrl: undefined,
            });
            roomIds.push(roomId);
        }

        return { storyId, roomIds };
    },
});

export const createStory_basic = mutation({
    args: {
        storyId: v.id("stories"),
        goal: v.string(),
        theme: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.storyId, {
            goal: args.goal,
        });
    },
});

export const updateRoom = mutation({
    args: {
        roomId: v.id("rooms"),
        roomData: v.any(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.roomId, {
            roomData: args.roomData,
        });
    },
});

export const addTransitionVideo = mutation({
    args: {
        roomId: v.id("rooms"),
        transitionVideoUrl: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.roomId, {
            transitionVideoUrl: args.transitionVideoUrl,
        });
    },
});

export const listStories = query({
    args: {},
    handler: async (ctx) => {
        const stories = await ctx.db.query("stories").collect();
        // Sort by creation time (newest first)
        stories.sort((a, b) => b._creationTime - a._creationTime);
        return stories;
    },
});

export const getStoryWithRooms = query({
    args: { storyId: v.id("stories") },
    handler: async (ctx, args) => {
        const story = await ctx.db.get(args.storyId);
        if (!story) return null;

        const rooms = await ctx.db
            .query("rooms")
            .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
            .collect();

        // Sort rooms by room number
        rooms.sort((a, b) => a.roomNumber - b.roomNumber);

        return { ...story, rooms };
    },
});

export const getRoom = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, args) => {
        const room = await ctx.db.get(args.roomId);
        if (!room) return null;

        const story = await ctx.db.get(room.storyId);
        if (!story) return null;

        // Get all rooms for navigation
        const allRooms = await ctx.db
            .query("rooms")
            .withIndex("by_story", (q) => q.eq("storyId", room.storyId))
            .collect();

        // Sort and find next room
        allRooms.sort((a, b) => a.roomNumber - b.roomNumber);
        const currentIndex = allRooms.findIndex(r => r._id === args.roomId);
        const nextRoomId = currentIndex < allRooms.length - 1 ? allRooms[currentIndex + 1]._id : null;

        return {
            ...room,
            story,
            nextRoomId,
            isLastRoom: room.roomNumber === story.totalRooms,
        };
    },
});

export const getFirstRoomId = query({
    args: { storyId: v.id("stories") },
    handler: async (ctx, args) => {
        const allRooms = await ctx.db
            .query("rooms")
            .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
            .collect();

        // Sort by room number and get the first one
        allRooms.sort((a, b) => a.roomNumber - b.roomNumber);
        return allRooms[0]?._id ?? null;
    },
});

export const createStory = mutation({
    args: {
        prompt: v.string(),
        artStyle: v.union(v.literal("comic"), v.literal("drawing"), v.literal("photorealistic")),
        goal: v.string(),
        totalRooms: v.number(),
    },
    handler: async (ctx, args) => {
        const storyId = await ctx.db.insert("stories", {
            prompt: args.prompt,
            artStyle: args.artStyle,
            goal: args.goal,
            totalRooms: args.totalRooms,
        });

        return storyId;
    },
});

export const createRoom = mutation({
    args: {
        storyId: v.id("stories"),
        roomNumber: v.number(),
        roomData: v.any(),
        transitionVideoUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const roomId = await ctx.db.insert("rooms", {
            storyId: args.storyId,
            roomNumber: args.roomNumber,
            roomData: args.roomData,
            transitionVideoUrl: args.transitionVideoUrl,
        });

        return roomId;
    },
});
