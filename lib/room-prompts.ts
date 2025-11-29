export function buildRoomPrompt(
  storyOutline: string,
  roomNumber: number,
  totalRooms: number,
  previousRoomStories: string[],
  artStyle: string
): string {
  let prompt = `**Overall Story Context:**\n"${storyOutline}"\n\n`;

  if (previousRoomStories.length > 0) {
    prompt += `**Previous Rooms (for continuity):**\n`;
    previousRoomStories.forEach((story, index) => {
      prompt += `Room ${index + 1}: ${story}\n`;
    });
    prompt += `\nUse these events to justify callbacks, clues, or consequences in Room ${roomNumber}.\n\n`;
  }

  prompt += `**Task:**\nDesign Room ${roomNumber} of ${totalRooms}. The puzzle chain must clearly advance the overarching escape narrative.\n\n`;

  if (roomNumber === 1) {
    prompt += `This is the FIRST room. Establish the stakes and tutorialize the mechanics without being trivial.\n\n`;
  } else if (roomNumber === totalRooms) {
    prompt += `This is the FINAL room. Deliver the climax, reference past discoveries, and gate the escape with the hardest challenge. Ensure \`action: "finish"\` only appears on the true victory option.\n\n`;
  } else {
    prompt += `This is a MIDDLE room. Bridge previous discoveries to upcoming mysteries. Provide clues that foreshadow the finale.\n\n`;
  }

  prompt += `**Visual Direction:** The scene must embody a ${artStyle} aesthetic. Describe lighting, palette, and props accordingly.\n\n`;

  prompt += `**Response Contract:**\nReturn a JSON object with:\n`;
  prompt += `- \`visualDescription\`: Scene-setting prose for background art.\n`;
  prompt += `- \`level\`: A complete Level object that already satisfies the schema from the system prompt (>=3 interactive objects, populated initialState, etc.).\n\n`;

  prompt += `Ensure every interactive object meaningfully contributes to the puzzle chain, with clear conditions/effects linking them together.`;

  return prompt;
}


