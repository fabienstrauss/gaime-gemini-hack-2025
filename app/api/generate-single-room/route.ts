import { NextRequest, NextResponse } from "next/server";
import { sendPrompt } from "@/lib/gemini";
import { SYSTEM_PROMPT_LOGIC } from "@/lib/prompt-logic";
import type { Room } from "@/app/room/engine/schema";

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

    // Build context from previous rooms
    let contextPrompt = "";
    if (previousRoomStories.length > 0) {
      contextPrompt = `\n\n**Previous Room Context:**\n`;
      previousRoomStories.forEach((story: string, index: number) => {
        contextPrompt += `\nRoom ${index + 1}: ${story}\n`;
      });
      contextPrompt += `\n**Now continue the story for Room ${roomNumber}.**\n`;
    }

    // Create room-specific prompt
    const roomPrompt = buildRoomPrompt(
      storyOutline,
      roomNumber,
      totalRooms,
      previousRoomStories,
      artStyle
    );

    // Call Gemini to generate the room
    const fullPrompt = `${SYSTEM_PROMPT_LOGIC}\n\n${roomPrompt}`;
    const response = await sendPrompt(fullPrompt, "gemini-2.5-flash");

    // Parse the response
    let parsedData: any;
    try {
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.replace(/^```json\n/, "").replace(/\n```$/, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/^```\n/, "").replace(/\n```$/, "");
      }
      parsedData = JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Failed to parse Gemini response:", response);
      throw new Error("Failed to parse room generation response from Gemini");
    }

    // Extract room data
    const roomStory = parsedData.roomStory || parsedData.visualDescription || "";
    const visualDescription = parsedData.visualDescription || "";

    // Build room object (matching your schema)
    const room: Room = {
      backgroundImage: parsedData.backgroundImage || "",
      objects: parsedData.objects || [],
    };

    // Generate image prompts
    const backgroundImagePrompt = `Create a detailed, atmospheric ${artStyle} style image for an escape room game: ${visualDescription}. Style: ${artStyle}, cinematic, immersive, high detail, perfect for a point-and-click adventure game.`;

    const objectImagePrompts: Record<string, string> = {};
    room.objects.forEach((obj: any) => {
      const objectName = obj.name || obj.id;
      objectImagePrompts[obj.id] = `A detailed, high-quality ${artStyle} style image of ${objectName} in the context of: ${visualDescription}. Suitable for an escape room game interface, clear and recognizable, ${artStyle} art style.`;

      // Remove 'name' field if it exists (not in schema)
      if (obj.name) {
        delete obj.name;
      }
    });

    // For now, return placeholder URLs for images
    // In production, these would be generated and uploaded to Convex
    const backgroundImageUrl = generatePlaceholderImage(artStyle, "background", roomNumber);
    const objectImageUrls: Record<string, string> = {};

    room.objects.forEach((obj: any) => {
      objectImageUrls[obj.id] = generatePlaceholderImage(artStyle, obj.id, roomNumber);
      obj.image = objectImageUrls[obj.id];
    });

    room.backgroundImage = backgroundImageUrl;

    console.log(`✅ Room ${roomNumber} generated with ${room.objects.length} objects`);

    return NextResponse.json({
      success: true,
      roomStory,
      roomData: room,
      backgroundImageUrl,
      objectImageUrls,
      imagePrompts: {
        background: backgroundImagePrompt,
        objects: objectImagePrompts,
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
 * Build the prompt for generating a specific room
 */
function buildRoomPrompt(
  storyOutline: string,
  roomNumber: number,
  totalRooms: number,
  previousRoomStories: string[],
  artStyle: string
): string {
  let prompt = `**Overall Story:**\n"${storyOutline}"\n\n`;

  if (previousRoomStories.length > 0) {
    prompt += `**Previous Rooms (for context):**\n`;
    previousRoomStories.forEach((story, index) => {
      prompt += `Room ${index + 1}: ${story}\n\n`;
    });
  }

  prompt += `**Task:**\n`;
  prompt += `Generate Room ${roomNumber} of ${totalRooms}.\n\n`;

  if (roomNumber === 1) {
    prompt += `This is the FIRST room. The player starts here. Introduce the story and setting. Create a puzzle that leads to discovering the key or code to exit to the next room.\n\n`;
  } else if (roomNumber === totalRooms) {
    prompt += `This is the FINAL room (room ${roomNumber}). Build on the previous rooms' story. Create the final challenge. The player should feel a sense of accomplishment when they solve it. Use 'action: "finish"' for the final escape option.\n\n`;
  } else {
    prompt += `This is room ${roomNumber} (middle room). Continue the story from the previous room(s). Create puzzles that connect to what happened before and hint at what's coming next. The exit should lead to the next room.\n\n`;
  }

  prompt += `**Art Style:** ${artStyle}\n`;
  prompt += `Make sure the visual description matches the ${artStyle} art style.\n\n`;

  prompt += `**Response Format:**\n`;
  prompt += `Return JSON with these fields:\n`;
  prompt += `- roomStory: A short narrative (2-3 sentences) describing what happens in this room\n`;
  prompt += `- visualDescription: Detailed scene description for image generation\n`;
  prompt += `- backgroundImage: "" (leave empty)\n`;
  prompt += `- objects: Array of interactive objects with puzzle logic\n\n`;

  prompt += `Make sure objects have proper puzzle dependencies and the story flows naturally from the previous room(s).`;

  return prompt;
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
