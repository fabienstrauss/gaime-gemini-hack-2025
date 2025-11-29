/**
 * Story generation using Gemini with image generation support
 */
import { sendPrompt } from "./gemini";
import {
  LevelSchema,
  type Level,
  type Room,
  type GameState,
  type InteractiveObject,
} from "@/app/room/engine/schema";
import { SYSTEM_PROMPT_LOGIC, getUserPromptLogic, DEFAULT_STORY_OUTLINE } from "./prompt-logic";

export { DEFAULT_STORY_OUTLINE } from "./prompt-logic";

const LEVEL_RESPONSE_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://schemas.gaime.dev/level-response.json",
  type: "object",
  required: ["visualDescription", "level"],
  properties: {
    visualDescription: {
      type: "string",
      description: "Detailed atmospheric description used for background art.",
      minLength: 40,
    },
    level: {
      type: "object",
      required: ["id", "initialState", "room"],
      properties: {
        id: {
          type: "string",
          description: "Unique identifier for this level (slug-style).",
        },
        initialState: {
          type: "object",
          description: "Dictionary of boolean flags used throughout the puzzle logic.",
          additionalProperties: { type: "boolean" },
        },
        room: {
          type: "object",
          required: ["backgroundImage", "objects"],
          properties: {
            backgroundImage: {
              type: "string",
              description: "Leave as an empty string. Images are injected later.",
            },
            objects: {
              type: "array",
              minItems: 3,
              items: { $ref: "#/$defs/InteractiveObject" },
            },
          },
        },
      },
    },
  },
  $defs: {
    Area: {
      type: "object",
      required: ["x", "y", "width", "height"],
      properties: {
        x: { type: "number", minimum: 0, maximum: 100 },
        y: { type: "number", minimum: 0, maximum: 100 },
        width: { type: "number", minimum: 1, maximum: 100 },
        height: { type: "number", minimum: 1, maximum: 100 },
      },
    },
    Condition: {
      type: "object",
      properties: {
        requiredTrue: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
        },
        requiredFalse: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
        },
      },
      additionalProperties: false,
    },
    Effect: {
      type: "object",
      properties: {
        setTrue: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
        },
        setFalse: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
        },
      },
      additionalProperties: false,
    },
    TextVariant: {
      type: "object",
      required: ["content"],
      properties: {
        content: { type: "string", minLength: 10 },
        condition: { $ref: "#/$defs/Condition" },
      },
      additionalProperties: false,
    },
    Option: {
      type: "object",
      required: ["label", "action"],
      properties: {
        label: { type: "string" },
        action: {
          type: "string",
          enum: ["next", "fail", "finish", "none"],
        },
        effects: { $ref: "#/$defs/Effect" },
        condition: { $ref: "#/$defs/Condition" },
      },
      additionalProperties: false,
    },
    InteractiveObject: {
      type: "object",
      required: ["id", "name", "area", "text", "options"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        area: { $ref: "#/$defs/Area" },
        image: { type: "string" },
        video: { type: "string" },
        text: {
          type: "array",
          minItems: 1,
          items: { $ref: "#/$defs/TextVariant" },
        },
        options: {
          type: "array",
          minItems: 1,
          items: { $ref: "#/$defs/Option" },
        },
        visibleCondition: { $ref: "#/$defs/Condition" },
      },
      additionalProperties: false,
    },
  },
} as const;
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

  const response = await sendPrompt(fullPrompt, "gemini-2.5-flash", {
    responseMimeType: "application/json",
    responseJsonSchema: LEVEL_RESPONSE_SCHEMA,
  });

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

  const { level: rawLevel, visualDescription = "" } = parsedData;

  if (!rawLevel) {
    throw new Error("Gemini response missing 'level' field");
  }

  const rawRoom = rawLevel.room ?? {};
  const rawObjects: any[] = Array.isArray(rawRoom.objects) ? rawRoom.objects : [];
  const objectImagePrompts: Record<string, string> = {};

  const sanitizedObjects: InteractiveObject[] = rawObjects.map((obj: any) => {
    const { name, ...objectWithoutName } = obj;
    const objectId = objectWithoutName.id;
    const objectName = name || objectId || "mystery-object";

    if (objectId) {
      objectImagePrompts[objectId] = `A detailed, high-quality image of ${objectName} in the context of: ${visualDescription}. Suitable for an escape room game interface, clear and recognizable, cinematic style.`;
    }

    return objectWithoutName as InteractiveObject;
  });

  const sanitizedLevelInput = {
    ...rawLevel,
    room: {
      ...rawRoom,
      objects: sanitizedObjects,
    },
  };

  let levelData: Level;
  try {
    levelData = LevelSchema.parse(sanitizedLevelInput);
  } catch (error) {
    console.error("Generated data failed LevelSchema validation:", error);
    throw new Error("Level data from Gemini did not match the expected schema");
  }

  const backgroundImagePrompt = `Create a detailed, atmospheric image for an escape room game: ${visualDescription}. Style: cinematic, immersive, high detail, perfect for a point-and-click adventure game.`;
  const room: Room = {
    backgroundImage: levelData.room.backgroundImage || "",
    objects: levelData.room.objects,
  };

  const initialGameState: GameState = { ...levelData.initialState };
  if (!("gameStarted" in initialGameState)) {
    initialGameState.gameStarted = true;
  }

  const ensureStateKey = (key: string | undefined) => {
    if (!key) return;
    if (!(key in initialGameState)) {
      initialGameState[key] = false;
    }
  };

  // Collect all state keys mentioned in conditions and effects
  room.objects.forEach((obj) => {
    // From visible conditions
    if (obj.visibleCondition) {
      obj.visibleCondition.requiredTrue?.forEach((key) => {
        ensureStateKey(key);
      });
      obj.visibleCondition.requiredFalse?.forEach((key) => {
        ensureStateKey(key);
      });
    }

    // From text conditions
    obj.text.forEach((textVariant) => {
      if (textVariant.condition) {
        textVariant.condition.requiredTrue?.forEach((key) => {
          ensureStateKey(key);
        });
        textVariant.condition.requiredFalse?.forEach((key) => {
          ensureStateKey(key);
        });
      }
    });

    // From option conditions and effects
    obj.options.forEach((option) => {
      if (option.condition) {
        option.condition.requiredTrue?.forEach((key) => {
          ensureStateKey(key);
        });
        option.condition.requiredFalse?.forEach((key) => {
          ensureStateKey(key);
        });
      }
      if (option.effects) {
        option.effects.setTrue?.forEach((key) => {
          ensureStateKey(key);
        });
        option.effects.setFalse?.forEach((key) => {
          ensureStateKey(key);
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
