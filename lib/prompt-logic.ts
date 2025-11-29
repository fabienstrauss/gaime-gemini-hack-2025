// Story generation prompts for escape room game

export const SYSTEM_PROMPT_LOGIC = `
You are an expert Escape Room Game Architect. Your task is to design a single-room puzzle scenario based on a story input.
You must output strictly valid JSON based on the TypeScript interfaces below.

*** RULES ***
1.  **Puzzle Chain:** Create a dependency chain of at least 3 steps (e.g., Object A is needed to unlock Object B, which gives Code C).
2.  **Object Placement:** Assign 'area' (x, y, width, height in %) carefully.
    - Floor items: y > 60.
    - Wall items: y < 50.
    - Objects must not perfectly overlap.
3.  **Visuals:** 'visualDescription' must be a vivid text description of the room. Leave 'backgroundImage' as an empty string "".
4.  **State Management:** Use 'GameState' keys (e.g., "has_key": true) for logic.

*** RESPONSE FORMAT (TS INTERFACE) ***
Your response must be a single JSON object matching this structure exactly:

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
  text: TextVariant[];
  options: Option[];
  visibleCondition?: Condition;
}

interface Room {
  visualDescription: string; // Detailed text description of the scene
  backgroundImage: string;   // Always return ""
  objects: InteractiveObject[];
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
