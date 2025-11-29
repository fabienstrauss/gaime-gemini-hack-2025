/**
 * Video generation using Google's Veo API
 */
import { getClient } from "@/lib/gemini";
import { Buffer } from "buffer";

interface VideoGenerationOptions {
  prompt: string;
  firstFrameUrl: string;
  lastFrameUrl: string;
  aspectRatio?: "16:9" | "9:16";
}

/**
 * Generate a video using Google's Veo API
 * @param options - Video generation options
 * @returns Video file as Buffer
 */
export async function generateVideoWithVeo(
  options: VideoGenerationOptions
): Promise<Buffer> {
  const client = getClient();

  const {
    prompt,
    firstFrameUrl,
    lastFrameUrl,
    aspectRatio = "16:9",
  } = options;

  // Fetch the first and last frame images
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

  // Generate video
  let operation = await client.models.generateVideos({
    model: "veo-3.1-fast-generate-preview",
    prompt,
    image: {
      imageBytes: firstFrameBase64,
      mimeType: firstFrameMimeType,
    },
    config: {
      lastFrame: {
        imageBytes: lastFrameBase64,
        mimeType: lastFrameMimeType,
      },
      aspectRatio,
    },
  });

  // Poll until the operation is done
  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await client.operations.getVideosOperation({
      operation,
    });
  }

  const generatedVideoRef = operation.response?.generatedVideos?.[0]?.video;

  if (!generatedVideoRef) {
    throw new Error("No video generated in response");
  }

  // Download video to temporary file
  const tempPath = `/tmp/generated_video_${Date.now()}.mp4`;
  await client.files.download({
    file: generatedVideoRef,
    downloadPath: tempPath,
  });

  // Read the video file
  const fs = await import("fs/promises");
  const videoBuffer = await fs.readFile(tempPath);

  // Clean up temp file
  await fs.unlink(tempPath);

  return videoBuffer;
}
