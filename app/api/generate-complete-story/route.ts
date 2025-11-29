import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * API endpoint to trigger complete 3-room story generation via Convex
 * This orchestrates the sequential room generation process
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyOutline, artStyle = "photorealistic" } = body;

    if (!storyOutline) {
      return NextResponse.json(
        { error: "storyOutline is required" },
        { status: 400 }
      );
    }

    console.log("\n🎮 Starting Complete Story Generation");
    console.log("Story Outline:", storyOutline);
    console.log("Art Style:", artStyle);

    // Validate art style
    const validStyles = ["comic", "drawing", "photorealistic"];
    if (!validStyles.includes(artStyle)) {
      return NextResponse.json(
        { error: `artStyle must be one of: ${validStyles.join(", ")}` },
        { status: 400 }
      );
    }

    // Initialize Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
    }

    const client = new ConvexHttpClient(convexUrl);

    // Trigger the Convex action
    console.log("🔄 Triggering Convex action...");

    const result = await client.action(api.storyGeneration.generateCompleteStory, {
      storyOutline,
      artStyle: artStyle as "comic" | "drawing" | "photorealistic",
    });

    console.log("✅ Story generation complete!");
    console.log("Story ID:", result.storyId);
    console.log("First Room ID:", result.firstRoomId);

    return NextResponse.json({
      success: true,
      ...result,
      message: "Complete 3-room story generated successfully!",
      playUrl: `/play/${result.firstRoomId}`,
    });
  } catch (error: any) {
    console.error("❌ Error generating complete story:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate complete story",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check status or get info
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/generate-complete-story",
    method: "POST",
    description: "Generate a complete 3-room escape game story",
    requiredFields: {
      storyOutline: "string - The main story outline",
      artStyle: "comic | drawing | photorealistic (optional, defaults to photorealistic)",
    },
    example: {
      storyOutline:
        "You wake up in a mysterious laboratory. Three rooms separate you from freedom. Each room holds a piece of the escape code.",
      artStyle: "photorealistic",
    },
    workflow: [
      "1. Creates story in Convex database",
      "2. Generates Room 1 with Gemini",
      "3. Generates images for Room 1 (placeholder URLs)",
      "4. Saves Room 1 to Convex",
      "5. Generates Room 2 using Room 1 as context",
      "6. Generates images for Room 2",
      "7. Saves Room 2 to Convex",
      "8. Generates Room 3 using Rooms 1 & 2 as context",
      "9. Generates images for Room 3",
      "10. Saves Room 3 to Convex",
      "11. Marks story as completed",
      "12. Returns story ID and first room ID",
    ],
  });
}
