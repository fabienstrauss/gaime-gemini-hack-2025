"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import type { ArtStyle } from "./_lib/types";
import { Sparkles, Pencil, Image as ImageIcon, Clock } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

const artStyleIcons = {
    comic: Sparkles,
    drawing: Pencil,
    photorealistic: ImageIcon,
};

const artStyleLabels = {
    comic: "Comic",
    drawing: "Drawing",
    photorealistic: "Photorealistic",
};

export default function HomePage() {
    const router = useRouter();
    const [prompt, setPrompt] = useState("");
    const [artStyle, setArtStyle] = useState<ArtStyle | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateRiddle = useMutation(api.riddles.generateRiddle);
    const stories = useQuery(api.riddles.listStories) ?? [];

    const handleGenerate = async () => {
        if (!prompt.trim() || !artStyle) {
            alert("Please enter a prompt and select an art style!");
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateRiddle({ prompt: prompt.trim(), artStyle });
            router.push(`/room/${result.firstRoomId}`);
        } catch (error) {
            console.error("Failed to generate riddle:", error);
            alert("Failed to generate riddle. Please try again.");
            setIsGenerating(false);
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 text-white">
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Riddle Quest
                    </h1>
                    <p className="text-xl text-purple-200">
                        Create AI-powered interactive riddles and solve mysteries
                    </p>
                </div>

                {/* Riddle Creator */}
                <div className="mb-16 bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                    <h2 className="text-3xl font-bold mb-6">Create Your Riddle</h2>

                    {/* Prompt Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-purple-200">
                            Describe your riddle adventure
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="E.g., Escape from a haunted mansion, Find the treasure in an ancient temple..."
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-purple-300/50 resize-none"
                            rows={4}
                            disabled={isGenerating}
                        />
                    </div>

                    {/* Art Style Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-3 text-purple-200">
                            Select Art Style
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            {(Object.keys(artStyleIcons) as ArtStyle[]).map((style) => {
                                const Icon = artStyleIcons[style];
                                const isSelected = artStyle === style;
                                return (
                                    <button
                                        key={style}
                                        onClick={() => setArtStyle(style)}
                                        disabled={isGenerating}
                                        className={`p-4 rounded-lg border-2 transition-all ${isSelected
                                                ? "border-purple-400 bg-purple-500/30"
                                                : "border-white/20 bg-white/5 hover:bg-white/10"
                                            } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <Icon className="w-8 h-8 mx-auto mb-2" />
                                        <div className="font-medium">{artStyleLabels[style]}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim() || !artStyle}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                        {isGenerating ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating Your Riddle...
                            </span>
                        ) : (
                            "Generate Riddle"
                        )}
                    </button>
                </div>

                {/* Story Library */}
                <div>
                    <h2 className="text-3xl font-bold mb-6">Your Riddles</h2>
                    {stories.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-purple-200 text-lg">
                                No riddles yet. Create your first one above!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stories.map((story) => {
                                const Icon = artStyleIcons[story.artStyle];
                                return (
                                    <StoryCard
                                        key={story._id}
                                        story={story}
                                        Icon={Icon}
                                        onStart={(firstRoomId) => router.push(`/room/${firstRoomId}`)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function StoryCard({ story, Icon, onStart }: { story: any; Icon: any; onStart: (firstRoomId: Id<"rooms">) => void }) {
    const firstRoomId = useQuery(api.riddles.getFirstRoomId, { storyId: story._id });
    const [isLoading, setIsLoading] = useState(false);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const handleClick = () => {
        if (firstRoomId) {
            setIsLoading(true);
            onStart(firstRoomId);
        }
    };

    if (!firstRoomId) {
        return (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-purple-200">Loading...</div>
            </div>
        );
    }

    return (
        <div
            onClick={handleClick}
            className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 cursor-pointer hover:bg-white/15 transition-all hover:scale-105 hover:shadow-2xl ${isLoading ? "opacity-50" : ""}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-medium text-purple-300">
                        {artStyleLabels[story.artStyle]}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-purple-300">
                    <Clock className="w-4 h-4" />
                    {formatDate(story.createdAt)}
                </div>
            </div>
            <p className="text-white font-medium mb-2 line-clamp-3">
                {story.prompt}
            </p>
            <p className="text-sm text-purple-200/70 line-clamp-2">
                Goal: {story.goal}
            </p>
        </div>
    );
}
