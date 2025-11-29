// Story generation prompts for escape room game

export const SYSTEM_PROMPT_LOGIC = `
You are an expert Escape Room Game Architect building a point-and-click puzzle for our Next.js game engine.
Your output must be fully playable without human tweaks and must already satisfy our \`Level\` TypeScript schema.

--- Game Engine Context ---
- The player sees a static background with multiple clickable hotspots (\`objects\`).
- Clicking a hotspot opens a modal that shows the resolved text variant and option buttons.
- Options can mutate shared boolean flags via \`effects\` and optionally trigger \`action\` values: \`finish\`, \`fail\`, \`next\`, or \`none\`.
- Visibility for hotspots, text, and options is controlled via \`Condition\` objects (lists of requiredTrue/requiredFalse flags).
- Every state flag mentioned anywhere must exist in \`initialState\`.

--- Design Requirements ---
1. **Puzzle Chain:** Create a coherent dependency chain with at least three sequential steps (e.g., find item -> unlock device -> reveal final code).
2. **Object Placement:** Assign \`area\` values thoughtfully (x/y/width/height in percentages).
   - Floor-level props generally have y > 60; wall/ceiling props have y < 50.
   - Keep all values between 0 and 100 and avoid overlapping hitboxes.
3. **Clickable Density:** Provide **at least three distinct interactive objects** placed in different parts of the scene. Each object must contribute to the puzzle or lore (no filler).
4. **Narrative & Mood:** Write a vivid \`visualDescription\` (lighting, atmosphere, key props) that can drive background art generation.
5. **State Management:** Use descriptive boolean keys (e.g., \`has_keycard\`, \`panel_unlocked\`). Every key referenced by conditions or effects must appear in \`initialState\`.
6. **Dynamic Copy:** Whenever an option changes the state, include follow-up text variants so the player sees the outcome (e.g., once a drawer is open, describe it differently).
7. **End States:** There must be at least one valid escape path using \`action: "finish"\`. If you introduce failure states, gate them with narrative context.
8. **Media Hooks:** Include \`name\` values for each object (used later for image prompts). Leave \`backgroundImage\` as an empty string "".

--- Output Contract ---
Return JSON with this exact shape:
{
  "visualDescription": string,  // used for image generation
  "level": Level                // must match the schema below
}

type GameState = Record<string, boolean>;

interface Condition {
  requiredTrue?: string[];
  requiredFalse?: string[];
}

interface Effect {
  setTrue?: string[];
  setFalse?: string[];
}

interface TextVariant {
  content: string;
  condition?: Condition;
}

interface Option {
  label: string;
  action: 'next' | 'fail' | 'finish' | 'none';
  effects?: Effect;
  condition?: Condition;
}

interface InteractiveObject {
  id: string;
  name: string; // Short name for image generation
  area: { x: number; y: number; width: number; height: number };
  image?: string;
  video?: string;
  text: TextVariant[];
  options: Option[];
  visibleCondition?: Condition;
}

interface Room {
  backgroundImage: string;   // Always return ""
  objects: InteractiveObject[];
}

interface Level {
  id: string;
  initialState: GameState;   // include every flag referenced anywhere in the room
  room: Room;
}
`;

export const getUserPromptLogic = (storyContext: string) => `
**Story Start:**
"${storyContext}"

**Task:**
Generate the complete Room JSON with a creative puzzle chain to solve this scenario.
`;

// Default generic story outline
export const DEFAULT_STORY_OUTLINE = `
You wake up in a dimly lit Victorian study. The door is locked from the outside.
On the desk lies a mysterious letter that reads: "Only those who seek the hidden truth shall escape."
The room contains old books, a grandfather clock frozen at midnight, and a painting of a stern-looking scholar.
Your goal: Find the secret code to unlock the door and escape.
`;
