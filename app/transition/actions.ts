"use server";

import { GoogleGenAI } from "@google/genai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export async function generateRoomTransitionVideo({
  firstRoomId,
  lastRoomId,
}: {
  firstRoomId: Id<"rooms">;
  lastRoomId: Id<"rooms">;
}) {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const prompt = "first person view, walking into the next room, walking motion, head cam";

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Fetch room data from Convex
    const [firstRoom, lastRoom] = await Promise.all([
      convex.query(api.riddles.getRoom, { roomId: firstRoomId }),
      convex.query(api.riddles.getRoom, { roomId: lastRoomId }),
    ]);

    if (!firstRoom || !lastRoom) {
      throw new Error("One or both rooms not found");
    }

    // Extract background images from room data
    const firstFrameUrl = firstRoom.roomData.backgroundImage;
    const lastFrameUrl = lastRoom.roomData.backgroundImage;

    if (!firstFrameUrl || !lastFrameUrl) {
      throw new Error("Both rooms must have background images");
    }

    // Fetch images from URLs
    const [firstFrameResponse, lastFrameResponse] = await Promise.all([
      fetch(firstFrameUrl),
      fetch(lastFrameUrl),
    ]);

    if (!firstFrameResponse.ok || !lastFrameResponse.ok) {
      throw new Error("Failed to fetch one or both images");
    }

    // Convert to base64
    const firstFrameBuffer = await firstFrameResponse.arrayBuffer();
    const lastFrameBuffer = await lastFrameResponse.arrayBuffer();
    const firstFrameBase64 = Buffer.from(firstFrameBuffer).toString("base64");
    const lastFrameBase64 = Buffer.from(lastFrameBuffer).toString("base64");

    // Determine MIME types from content-type headers or default to jpeg
    const firstFrameMimeType = (firstFrameResponse.headers.get("content-type") || "image/jpeg") as "image/png" | "image/jpeg";
    const lastFrameMimeType = (lastFrameResponse.headers.get("content-type") || "image/jpeg") as "image/png" | "image/jpeg";

    let operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: prompt,
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

    // Poll the operation status until the video is ready.
    while (!operation.done) {
      console.log("Waiting for video generation to complete...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }

    if (!operation.response?.generatedVideos?.[0]?.video) {
      throw new Error("No video generated in response");
    }

    // Download the video to a temporary buffer
    const tempPath = `/tmp/generated_video_${Date.now()}.mp4`;
    await ai.files.download({
      file: operation.response.generatedVideos[0].video,
      downloadPath: tempPath,
    });

    // Read the video file
    const fs = await import("fs/promises");
    const videoBuffer = await fs.readFile(tempPath);

    // Clean up temp file
    await fs.unlink(tempPath);

    // Generate upload URL (reusing convex client from earlier)
    const uploadUrl = await convex.mutation(api.assets.generateUploadUrl);

    // Upload the video
    const uploadResult = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "video/mp4" },
      body: videoBuffer,
    });

    if (!uploadResult.ok) {
      throw new Error("Failed to upload video to Convex");
    }

    const { storageId } = await uploadResult.json();

    // Save asset metadata
    const timestamp = Date.now();
    const filename = `transition_video_${timestamp}`;

    await convex.mutation(api.assets.saveAsset, {
      name: filename,
      storageId,
      type: "video",
      mimeType: "video/mp4",
    });

    // Get the URL
    const videoUrl = await convex.query(api.assets.getAssetUrl, { name: filename });

    console.log(`Generated video saved to Convex storage: ${filename}`);

    return {
      success: true,
      videoUrl: videoUrl!,
    };
  } catch (error) {
    console.error("Error generating video:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate video",
    };
  }
}
