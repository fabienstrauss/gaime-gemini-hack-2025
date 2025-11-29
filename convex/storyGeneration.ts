/**
 * Convex actions for AI-powered story and room generation
 * Actions can call external APIs (Gemini, Imagen)
 */
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Generate a complete 3-room story sequentially
 * Each room builds on the previous rooms
 */
export const generateCompleteStory = action({
  args: {
    storyOutline: v.string(),
    artStyle: v.union(v.literal("comic"), v.literal("drawing"), v.literal("photorealistic")),
  },
  handler: async (ctx, args) => {
    const { storyOutline, artStyle } = args;

    console.log("🎮 Starting complete story generation...");
    console.log("Story:", storyOutline);
    console.log("Art Style:", artStyle);

    // Step 1: Create story record in Convex
    const storyId = await ctx.runMutation(api.riddles.createStory, {
      prompt: storyOutline,
      artStyle: artStyle,
      goal: `Complete all 3 rooms to escape`,
      totalRooms: 3,
      room_stories: [],
      status: "generating",
    });

    console.log(`✅ Story created with ID: ${storyId}`);

    const roomStories: string[] = [];
    const roomIds: string[] = [];

    // Step 2: Generate rooms sequentially (1 → 2 → 3)
    for (let roomNumber = 1; roomNumber <= 3; roomNumber++) {
      console.log(`\n📍 Generating Room ${roomNumber}/3...`);

      try {
        // Generate this room (using previous rooms as context)
        const roomResult = await generateSingleRoom(
          storyOutline,
          artStyle,
          roomNumber,
          roomStories, // Previous room stories for context
          roomIds // Previous room data for continuity
        );

        // Save room to Convex
        const roomId = await ctx.runMutation(api.riddles.createRoom, {
          storyId: storyId,
          roomNumber: roomNumber,
          roomStory: roomResult.roomStory,
          roomData: roomResult.roomData,
          ready: true,
        });

        console.log(`✅ Room ${roomNumber} created with ID: ${roomId}`);

        // Save the story and room ID for next iteration
        roomStories.push(roomResult.roomStory);
        roomIds.push(roomId);

        // Update room with images
        if (roomResult.backgroundImageUrl) {
          // Upload background image to Convex storage
          const bgAssetId = await uploadImageToConvexStorage(
            ctx,
            roomResult.backgroundImageUrl,
            `story-${storyId}-room-${roomNumber}-background`,
            artStyle
          );

          await ctx.runMutation(api.riddles.updateRoomImages, {
            roomId: roomId,
            backgroundImageAssetId: bgAssetId,
          });
        }

        // Upload object images
        if (roomResult.objectImageUrls) {
          const objectAssetIds: Record<string, string> = {};

          for (const [objectId, imageUrl] of Object.entries(roomResult.objectImageUrls)) {
            const assetId = await uploadImageToConvexStorage(
              ctx,
              imageUrl,
              `story-${storyId}-room-${roomNumber}-object-${objectId}`,
              artStyle
            );
            objectAssetIds[objectId] = assetId;
          }

          await ctx.runMutation(api.riddles.updateRoomImages, {
            roomId: roomId,
            objectImageAssetIds: objectAssetIds,
          });
        }

      } catch (error: any) {
        console.error(`❌ Failed to generate room ${roomNumber}:`, error);

        // Mark story as failed
        await ctx.runMutation(api.riddles.updateStoryStatus, {
          storyId: storyId,
          status: "failed",
        });

        throw error;
      }
    }

    // Step 3: Update story with room_stories and mark as completed
    await ctx.runMutation(api.riddles.updateStoryWithRooms, {
      storyId: storyId,
      room_stories: roomStories,
      status: "completed",
    });

    console.log("\n✅ Complete story generation finished!");
    console.log(`Story ID: ${storyId}`);
    console.log(`Rooms: ${roomIds.join(", ")}`);

    return {
      storyId,
      roomIds,
      firstRoomId: roomIds[0],
    };
  },
});

/**
 * Generate a single room using Gemini
 * Uses previous rooms as context for continuity
 */
async function generateSingleRoom(
  storyOutline: string,
  artStyle: string,
  roomNumber: number,
  previousRoomStories: string[],
  previousRoomIds: string[]
): Promise<{
  roomStory: string;
  roomData: any;
  backgroundImageUrl?: string;
  objectImageUrls?: Record<string, string>;
}> {
  // Call our Next.js API endpoint for generation
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(`${apiUrl}/api/generate-single-room`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      storyOutline,
      artStyle,
      roomNumber,
      previousRoomStories,
      totalRooms: 3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate room ${roomNumber}: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
}

/**
 * Upload image URL to Convex storage
 * For now, this is a placeholder - images should be uploaded via the client
 */
async function uploadImageToConvexStorage(
  ctx: any,
  imageUrl: string,
  assetName: string,
  artStyle: string
): Promise<string> {
  // TODO: Implement actual image upload
  // For now, we'll store the URL directly
  // In production, you'd download the image and upload to Convex storage

  console.log(`📦 Saving asset: ${assetName}`);

  // This is a placeholder - actual implementation would:
  // 1. Download image from imageUrl
  // 2. Upload to Convex storage via generateUploadUrl
  // 3. Save asset metadata

  return imageUrl; // Placeholder
}
