"use client";

import { useState } from "react";
import { generateRoomTransitionVideo } from "./actions";
import type { Id } from "@/convex/_generated/dataModel";

export default function TransitionPage() {
    const [firstRoomId, setFirstRoomId] = useState("");
    const [lastRoomId, setLastRoomId] = useState("");
    const [loading, setLoading] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstRoomId.trim() || !lastRoomId.trim()) {
            setError("Please enter both room IDs");
            return;
        }

        setLoading(true);
        setError(null);
        setVideoUrl(null);

        try {
            const result = await generateRoomTransitionVideo({
                firstRoomId: firstRoomId as Id<"rooms">,
                lastRoomId: lastRoomId as Id<"rooms">,
            });

            if (result.success && result.videoUrl) {
                setVideoUrl(result.videoUrl);
            } else {
                setError(result.error || "Failed to generate video");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
            <div className="max-w-4xl w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Room Transition Video Generator
                    </h1>
                    <p className="text-gray-400">
                        Generate transition videos between rooms using Google Veo 3.1
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                First Room ID
                            </label>
                            <input
                                type="text"
                                value={firstRoomId}
                                onChange={(e) => setFirstRoomId(e.target.value)}
                                disabled={loading}
                                placeholder="jx7abc123..."
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">Enter the Convex ID of the first room</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Last Room ID
                            </label>
                            <input
                                type="text"
                                value={lastRoomId}
                                onChange={(e) => setLastRoomId(e.target.value)}
                                disabled={loading}
                                placeholder="jx7def456..."
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">Enter the Convex ID of the last room</p>
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
                    >
                        {loading ? "Generating Video..." : "Generate Video"}
                    </button>
                </form>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <p className="text-gray-400 text-sm">
                            This may take a few minutes. Please wait...
                        </p>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {videoUrl && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white">
                            Generated Video
                        </h2>

                        <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                            <p className="text-sm text-gray-400 mb-2">Convex Storage URL:</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={videoUrl}
                                    readOnly
                                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm font-mono"
                                />
                                <button
                                    onClick={() => navigator.clipboard.writeText(videoUrl)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <div className="rounded-lg overflow-hidden bg-gray-900">
                            <video
                                controls
                                className="w-full"
                                src={videoUrl}
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>

                        <a
                            href={videoUrl}
                            download
                            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                        >
                            Download Video
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}