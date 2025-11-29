import type { Doc, Id } from "@/convex/_generated/dataModel";

export type ArtStyle = "comic" | "drawing" | "photorealistic";

export type Story = Doc<"stories">;

export type Room = Doc<"rooms">;

export interface RoomWithContext extends Room {
    story: Story;
    nextRoomId: Id<"rooms"> | null;
    isLastRoom: boolean;
}

export interface StoryWithRooms extends Story {
    rooms: Room[];
}
