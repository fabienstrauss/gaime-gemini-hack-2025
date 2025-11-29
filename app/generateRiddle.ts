"use server";

import { Buffer } from "buffer";
import { ConvexHttpClient } from "convex/browser";
import type { ArtStyle } from "@/app/_lib/types";
import { Level, Room } from "@/app/room/engine";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { generateVideoWithVeo } from "@/lib/veo";
import { generateImageWithImagen } from "@/lib/imagen";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexHttpClient(CONVEX_URL);

const createStoryEmptyMutation = (args: { prompt: string; artStyle: ArtStyle }) =>
    convex.mutation(api.riddles.createStory_empty, args);

const createStoryBasicMutation = (args: { storyId: Id<"stories">; goal: string; theme?: string; description?: string }) =>
    convex.mutation(api.riddles.createStory_basic, args);

const updateRoomMutation = (args: { roomId: Id<"rooms">; roomData: Level }) =>
    convex.mutation(api.riddles.updateRoom, args);

const addTransitionVideoMutation = (args: { roomId: Id<"rooms">; transitionVideoUrl: string }) =>
    convex.mutation(api.riddles.addTransitionVideo, args);

const saveAssetMutation = (args: { name: string; storageId: Id<"_storage">; type: string; mimeType: string }) =>
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
        body: arrayBuffer,
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

/**
 * Upload a base64 image to Convex storage and return the URL
 */
export async function uploadImageToConvex(base64Data: string, filename: string): Promise<string> {
    const buffer = Buffer.from(base64Data, "base64");
    const uploadUrl = await convex.mutation(api.assets.generateUploadUrl);

    const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: new Uint8Array(buffer),
    });

    if (!uploadResponse.ok) {
        throw new Error("Failed to upload image to Convex storage");
    }

    const { storageId } = (await uploadResponse.json()) as { storageId: string };

    await saveAssetMutation({
        name: filename,
        storageId: storageId as Id<"_storage">,
        type: "image",
        mimeType: "image/png",
    });

    const imageUrl = await convex.query(api.assets.getAssetUrl, { name: filename });

    if (!imageUrl) {
        throw new Error("Failed to retrieve uploaded image URL");
    }

    return imageUrl;
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
    console.log(`🏠 Generating room ${roomNumber}...`);

    // Generate background image for the room
    const imagePrompt = `Create a ${artStyle} style background image for room ${roomNumber} of an interactive story. Theme: ${storyOutline.theme}. Scene description: ${storyOutline.description}. The image should be a detailed, atmospheric background suitable for a game or interactive narrative. ${
        previousRoomData
            ? `This room continues from the previous scene, showing progression in the story.`
            : `This is the opening scene of the adventure.`
    }`;

    const base64Image = await generateImageWithImagen({
        prompt: imagePrompt,
        aspectRatio: "16:9",
        imageSize: "2K",
    });

    const filename = `room_${roomNumber}_${Date.now()}`;
    const backgroundImageUrl = await uploadImageToConvex(base64Image, filename);

    console.log(`✅ Room ${roomNumber} background image generated: ${backgroundImageUrl}`);

    const roomDefinition: Room = {
        backgroundImage: backgroundImageUrl,
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

        console.log(`🎬 Starting video transition generation...`);
        console.log(`   Prompt: ${transitionPrompt.substring(0, 150)}${transitionPrompt.length > 150 ? '...' : ''}`);
        console.log(`   First frame: ${firstFrameUrl.substring(0, 100)}...`);
        console.log(`   Last frame: ${lastFrameUrl.substring(0, 100)}...`);

        const startTime = Date.now();

        // Generate video using Veo
        const videoBuffer = await generateVideoWithVeo({
            prompt: transitionPrompt,
            firstFrameUrl,
            lastFrameUrl,
            aspectRatio: "16:9",
        });

        // Upload to Convex
        const uploadUrl = await convex.mutation(api.assets.generateUploadUrl);

        const uploadResult = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "video/mp4" },
            body: new Uint8Array(videoBuffer),
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

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Video transition generation completed in ${duration}s`);
        console.log(`   Video URL: ${videoUrl}`);

        return videoUrl;
    } catch (error) {
        console.error("❌ Error generating transition video:", error);
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
