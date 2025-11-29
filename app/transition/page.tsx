"use client";

import { useState } from "react";
import { generateVideoWithFrames } from "./actions";
import { Upload } from "lucide-react";

export default function TransitionPage() {
    const [prompt, setPrompt] = useState("");
    const [firstFrame, setFirstFrame] = useState<File | null>(null);
    const [lastFrame, setLastFrame] = useState<File | null>(null);
    const [firstFramePreview, setFirstFramePreview] = useState<string | null>(null);
    const [lastFramePreview, setLastFramePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFirstFrameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFirstFrame(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFirstFramePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLastFrameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLastFrame(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLastFramePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }

        if (!firstFrame || !lastFrame) {
            setError("Please upload both start and end frame images");
            return;
        }

        setLoading(true);
        setError(null);
        setVideoUrl(null);

        try {
            const formData = new FormData();
            formData.append("prompt", prompt);
            formData.append("firstFrame", firstFrame);
            formData.append("lastFrame", lastFrame);

            const result = await generateVideoWithFrames(formData);

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
                        Video Generation with Frame Interpolation
                    </h1>
                    <p className="text-gray-400">
                        Generate videos from start and end frames using Google Veo 3.1
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Start Frame
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    onChange={handleFirstFrameChange}
                                    disabled={loading}
                                    className="hidden"
                                    id="firstFrame"
                                />
                                <label
                                    htmlFor="firstFrame"
                                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer bg-gray-900 hover:bg-gray-800 transition-colors"
                                >
                                    {firstFramePreview ? (
                                        <img
                                            src={firstFramePreview}
                                            alt="First frame preview"
                                            className="w-full h-full object-contain rounded-lg"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="w-12 h-12 text-gray-500 mb-2" />
                                            <p className="text-sm text-gray-400">Upload start frame</p>
                                            <p className="text-xs text-gray-500 mt-1">PNG or JPEG</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                End Frame
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    onChange={handleLastFrameChange}
                                    disabled={loading}
                                    className="hidden"
                                    id="lastFrame"
                                />
                                <label
                                    htmlFor="lastFrame"
                                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer bg-gray-900 hover:bg-gray-800 transition-colors"
                                >
                                    {lastFramePreview ? (
                                        <img
                                            src={lastFramePreview}
                                            alt="Last frame preview"
                                            className="w-full h-full object-contain rounded-lg"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="w-12 h-12 text-gray-500 mb-2" />
                                            <p className="text-sm text-gray-400">Upload end frame</p>
                                            <p className="text-xs text-gray-500 mt-1">PNG or JPEG</p>
                                        </div>
                                    )}
                                </label>
                            </div>
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