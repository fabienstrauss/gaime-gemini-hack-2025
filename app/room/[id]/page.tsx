"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { RoomEngine } from '../components/RoomEngine';
import { TransitionVideo } from '../components/TransitionVideo';
import type { Level } from '../engine';
import type { Id } from '@/convex/_generated/dataModel';

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.id as Id<"rooms">;
    const [showTransition, setShowTransition] = useState(false);
    const [transitionVideoUrl, setTransitionVideoUrl] = useState<string | null>(null);

    const roomData = useQuery(api.riddles.getRoom, { roomId });

    const handleFinish = (outcome: any) => {
        if (!roomData) return;

        console.log('Room Finished:', outcome);

        // If this is the last room, go to finish screen
        if (roomData.isLastRoom) {
            router.push(`/finish/${roomData.story._id}`);
            return;
        }

        // If there's a transition video, show it
        if (roomData.transitionVideoUrl) {
            setTransitionVideoUrl(roomData.transitionVideoUrl);
            setShowTransition(true);
        } else {
            // No transition video, go directly to next room
            if (roomData.nextRoomId) {
                router.push(`/room/${roomData.nextRoomId}`);
            }
        }
    };

    const handleTransitionComplete = () => {
        setShowTransition(false);
        setTransitionVideoUrl(null);
        if (roomData?.nextRoomId) {
            router.push(`/room/${roomData.nextRoomId}`);
        }
    };

    if (!roomData) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 p-4">
                <div className="text-white text-xl">Loading room...</div>
            </main>
        );
    }

    const level = roomData.roomData as Level;
    const room = level.room;
    const initialState = level.initialState ?? {};

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 p-4">
            <div className="w-full max-w-5xl mb-4">
                <div className="flex items-center justify-between text-white">
                    <h1 className="text-2xl font-bold">{roomData.story.goal}</h1>
                    <div className="text-sm text-gray-400">
                        Room {roomData.roomNumber} of {roomData.story.totalRooms}
                    </div>
                </div>
            </div>
            <div className="w-full max-w-5xl">
                <RoomEngine room={room} initialState={initialState} onFinish={handleFinish} />
            </div>

            {/* Transition Video Modal */}
            {showTransition && transitionVideoUrl && (
                <TransitionVideo
                    videoUrl={transitionVideoUrl}
                    onComplete={handleTransitionComplete}
                />
            )}
        </main>
    );
}

