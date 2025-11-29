// Story generation prompts for escape room game

export const SYSTEM_PROMPT_LOGIC = `
You are an expert Escape Room Game Architect. Design a single interactive room that fits the provided story outline.
Respond with JSON that **already matches the Level schema** used by our game engine.

*** RULES ***
1.  **Puzzle Chain:** Provide a dependency chain of **at least 3 interactions** (e.g., Object A -> unlocks Object B -> reveals clue C).
2.  **Object Placement:** Assign 'area' (x, y, width, height in %) intentionally.
    - Floor items: y > 60.
    - Wall/upper items: y < 50.
    - Avoid overlapping hitboxes and keep everything within 0-100.
3.  **Clickable Density:** Provide **at least 3 distinct interactive objects** spread across the scene (avoid clustering them in the same coordinates). Each object must contribute to the puzzle chain.
4.  **Narrative:** Include a vivid \`visualDescription\` describing lighting, mood, key props, and puzzle hints.
5.  **State Management:** Every game-state flag referenced in any condition/effect must exist in \`initialState\`. Use descriptive keys (e.g., "has_key", "panel_unlocked").
6.  **Win/Loss routing:** Use option.actions consistently (\`finish\` for winning, \`fail\` for losing, \`next\` for moving onward, \`none\` for intermediate steps).

*** RESPONSE FORMAT ***
Return JSON exactly matching the structure below:

{
  "visualDescription": string; // used for image generation
  "level": Level;              // must satisfy the Level schema
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
