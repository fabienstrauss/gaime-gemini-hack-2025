import { z } from 'zod';

// --- Game State & Conditions ---

export const GameStateSchema = z.record(z.string(), z.boolean())
    .describe("A dictionary of boolean flags representing the current state of the game. Keys are arbitrary strings (e.g., 'hasKey', 'doorOpen') and values are true/false.");
export type GameState = z.infer<typeof GameStateSchema>;

export const ConditionSchema = z.object({
    requiredTrue: z.array(z.string().min(1)).min(1).optional().describe("List of state keys that MUST be TRUE for this condition to be met."),
    requiredFalse: z.array(z.string().min(1)).min(1).optional().describe("List of state keys that MUST be FALSE for this condition to be met."),
}).describe("Defines a set of requirements based on the GameState. Both requiredTrue and requiredFalse must be satisfied.");
export type Condition = z.infer<typeof ConditionSchema>;

export const EffectSchema = z.object({
    setTrue: z.array(z.string()).optional().describe("List of state keys to set to TRUE."),
    setFalse: z.array(z.string()).optional().describe("List of state keys to set to FALSE."),
}).describe("Defines changes to apply to the GameState.");
export type Effect = z.infer<typeof EffectSchema>;

// --- Content & Interaction ---

export const TextVariantSchema = z.object({
    content: z.string().min(1).describe("The narrative text to display."),
    condition: ConditionSchema.optional().describe("Optional condition. If present, this text is only shown if the condition is met."),
}).describe("A specific version of text that appears under certain conditions.");
export type TextVariant = z.infer<typeof TextVariantSchema>;

export const OptionSchema = z.object({
    label: z.string().min(1).describe("The text displayed on the button."),
    action: z.enum(['next', 'fail', 'finish', 'none']).default('none').describe("The type of action this option triggers. 'none' just applies effects. 'finish' wins the level. 'fail' loses."),
    effects: EffectSchema.optional().describe("State changes to apply when this option is selected."),
    condition: ConditionSchema.optional().describe("Visibility condition. This option is only shown if the condition is met."),
}).describe("An interactive choice available to the player within a modal.");
export type Option = z.infer<typeof OptionSchema>;

export const InteractiveObjectSchema = z.object({
    id: z.string().min(1).describe("Unique identifier for this object within the room."),
    area: z.object({
        x: z.number().min(0).max(100).describe("X coordinate of the top-left corner (0-100 percentage)."),
        y: z.number().min(0).max(100).describe("Y coordinate of the top-left corner (0-100 percentage)."),
        width: z.number().min(1).max(100).describe("Width of the clickable area (0-100 percentage)."),
        height: z.number().min(1).max(100).describe("Height of the clickable area (0-100 percentage)."),
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
    objects: z.array(InteractiveObjectSchema).min(1).describe("List of interactive objects placed in the room."),
}).describe("Definition of the visual room and its interactions.");
export type Room = z.infer<typeof RoomSchema>;

// --- Super Schema ---

export const LevelSchema = z.object({
    id: z.string().min(1).describe("Unique identifier for this level."),
    room: RoomSchema.describe("The visual and interactive definition of the room."),
    initialState: GameStateSchema.describe("The starting state of the game flags (e.g., { doorOpen: false })."),
}).describe("Complete definition of a game level, including the room layout and the initial state.");
export type Level = z.infer<typeof LevelSchema>;

export const ROOM_LOGIC_GUIDE = `
Room Engine contract:
1. Visibility: An object's hotspot is active only if its optional visibleCondition passes. Otherwise, the clickable zone is hidden.
2. Text resolution: Text variants are evaluated from top to bottom. The first variant whose condition passes is shown; if none pass, the first variant is used as a fallback.
3. Options: Button visibility inside the modal follows the same condition rules. Players only see options that currently pass their condition.
4. Effects: Selecting an option immediately applies setTrue/setFalse mutations to the shared GameState. Subsequent visibility/text/options reevaluate using the updated values.
5. Actions: After effects run, option.action decides flow control. 'finish' wins the level, 'fail' loses, 'next' transitions to the next room, and 'none' simply leaves the modal (unless the object hides itself).
6. State coverage: Every state flag referenced anywhere (visibleCondition, text condition, option condition, option effects) must exist inside initialState to avoid implicit undefined comparisons.
7. Media: image/video URLs are optional. When both are present, video takes priority for display in the modal, matching the RoomEngine implementation.
`.trim();

