"use server";

import { Buffer } from "buffer";
import { ConvexHttpClient } from "convex/browser";
import type { ArtStyle } from "@/app/_lib/types";
import { Level, Room } from "@/app/room/engine";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { GoogleGenAI } from "@google/genai";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;

if (!CONVEX_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

if (!GEMINI_API_KEY) {
    throw new Error("GOOGLE_GENAI_API_KEY is not set");
}

const convex = new ConvexHttpClient(CONVEX_URL);
const googleAiClient = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
});

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
    transitionPrompt: string,
    firstRoom: Level,
    lastRoom: Level
): Promise<string> {
    try {
        const firstFrameUrl = firstRoom.room.backgroundImage;
        const lastFrameUrl = lastRoom.room.backgroundImage;

        if (!firstFrameUrl || !lastFrameUrl) {
            throw new Error("Both rooms must have background images");
        }

        const [firstFrameResponse, lastFrameResponse] = await Promise.all([
            fetch(firstFrameUrl),
            fetch(lastFrameUrl),
        ]);

        if (!firstFrameResponse.ok || !lastFrameResponse.ok) {
            throw new Error("Failed to fetch one or both images");
        }

        const firstFrameBuffer = await firstFrameResponse.arrayBuffer();
        const lastFrameBuffer = await lastFrameResponse.arrayBuffer();
        const firstFrameBase64 = Buffer.from(firstFrameBuffer).toString("base64");
        const lastFrameBase64 = Buffer.from(lastFrameBuffer).toString("base64");

        const firstFrameMimeType = (firstFrameResponse.headers.get("content-type") || "image/jpeg") as
            | "image/png"
            | "image/jpeg";
        const lastFrameMimeType = (lastFrameResponse.headers.get("content-type") || "image/jpeg") as
            | "image/png"
            | "image/jpeg";

        let operation = await googleAiClient.models.generateVideos({
            model: "veo-3.1-fast-generate-preview",
            prompt: transitionPrompt,
            image: {
                imageBytes: firstFrameBase64,
                mimeType: firstFrameMimeType,
            },
            config: {
                lastFrame: {
                    imageBytes: lastFrameBase64,
                    mimeType: lastFrameMimeType,
                },
                aspectRatio: "16:9",
            },
        });

        while (!operation.done) {
            await new Promise((resolve) => setTimeout(resolve, 10000));
            operation = await googleAiClient.operations.getVideosOperation({
                operation,
            });
        }

        const generatedVideoRef = operation.response?.generatedVideos?.[0]?.video;

        if (!generatedVideoRef) {
            throw new Error("No video generated in response");
        }

        const tempPath = `/tmp/generated_video_${Date.now()}.mp4`;
        await googleAiClient.files.download({
            file: generatedVideoRef,
            downloadPath: tempPath,
        });

        const fs = await import("fs/promises");
        const videoBuffer = await fs.readFile(tempPath);
        await fs.unlink(tempPath);

        const uploadUrl = await convex.mutation(api.assets.generateUploadUrl);

        const uploadResult = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "video/mp4" },
            body: videoBuffer,
        });

        if (!uploadResult.ok) {
            throw new Error("Failed to upload video to Convex");
        }

        const { storageId } = (await uploadResult.json()) as { storageId: string };

        const filename = `transition_video_${Date.now()}`;

        await convex.mutation(api.assets.saveAsset, {
            name: filename,
            storageId: storageId as Id<"_storage">,
            type: "video",
            mimeType: "video/mp4",
        });

        const videoUrl = await convex.query(api.assets.getAssetUrl, { name: filename });

        if (!videoUrl) {
            throw new Error("Failed to retrieve uploaded video URL");
        }

        return videoUrl;
    } catch (error) {
        console.error("Error generating transition video:", error);
        return "";
    }
}

export async function generateRiddle(prompt: string, artStyle: ArtStyle): Promise<void> {
    const { storyId, roomIds } = await createStoryEmptyMutation({ prompt, artStyle });
    const storyOutline = await generateStoryOutline(prompt, artStyle);
    await createStoryBasicMutation({ storyId, goal: storyOutline.goal, theme: storyOutline.theme, description: storyOutline.description });
    let previousRoomData: Level | null = null;
    const generatedRooms: Level[] = [];

    for (let i = 0; i < roomIds.length; i++) {
        const roomNumber = i + 1;
        const roomData = await generateRoom(roomNumber, storyOutline, artStyle, previousRoomData);
        await updateRoomMutation({ roomId: roomIds[i], roomData });
        generatedRooms.push(roomData);
        previousRoomData = roomData;
    }

    for (let i = 0; i < roomIds.length - 1; i++) {
        const transitionPrompt = `Create a ${artStyle} cinematic video transitioning from room ${i + 1} to room ${
            i + 2
        } for the story goal "${storyOutline.goal}". Highlight continuity and mood evolution.`;

        const transitionVideoUrl = await generateVideoTransition(
            transitionPrompt,
            generatedRooms[i],
            generatedRooms[i + 1]
        );

        if (transitionVideoUrl) {
            await addTransitionVideoMutation({ roomId: roomIds[i], transitionVideoUrl });
        }
    }
}
