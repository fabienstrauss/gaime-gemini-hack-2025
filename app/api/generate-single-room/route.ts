import { NextRequest, NextResponse } from "next/server";
import type { Level } from "@/app/room/engine/schema";
import { generateLevelFromPrompt } from "@/lib/story-generator";
import { buildRoomPrompt } from "@/lib/room-prompts";

/**
 * Generate a single room with context from previous rooms
 * This creates sequential, story-connected rooms
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storyOutline,
      artStyle,
      roomNumber,
      previousRoomStories = [],
      totalRooms = 3,
    } = body;

    if (!storyOutline) {
      return NextResponse.json(
        { error: "storyOutline is required" },
        { status: 400 }
      );
    }

    console.log(`\n🎨 Generating Room ${roomNumber}/${totalRooms}`);
    console.log(`Art Style: ${artStyle}`);
    console.log(`Previous rooms: ${previousRoomStories.length}`);

    // Create room-specific prompt
    const roomPrompt = buildRoomPrompt(
      storyOutline,
      roomNumber,
      totalRooms,
      previousRoomStories,
      artStyle
    );

    const generationResult = await generateLevelFromPrompt(roomPrompt);
    const { level, room, visualDescription, imagePrompts } = generationResult;

    const backgroundImagePrompt = `Create a detailed, atmospheric ${artStyle} style image for an escape room game: ${visualDescription}. Style: ${artStyle}, cinematic, immersive, high detail, perfect for a point-and-click adventure game.`;

    const styledObjectPrompts: Record<string, string> = {};
    room.objects.forEach((obj) => {
      const basePrompt = imagePrompts.objects[obj.id] ?? `A detailed object named ${obj.id}`;
      styledObjectPrompts[obj.id] = `${basePrompt} Style: ${artStyle}, highly readable, designed for a point-and-click escape game.`;
    });

    // For now, return placeholder URLs for images
    // In production, these would be generated and uploaded to Convex
    const backgroundImageUrl = generatePlaceholderImage(artStyle, "background", roomNumber);
    const objectImageUrls: Record<string, string> = {};

    const decoratedObjects = room.objects.map((obj) => {
      objectImageUrls[obj.id] = generatePlaceholderImage(artStyle, obj.id, roomNumber);
      return {
        ...obj,
        image: objectImageUrls[obj.id],
      };
    });

    const levelWithImages: Level = {
      ...level,
      room: {
        ...room,
        backgroundImage: backgroundImageUrl,
        objects: decoratedObjects,
      },
    };

    console.log(`✅ Room ${roomNumber} generated with ${decoratedObjects.length} objects`);

    return NextResponse.json({
      success: true,
      roomStory: visualDescription,
      roomData: levelWithImages,
      backgroundImageUrl,
      objectImageUrls,
      imagePrompts: {
        background: backgroundImagePrompt,
        objects: styledObjectPrompts,
      },
    });
  } catch (error: any) {
    console.error("Error generating single room:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate room",
      },
      { status: 500 }
    );
  }
}

/**
 * Generate placeholder image URL
 * In production, this would call Imagen API
 */
function generatePlaceholderImage(artStyle: string, objectId: string, roomNumber: number): string {
  const width = objectId === "background" ? 1920 : 1024;
  const height = objectId === "background" ? 1080 : 1024;

  const colors: Record<string, string> = {
    comic: "FF6B6B/FFE66D",
    drawing: "8B7355/F5E6D3",
    photorealistic: "2C3E50/ECF0F1",
  };

  const color = colors[artStyle as keyof typeof colors] || "333333/FFFFFF";
  const text = `Room${roomNumber}-${objectId}`;

  return `https://placehold.co/${width}x${height}/${color}?text=${encodeURIComponent(text)}`;
}
