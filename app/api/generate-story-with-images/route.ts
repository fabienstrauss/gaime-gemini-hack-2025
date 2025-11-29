import { NextRequest, NextResponse } from "next/server";
import { generateStoryRoomWithImages, DEFAULT_STORY_OUTLINE } from "@/lib/story-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyOutline, generateImages = true } = body;

    // Use provided story outline or default
    const outline = storyOutline || DEFAULT_STORY_OUTLINE;

    console.log("📖 Generating story with images...");
    console.log("Story outline:", outline.substring(0, 100) + "...");

    // Generate the story room with images
    const room = await generateStoryRoomWithImages(outline, generateImages);

    return NextResponse.json({
      success: true,
      room,
      message: generateImages
        ? "Story and images generated successfully"
        : "Story generated successfully (no images)",
    });
  } catch (error: any) {
    console.error("Error generating story with images:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate story with images",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log("📖 Generating default story with images...");

    // Generate with default story outline and images
    const room = await generateStoryRoomWithImages(DEFAULT_STORY_OUTLINE, true);

    return NextResponse.json({
      success: true,
      room,
      message: "Story and images generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating story with images:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate story with images",
      },
      { status: 500 }
    );
  }
}
