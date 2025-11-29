"use client";

import React from 'react';
import { RoomEngine } from './components/RoomEngine';
import { escapeRoomData } from './data/escapeRoom';

export default function RoomPage() {
    const handleFinish = (outcome: any) => {
        console.log('Game Finished:', outcome);
        alert(`Game Over! Success: ${outcome.success}`);
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 p-4">
            <h1 className="mb-8 text-4xl font-bold text-white">Escape Room</h1>
            <div className="w-full max-w-5xl">
                <RoomEngine
                    room={escapeRoomData}
                    onFinish={handleFinish}
                />
            </div>
        </main>
    );
}
