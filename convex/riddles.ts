import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { generateRoomTransitionVideo } from "@/app/transition/actions";

// Mock room templates - using simplified versions for generation
const mockRoomTemplates = {
    escapeRoom: {
        backgroundImage: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2544&auto=format&fit=crop",
        objects: [
            {
                id: "door",
                area: { x: 40, y: 20, width: 20, height: 60 },
                text: [
                    { content: "The heavy door is locked tight.", condition: { requiredFalse: ["doorOpen"] } },
                    { content: "The door is unlocked! Freedom awaits!", condition: { requiredTrue: ["doorOpen"] } }
                ],
                options: [
                    { label: "Try to open", action: "none", condition: { requiredFalse: ["doorOpen", "hasKey"] } },
                    { label: "Unlock with Key", action: "none", effects: { setTrue: ["doorOpen"] }, condition: { requiredTrue: ["hasKey"], requiredFalse: ["doorOpen"] } },
                    { label: "Exit!", action: "finish", condition: { requiredTrue: ["doorOpen"] } }
                ]
            },
            {
                id: "rug",
                area: { x: 30, y: 80, width: 40, height: 15 },
                text: [
                    { content: "A dusty old rug covers the floor.", condition: { requiredFalse: ["rugLifted"] } },
                    { content: "The rug is lifted. Nothing underneath now.", condition: { requiredTrue: ["rugLifted"] } }
                ],
                options: [
                    { label: "Lift Rug", action: "none", effects: { setTrue: ["rugLifted"] }, condition: { requiredFalse: ["rugLifted"] } }
                ]
            },
            {
                id: "key",
                area: { x: 45, y: 85, width: 5, height: 5 },
                image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=2000&auto=format&fit=crop",
                visibleCondition: { requiredTrue: ["rugLifted"], requiredFalse: ["hasKey"] },
                text: [{ content: "A shiny key was hidden under the rug!" }],
                options: [
                    { label: "Take Key", action: "none", effects: { setTrue: ["hasKey"] } }
                ]
            }
        ]
    },
    nanoBana: {
        backgroundImage: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2544&auto=format&fit=crop",
        objects: [
            {
                id: "artifact",
                area: { x: 35, y: 30, width: 30, height: 40 },
                text: [
                    { content: "A mysterious artifact glows within a protective field.", condition: { requiredFalse: ["fieldDown", "artifactTaken"] } },
                    { content: "The field is down. The artifact is within reach.", condition: { requiredTrue: ["fieldDown"], requiredFalse: ["artifactTaken"] } },
                    { content: "The artifact is gone.", condition: { requiredTrue: ["artifactTaken"] } }
                ],
                options: [
                    { label: "Deactivate Field", action: "none", effects: { setTrue: ["fieldDown"] }, condition: { requiredFalse: ["fieldDown"] } },
                    { label: "Take Artifact", action: "finish", effects: { setTrue: ["artifactTaken"] }, condition: { requiredTrue: ["fieldDown"], requiredFalse: ["artifactTaken"] } }
                ]
            },
            {
                id: "terminal",
                area: { x: 70, y: 50, width: 15, height: 20 },
                text: [{ content: "A terminal displays complex data. All systems nominal." }],
                options: [{ label: "Read Logs", action: "none" }]
            }
        ]
    }
};


export const generateRiddle = mutation({
    args: {
        prompt: v.string(),
        artStyle: v.union(v.literal("comic"), v.literal("drawing"), v.literal("photorealistic")),
    },
    handler: async (ctx, args) => {
        // Generate a goal based on the prompt (mock logic)
        const goal = `Complete the challenge: ${args.prompt}`;

        // Create the story
        const storyId = await ctx.db.insert("stories", {
            prompt: args.prompt,
            artStyle: args.artStyle,
            goal,
            room_stories: [],
            totalRooms: 3,
        });

        // Generate 3 rooms
        const roomIds: Id<"rooms">[] = [];

        // First, create all rooms without transition videos
        for (let roomNumber = 1; roomNumber <= 3; roomNumber++) {
            // Alternate between templates
            const template = roomNumber === 2 ? mockRoomTemplates.nanoBana : mockRoomTemplates.escapeRoom;

            const roomId = await ctx.db.insert("rooms", {
                storyId,
                roomNumber,
                roomData: template,
                ready: false,
            });

            roomIds.push(roomId);
        }

        // Then, generate transition videos for consecutive room pairs
        for (let i = 0; i < roomIds.length - 1; i++) {
            const currentRoomId = roomIds[i];
            const nextRoomId = roomIds[i + 1];

            const transitionResult = await generateRoomTransitionVideo({
                firstRoomId: currentRoomId,
                lastRoomId: nextRoomId,
            });

            if (!transitionResult.success) {
                throw new Error(`Failed to generate transition video between room ${i + 1} and ${i + 2}: ${transitionResult.error}`);
            }

            // Update the current room with the transition video URL
            await ctx.db.patch(currentRoomId, {
                transitionVideoUrl: transitionResult.videoUrl,
                ready: true,
            });
        }

        // Mark the last room as ready (no transition video needed)
        await ctx.db.patch(roomIds[roomIds.length - 1], {
            ready: true,
        });

        return {
            storyId,
            firstRoomId: roomIds[0],
        };
    },
});

export const listStories = query({
    args: {},
    handler: async (ctx) => {
        const stories = await ctx.db.query("stories").order("desc").collect();
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
            room_stories: [],
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
        ready: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const roomId = await ctx.db.insert("rooms", {
            storyId: args.storyId,
            roomNumber: args.roomNumber,
            roomData: args.roomData,
            transitionVideoUrl: args.transitionVideoUrl,
            ready: args.ready ?? false,
        });

        return roomId;
    },
});
