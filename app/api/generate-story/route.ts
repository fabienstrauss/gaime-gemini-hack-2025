import { NextRequest, NextResponse } from "next/server";
import { generateStoryRoom, DEFAULT_STORY_OUTLINE } from "@/lib/story-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyOutline } = body;

    // Use provided story outline or default
    const outline = storyOutline || DEFAULT_STORY_OUTLINE;

    console.log("📖 Generating story...");
    console.log("Story outline:", outline.substring(0, 100) + "...");

    // Generate the story room
    const result = await generateStoryRoom(outline);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error generating story:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate story" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log("📖 Generating default story...");

    // Generate with default story outline
    const result = await generateStoryRoom();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error generating story:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate story" },
      { status: 500 }
    );
  }
}
