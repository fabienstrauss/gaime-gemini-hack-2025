import { NextRequest, NextResponse } from "next/server";
import type { Room } from "@/app/room/engine/schema";

/**
 * Save a generated room to a data file
 * This creates a new file in app/room/data/ with the generated room
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, filename = "generated-room" } = body as { room: Room; filename?: string };

    if (!room || !room.objects) {
      return NextResponse.json(
        { error: "Invalid room data" },
        { status: 400 }
      );
    }

    const fs = await import("fs/promises");
    const path = await import("path");

    // Create the file content
    const fileContent = `import type { Room } from '../engine';

export const ${filename.replace(/-/g, "_")}Data: Room = ${JSON.stringify(room, null, 2)};
`;

    // Save to app/room/data/
    const dataDir = path.join(process.cwd(), "app", "room", "data");
    const filepath = path.join(dataDir, `${filename}.ts`);

    await fs.writeFile(filepath, fileContent, "utf-8");

    return NextResponse.json({
      success: true,
      message: `Room saved to app/room/data/${filename}.ts`,
      filepath: `app/room/data/${filename}.ts`,
    });
  } catch (error: any) {
    console.error("Error saving room:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save room",
      },
      { status: 500 }
    );
  }
}
