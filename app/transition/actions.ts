"use server";

import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";

export async function generateVideoWithFrames(formData: FormData) {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const prompt = "first person view, walking into the next room, walking motion, head cam";
    const firstFrameFile = formData.get("firstFrame") as File;
    const lastFrameFile = formData.get("lastFrame") as File;

    if (!firstFrameFile || !lastFrameFile) {
      throw new Error("Prompt and both frame images are required");
    }

    // Convert files to base64
    const firstFrameBuffer = await firstFrameFile.arrayBuffer();
    const lastFrameBuffer = await lastFrameFile.arrayBuffer();
    const firstFrameBase64 = Buffer.from(firstFrameBuffer).toString("base64");
    const lastFrameBase64 = Buffer.from(lastFrameBuffer).toString("base64");

    let operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: prompt,
      image: {
        imageBytes: firstFrameBase64,
        mimeType: firstFrameFile.type as "image/png" | "image/jpeg",
      },
      config: {
        lastFrame: {
          imageBytes: lastFrameBase64,
          mimeType: lastFrameFile.type as "image/png" | "image/jpeg",
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

    // Create public directory if it doesn't exist
    const publicDir = path.join(process.cwd(), "public", "videos");
    await fs.mkdir(publicDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `generated_video_${timestamp}.mp4`;
    const downloadPath = path.join(publicDir, filename);

    // Download the generated video
    await ai.files.download({
      file: operation.response.generatedVideos[0].video,
      downloadPath: downloadPath,
    });

    console.log(`Generated video saved to ${downloadPath}`);

    // Return the public URL path
    return {
      success: true,
      videoUrl: `/videos/${filename}`,
    };
  } catch (error) {
    console.error("Error generating video:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate video",
    };
  }
}
