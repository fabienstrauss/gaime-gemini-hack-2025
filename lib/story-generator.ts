/**
 * Story generation using Gemini with image generation support
 */
import { sendPrompt } from "./gemini";
import type { Room, GameState, InteractiveObject } from "@/app/room/engine/schema";
import { SYSTEM_PROMPT_LOGIC, getUserPromptLogic, DEFAULT_STORY_OUTLINE } from "./prompt-logic";

export { DEFAULT_STORY_OUTLINE } from "./prompt-logic";

export interface StoryGenerationResult {
  room: Room;
  imagePrompts: {
    background: string;
    objects: Record<string, string>; // objectId -> image prompt
  };
  initialGameState: GameState;
  visualDescription: string;
}

/**
 * Generate a story-based escape room with interactive objects
 * @param storyOutline - The story context/outline for the escape room scenario
 * @returns A complete room with interactive objects and image generation prompts
 */
export async function generateStoryRoom(
  storyOutline: string = DEFAULT_STORY_OUTLINE
): Promise<StoryGenerationResult> {
  // Combine system prompt and user prompt
  const fullPrompt = `${SYSTEM_PROMPT_LOGIC}\n\n${getUserPromptLogic(storyOutline)}`;

  const response = await sendPrompt(fullPrompt, "gemini-2.5-flash");

  // Parse the JSON response
  let parsedData: any;
  try {
    // Remove markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/^```\n/, "").replace(/\n```$/, "");
    }
    parsedData = JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Failed to parse Gemini response:", response);
    throw new Error("Failed to parse story generation response from Gemini");
  }

  // Extract visual description for background image generation
  const visualDescription = parsedData.visualDescription || "";
  const backgroundImagePrompt = `Create a detailed, atmospheric image for an escape room game: ${visualDescription}. Style: cinematic, immersive, high detail, perfect for a point-and-click adventure game.`;

  // Generate image prompts for each object based on their name and context
  const objectImagePrompts: Record<string, string> = {};
  const objects: InteractiveObject[] = parsedData.objects.map((obj: any) => {
    // Generate image prompt from object name and visual description
    const objectName = obj.name || obj.id;
    objectImagePrompts[obj.id] = `A detailed, high-quality image of ${objectName} in the context of: ${visualDescription}. Suitable for an escape room game interface, clear and recognizable, cinematic style.`;

    // Remove the 'name' field as it's not in the Room schema
    const { name, ...objectWithoutName } = obj;
    return objectWithoutName as InteractiveObject;
  });

  const room: Room = {
    backgroundImage: parsedData.backgroundImage || "",
    objects,
  };

  // Extract initial game state from the objects' conditions
  const initialGameState: GameState = { gameStarted: true };

  // Collect all state keys mentioned in conditions and effects
  objects.forEach((obj) => {
    // From visible conditions
    if (obj.visibleCondition) {
      obj.visibleCondition.requiredTrue?.forEach((key) => {
        if (!(key in initialGameState)) initialGameState[key] = false;
      });
      obj.visibleCondition.requiredFalse?.forEach((key) => {
        if (!(key in initialGameState)) initialGameState[key] = false;
      });
    }

    // From text conditions
    obj.text.forEach((textVariant) => {
      if (textVariant.condition) {
        textVariant.condition.requiredTrue?.forEach((key) => {
          if (!(key in initialGameState)) initialGameState[key] = false;
        });
        textVariant.condition.requiredFalse?.forEach((key) => {
          if (!(key in initialGameState)) initialGameState[key] = false;
        });
      }
    });

    // From option conditions and effects
    obj.options.forEach((option) => {
      if (option.condition) {
        option.condition.requiredTrue?.forEach((key) => {
          if (!(key in initialGameState)) initialGameState[key] = false;
        });
        option.condition.requiredFalse?.forEach((key) => {
          if (!(key in initialGameState)) initialGameState[key] = false;
        });
      }
      if (option.effects) {
        option.effects.setTrue?.forEach((key) => {
          if (!(key in initialGameState)) initialGameState[key] = false;
        });
        option.effects.setFalse?.forEach((key) => {
          if (!(key in initialGameState)) initialGameState[key] = false;
        });
      }
    });
  });

  return {
    room,
    imagePrompts: {
      background: backgroundImagePrompt,
      objects: objectImagePrompts,
    },
    initialGameState,
    visualDescription,
  };
}

/**
 * Generate an image using Imagen/Nano Banana Pro or mock placeholder
 * @param prompt - The image generation prompt
 * @param filename - Filename to save the image as
 * @param aspectRatio - Image aspect ratio
 * @returns The URL or path to the generated image
 */
export async function generateImage(
  prompt: string,
  filename: string,
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "16:9"
): Promise<string> {
  const { shouldUseMockImages } = await import("./imagen-mock");

  if (shouldUseMockImages()) {
    console.log("ℹ️  Using mock image generation (set USE_MOCK_IMAGES=false to use real Imagen)");
    const { generateMockImage } = await import("./imagen-mock");
    return await generateMockImage(prompt, filename, aspectRatio);
  }

  try {
    const { generateAndSaveImage } = await import("./imagen");
    return await generateAndSaveImage(prompt, filename, aspectRatio);
  } catch (error: any) {
    console.error("⚠️  Imagen failed, falling back to mock images:", error.message);
    const { generateMockImage } = await import("./imagen-mock");
    return await generateMockImage(prompt, filename, aspectRatio);
  }
}

/**
 * Generate a complete story room with actual generated images
 * @param storyOutline - The story context/outline for the escape room scenario
 * @param generateImages - Whether to actually generate images (default: false)
 * @returns A complete room with generated images
 */
export async function generateStoryRoomWithImages(
  storyOutline: string = DEFAULT_STORY_OUTLINE,
  generateImages: boolean = false
): Promise<Room> {
  const result = await generateStoryRoom(storyOutline);

  if (generateImages) {
    console.log("🎨 Starting image generation...\n");

    // Generate background image
    const timestamp = Date.now();
    const backgroundImage = await generateImage(
      result.imagePrompts.background,
      `background-${timestamp}`,
      "16:9"
    );
    result.room.backgroundImage = backgroundImage;

    // Generate object images
    let objectIndex = 0;
    for (const obj of result.room.objects) {
      if (result.imagePrompts.objects[obj.id]) {
        const objectImage = await generateImage(
          result.imagePrompts.objects[obj.id],
          `object-${obj.id}-${timestamp}`,
          "1:1"
        );
        obj.image = objectImage;
        objectIndex++;
      }
    }

    console.log("\n✅ All images generated successfully!");
  }

  return result.room;
}
