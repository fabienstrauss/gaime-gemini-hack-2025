import { z } from 'zod';

// --- Game State & Conditions ---

export const GameStateSchema = z.record(z.string(), z.boolean())
    .describe("A dictionary of boolean flags representing the current state of the game. Keys are arbitrary strings (e.g., 'hasKey', 'doorOpen') and values are true/false.");
export type GameState = z.infer<typeof GameStateSchema>;

export const ConditionSchema = z.object({
    requiredTrue: z.array(z.string()).optional().describe("List of state keys that MUST be TRUE for this condition to be met."),
    requiredFalse: z.array(z.string()).optional().describe("List of state keys that MUST be FALSE for this condition to be met."),
}).describe("Defines a set of requirements based on the GameState. Both requiredTrue and requiredFalse must be satisfied.");
export type Condition = z.infer<typeof ConditionSchema>;

export const EffectSchema = z.object({
    setTrue: z.array(z.string()).optional().describe("List of state keys to set to TRUE."),
    setFalse: z.array(z.string()).optional().describe("List of state keys to set to FALSE."),
}).describe("Defines changes to apply to the GameState.");
export type Effect = z.infer<typeof EffectSchema>;

// --- Content & Interaction ---

export const TextVariantSchema = z.object({
    content: z.string().describe("The narrative text to display."),
    condition: ConditionSchema.optional().describe("Optional condition. If present, this text is only shown if the condition is met."),
}).describe("A specific version of text that appears under certain conditions.");
export type TextVariant = z.infer<typeof TextVariantSchema>;

export const OptionSchema = z.object({
    label: z.string().describe("The text displayed on the button."),
    action: z.enum(['next', 'fail', 'finish', 'none']).default('none').describe("The type of action this option triggers. 'none' just applies effects. 'finish' wins the level. 'fail' loses."),
    effects: EffectSchema.optional().describe("State changes to apply when this option is selected."),
    condition: ConditionSchema.optional().describe("Visibility condition. This option is only shown if the condition is met."),
}).describe("An interactive choice available to the player within a modal.");
export type Option = z.infer<typeof OptionSchema>;

export const InteractiveObjectSchema = z.object({
    id: z.string().describe("Unique identifier for this object within the room."),
    area: z.object({
        x: z.number().describe("X coordinate of the top-left corner (0-100 percentage)."),
        y: z.number().describe("Y coordinate of the top-left corner (0-100 percentage)."),
        width: z.number().describe("Width of the clickable area (0-100 percentage)."),
        height: z.number().describe("Height of the clickable area (0-100 percentage)."),
    }).describe("The clickable zone on the background image."),
    image: z.string().optional().describe("URL to an image to display in the modal when clicked."),
    video: z.string().optional().describe("URL to a video to play in the modal when clicked (overrides image)."),
    text: z.array(TextVariantSchema).describe("List of possible text descriptions. The first one with a matching condition is displayed."),
    options: z.array(OptionSchema).describe("List of actions the player can take."),
    visibleCondition: ConditionSchema.optional().describe("If set, the object's clickable zone is only active/visible if this condition is met."),
}).describe("An object in the room that the player can interact with.");
export type InteractiveObject = z.infer<typeof InteractiveObjectSchema>;

export const RoomSchema = z.object({
    backgroundImage: z.string().describe("URL of the main background image for the room (16:9 aspect ratio recommended)."),
    objects: z.array(InteractiveObjectSchema).describe("List of interactive objects placed in the room."),
}).describe("Definition of the visual room and its interactions.");
export type Room = z.infer<typeof RoomSchema>;

// --- Super Schema ---

export const LevelSchema = z.object({
    id: z.string().describe("Unique identifier for this level."),
    room: RoomSchema.describe("The visual and interactive definition of the room."),
    initialState: GameStateSchema.describe("The starting state of the game flags (e.g., { doorOpen: false })."),
}).describe("Complete definition of a game level, including the room layout and the initial state.");
export type Level = z.infer<typeof LevelSchema>;
