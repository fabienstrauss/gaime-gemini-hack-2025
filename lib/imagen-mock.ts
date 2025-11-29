/**
 * Mock image generation for testing without Imagen API
 * Returns placeholder URLs instead of generating real images
 */

/**
 * Generate a mock image using placeholder URL
 * @param prompt - Image generation prompt (used for text overlay)
 * @param filename - Filename to save as
 * @param aspectRatio - Image aspect ratio
 * @returns Placeholder URL
 */
export async function generateMockImage(
  prompt: string,
  filename: string,
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "16:9"
): Promise<string> {
  console.log(`🎨 Generating MOCK image: ${filename}`);

  // Map aspect ratios to dimensions
  const dimensions: Record<string, { width: number; height: number }> = {
    "16:9": { width: 1920, height: 1080 },
    "1:1": { width: 1024, height: 1024 },
    "9:16": { width: 1080, height: 1920 },
    "4:3": { width: 1024, height: 768 },
    "3:4": { width: 768, height: 1024 },
  };

  const { width, height } = dimensions[aspectRatio];

  // Extract key words from prompt for display
  const words = prompt
    .split(/[,.]/)
    [0].substring(0, 50)
    .replace(/[^a-zA-Z0-9 ]/g, "");

  // Choose color based on filename type
  let bgColor = "2c3e50"; // Dark blue-gray
  let textColor = "ecf0f1"; // Light gray

  if (filename.includes("background")) {
    bgColor = "1a1a2e"; // Very dark blue
    textColor = "eee";
  } else if (filename.includes("object")) {
    bgColor = "34495e"; // Medium dark
    textColor = "fff";
  }

  // Return placeholder URL directly (no fetch needed)
  const placeholderUrl = `https://placehold.co/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(
    words
  )}`;

  console.log(`✅ Mock image URL: ${placeholderUrl}`);
  return placeholderUrl;
}

/**
 * Check if we should use mock images
 * Set USE_MOCK_IMAGES=true in .env.local to use placeholder images
 */
export function shouldUseMockImages(): boolean {
  return process.env.USE_MOCK_IMAGES === "true" || !process.env.GOOGLE_CLOUD_PROJECT_ID;
}
