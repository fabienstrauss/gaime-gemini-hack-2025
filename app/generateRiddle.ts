"use server";

import { Buffer } from "buffer";
import { ConvexHttpClient } from "convex/browser";
import type { ArtStyle } from "@/app/_lib/types";
import { Level, Room } from "@/app/room/engine";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexHttpClient(CONVEX_URL);

export const createStoryEmptyMutation = (args: { prompt: string; artStyle: ArtStyle }) =>
    convex.mutation(api.riddles.createStory_empty, args);

export const createStoryBasicMutation = (args: { storyId: Id<"stories">; goal: string; theme?: string; description?: string }) =>
    convex.mutation(api.riddles.createStory_basic, args);

export const updateRoomMutation = (args: { roomId: Id<"rooms">; roomData: Level }) =>
    convex.mutation(api.riddles.updateRoom, args);

export const addTransitionVideoMutation = (args: { roomId: Id<"rooms">; transitionVideoUrl: string }) =>
    convex.mutation(api.riddles.addTransitionVideo, args);

export const saveAssetMutation = (args: { name: string; storageId: Id<"_storage">; type: string; mimeType: string }) =>
    convex.mutation(api.assets.saveAsset, args);

export async function saveAssetFromTemporaryFile({
    tempFileUrl,
    name,
    mimeType,
}: {
    tempFileUrl: string;
    name?: string;
    mimeType?: string;
}) {
    const tempFileResponse = await fetch(tempFileUrl);
    if (!tempFileResponse.ok) {
        throw new Error("Failed to download temporary file");
    }

    const resolvedMimeType = mimeType ?? tempFileResponse.headers.get("content-type") ?? "application/octet-stream";
    const resolvedName =
        name ??
        (() => {
            try {
                const url = new URL(tempFileUrl);
                const basename = url.pathname.split("/").filter(Boolean).pop();
                return basename ?? `asset-${Date.now()}`;
            } catch {
                return `asset-${Date.now()}`;
            }
        })();
    const resolvedType = resolvedMimeType.split("/")[0] ?? "other";

    const arrayBuffer = await tempFileResponse.arrayBuffer();
    const uploadUrl = await convex.mutation(api.assets.generateUploadUrl);

    const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": resolvedMimeType },
        body: Buffer.from(arrayBuffer),
    });

    if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to Convex storage");
    }

    const { storageId } = (await uploadResponse.json()) as { storageId: string };

    await saveAssetMutation({
        name: resolvedName,
        storageId: storageId as Id<"_storage">,
        type: resolvedType,
        mimeType: resolvedMimeType,
    });

    return { name: resolvedName, storageId };
}

export async function generateStoryOutline(
    prompt: string,
    artStyle: ArtStyle
): Promise<{
    goal: string;
    theme: string;
    description: string;
}> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
        goal: `Complete the challenge: ${prompt}`,
        theme: prompt.toLowerCase().includes("escape") ? "escape" : "adventure",
        description: `An exciting ${artStyle} adventure where you must ${prompt}`,
    };
}

export async function generateRoom(
    roomNumber: number,
    storyOutline: { goal: string; theme: string; description: string },
    artStyle: ArtStyle,
    previousRoomData?: Level | null
): Promise<Level> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const roomDefinition: Room = {
        backgroundImage: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2544&auto=format&fit=crop",
        objects: [
            {
                id: `object-${roomNumber}`,
                area: { x: 40, y: 20, width: 20, height: 60 },
                text: [
                    {
                        content: previousRoomData
                            ? `Room ${roomNumber}: Continuing from the previous room in this ${storyOutline.theme} adventure.`
                            : `Room ${roomNumber}: This is a placeholder room for the ${storyOutline.theme} theme.`,
                    },
                ],
                options: [
                    {
                        label: "Continue",
                        action: "finish" as const,
                    },
                ],
            },
        ],
    };

    return {
        id: `level-${roomNumber}`,
        room: roomDefinition,
        initialState: {},
    };
}

export async function generateVideoTransition(
    fromRoomNumber: number,
    toRoomNumber: number,
    storyOutline: { goal: string; theme: string; description: string },
    artStyle: ArtStyle
): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const placeholderVideos = [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    ];

    return placeholderVideos[(fromRoomNumber - 1) % placeholderVideos.length];
}

export async function generateRiddle(prompt: string, artStyle: ArtStyle): Promise<void> {
    const { storyId, roomIds } = await createStoryEmptyMutation({ prompt, artStyle });
    const storyOutline = await generateStoryOutline(prompt, artStyle);
    await createStoryBasicMutation({ storyId, goal: storyOutline.goal, theme: storyOutline.theme, description: storyOutline.description });
    let previousRoomData: Level | null = null;

    for (let i = 0; i < roomIds.length; i++) {
        const roomNumber = i + 1;
        const roomData = await generateRoom(roomNumber, storyOutline, artStyle, previousRoomData);
        await updateRoomMutation({ roomId: roomIds[i], roomData });
        previousRoomData = roomData;
    }

    for (let i = 0; i < roomIds.length - 1; i++) {
        const fromRoomNumber = i + 1;
        const toRoomNumber = i + 2;
        const transitionVideoUrl = await generateVideoTransition(fromRoomNumber, toRoomNumber, storyOutline, artStyle);
        await addTransitionVideoMutation({ roomId: roomIds[i], transitionVideoUrl });
    }
}
