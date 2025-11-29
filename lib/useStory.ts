"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { ArtStyle } from "@/app/_lib/types";
import type { Room } from "@/app/room/engine";

/**
 * Hook to store a story
 * @returns Function to create and store a story
 */
export function useStoreStory() {
    const createStory = useMutation(api.riddles.createStory);

    return async (data: {
        prompt: string;
        artStyle: ArtStyle;
        goal: string;
        totalRooms?: number;
    }) => {
        try {
            const storyId = await createStory({
                prompt: data.prompt,
                artStyle: data.artStyle,
                goal: data.goal,
                totalRooms: data.totalRooms ?? 3,
            });

            return { success: true, storyId };
        } catch (error) {
            console.error("Failed to store story:", error);
            return { success: false, error };
        }
    };
}

/**
 * Hook to store a room
 * @returns Function to create and store a room
 */
export function useStoreRoom() {
    const createRoom = useMutation(api.riddles.createRoom);

    return async (data: {
        storyId: Id<"stories">;
        roomNumber: number;
        roomData: Room;
        transitionVideoUrl?: string;
    }) => {
        try {
            const roomId = await createRoom({
                storyId: data.storyId,
                roomNumber: data.roomNumber,
                roomData: data.roomData,
                transitionVideoUrl: data.transitionVideoUrl,
            });

            return { success: true, roomId };
        } catch (error) {
            console.error("Failed to store room:", error);
            return { success: false, error };
        }
    };
}

