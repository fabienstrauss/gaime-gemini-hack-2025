"use server";

import { Buffer } from "buffer";
import { ConvexHttpClient } from "convex/browser";
import type { ArtStyle } from "@/app/_lib/types";
import { Level } from "@/app/room/engine";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { generateVideoWithVeo } from "@/lib/veo";
import { generateImageWithImagen } from "@/lib/imagen";
import { generateLevelFromPrompt } from "@/lib/story-generator";
import { buildRoomPrompt } from "@/lib/room-prompts";

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

export async function generateRiddle(prompt: string, artStyle: ArtStyle, referenceImage?: File | null): Promise<void> {
    // Convert reference image to base64 if provided
    let referenceImageBase64: string | undefined;
    if (referenceImage) {
        const buffer = await referenceImage.arrayBuffer();
        referenceImageBase64 = Buffer.from(buffer).toString("base64");
    }

    const { storyId, roomIds } = await createStoryEmptyMutation({ prompt, artStyle });
    const storyOutline = await generateStoryOutline(prompt, artStyle);
    await createStoryBasicMutation({ storyId, goal: storyOutline.goal, theme: storyOutline.theme, description: storyOutline.description });
    let previousRoomData: Level | null = null;
    const generatedRooms: Level[] = [];
    const previousRoomStories: string[] = [];
    const storyContext = `${storyOutline.goal}. ${storyOutline.description}`;

    for (let i = 0; i < roomIds.length; i++) {
        const roomNumber = i + 1;
        console.log(`🏗️ Generating narrative-driven room ${roomNumber}/${roomIds.length}...`);

        const roomPrompt = buildRoomPrompt(
            storyContext,
            roomNumber,
            roomIds.length,
            previousRoomStories,
            artStyle
        );

        const generationResult = await generateLevelFromPrompt(roomPrompt);
        let level = generationResult.level;

        // Generate background image based on AI prompt
        const backgroundBase64 = await generateImageWithImagen({
            prompt: generationResult.imagePrompts.background,
            aspectRatio: "16:9",
            imageSize: "2K",
            referenceImageBase64: roomNumber === 1 ? referenceImageBase64 : undefined,
        });
        const backgroundFilename = `room_${roomNumber}_${Date.now()}`;
        const backgroundImageUrl = await uploadImageToConvex(backgroundBase64, backgroundFilename);

        // Generate object images when prompts exist
        const objectsWithImages = [];
        for (const obj of level.room.objects) {
            const objectPrompt = generationResult.imagePrompts.objects[obj.id];
            let objectImageUrl = obj.image;

            if (objectPrompt) {
                const objectBase64 = await generateImageWithImagen({
                    prompt: objectPrompt,
                    aspectRatio: "1:1",
                    imageSize: "1K",
                });
                const objectFilename = `room_${roomNumber}_${obj.id}_${Date.now()}`;
                objectImageUrl = await uploadImageToConvex(objectBase64, objectFilename);
            }

            objectsWithImages.push({
                ...obj,
                ...(objectImageUrl ? { image: objectImageUrl } : {}),
            });
        }

        level = {
            ...level,
            room: {
                ...level.room,
                backgroundImage: backgroundImageUrl,
                objects: objectsWithImages,
            },
        };

        await updateRoomMutation({ roomId: roomIds[i], roomData: level });
        generatedRooms.push(level);
        previousRoomData = level;
        previousRoomStories.push(generationResult.visualDescription);
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
