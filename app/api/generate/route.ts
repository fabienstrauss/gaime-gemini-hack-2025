import type { ArtStyle } from "@/app/_lib/types";
import { generateRiddle } from "@/app/generateRiddle";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { prompt, artStyle } = (await request.json()) as { prompt?: string; artStyle?: ArtStyle };

    if (!prompt || !artStyle) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await generateRiddle(prompt.trim(), artStyle);

    return NextResponse.json({ success: true });
}

