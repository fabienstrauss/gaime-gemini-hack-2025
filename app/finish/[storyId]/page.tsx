"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Trophy, Home, Sparkles } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';

export default function FinishPage() {
    const params = useParams();
    const router = useRouter();
    const storyId = params.storyId as Id<"stories">;

    const storyData = useQuery(api.riddles.getStoryWithRooms, { storyId });

    const handlePlayAnother = () => {
        router.push('/');
    };

    if (!storyData) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 p-4">
                <div className="text-white text-xl">Loading...</div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
            <div className="container mx-auto max-w-4xl text-center">
                {/* Success Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full"></div>
                        <Trophy className="w-32 h-32 text-yellow-400 relative z-10" />
                    </div>
                </div>

                {/* Congratulations Message */}
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Congratulations!
                </h1>
                <p className="text-2xl text-purple-200 mb-12">
                    You've completed the riddle adventure!
                </p>

                {/* Story Details */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 mb-8 text-left">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h2 className="text-2xl font-bold">Your Adventure</h2>
                    </div>
                    
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-purple-200 mb-2">Goal</h3>
                        <p className="text-lg text-white">{storyData.goal}</p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-purple-200 mb-2">Your Prompt</h3>
                        <p className="text-lg text-white italic">"{storyData.prompt}"</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-purple-200 mb-2">Art Style</h3>
                        <span className="inline-block px-4 py-2 bg-purple-500/30 rounded-lg text-purple-200 capitalize">
                            {storyData.artStyle}
                        </span>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handlePlayAnother}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                >
                    <Home className="w-5 h-5" />
                    Play Another Riddle
                </button>
            </div>
        </main>
    );
}


