"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import type { ArtStyle, Story } from "./_lib/types";
import { Sparkles, Pencil, Image as ImageIcon, Clock, Wand2, PlayCircle, Search, Upload, X } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import type { LucideIcon } from "lucide-react";
import { generateRiddle } from "@/app/generateRiddle";
import { motion, AnimatePresence } from "framer-motion";

const artStyleIcons = {
    comic: Sparkles,
    drawing: Pencil,
    photorealistic: ImageIcon,
};

const artStyleLabels = {
    comic: "Comic Book",
    drawing: "Hand Drawn",
    photorealistic: "Photorealistic",
};

const artStyleDescriptions = {
    comic: "Vibrant colors and bold outlines for a superhero feel.",
    drawing: "Artistic sketches that bring a classic mystery vibe.",
    photorealistic: "High-fidelity visuals for an immersive experience.",
};

export default function HomePage() {
    const router = useRouter();
    const [prompt, setPrompt] = useState("");
    const [artStyle, setArtStyle] = useState<ArtStyle | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [referenceImage, setReferenceImage] = useState<File | null>(null);
    const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
    const stories = useQuery(api.riddles.listStories) ?? [];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReferenceImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setReferenceImage(null);
        setReferenceImagePreview(null);
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || !artStyle) {
            alert("Please enter a prompt and select an art style!");
            return;
        }

        setIsGenerating(true);
        try {
            await generateRiddle(prompt.trim(), artStyle, referenceImage);
            // Optionally clear form or show success message
            setPrompt("");
            setArtStyle(null);
            setReferenceImage(null);
            setReferenceImagePreview(null);
        } catch (error) {
            console.error("Failed to generate riddle:", error);
            alert("Failed to generate riddle. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative selection:bg-purple-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-pink-600/10 rounded-full blur-[80px] animate-pulse delay-700" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            <div className="container mx-auto px-4 py-16 max-w-6xl relative z-10">
                {/* Hero Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 text-sm font-medium text-purple-200 shadow-lg shadow-purple-900/20">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span>AI-Powered Adventure Generator</span>
                    </div>
                    <h1 className="text-7xl md:text-8xl font-bold mb-6 tracking-tight">
                        <span className="bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent drop-shadow-sm">
                            Riddle
                        </span>
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent ml-4">
                            Quest
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Unleash your imagination. Create immersive, interactive point-and-click adventures instantly with the power of AI.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    {/* Creator Section */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="lg:col-span-5 space-y-8"
                    >
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300">
                                        <Wand2 className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Create Adventure</h2>
                                </div>

                                {/* Prompt Input */}
                                <div className="mb-8">
                                    <label className="block text-sm font-medium mb-3 text-gray-300 ml-1">
                                        What's your story about?
                                    </label>
                                    <div className="relative group/input">
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="E.g., A detective investigating a cyber-crime in Neo-Tokyo..."
                                            className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 text-white placeholder-gray-500 resize-none transition-all duration-300 min-h-[140px]"
                                        />
                                        <div className="absolute bottom-4 right-4 text-xs text-gray-500 pointer-events-none">
                                            {prompt.length} chars
                                        </div>
                                    </div>
                                </div>

                                {/* Reference Image Upload */}
                                <div className="mb-8">
                                    <label className="block text-sm font-medium mb-3 text-gray-300 ml-1">
                                        Reference Image (Optional)
                                    </label>
                                    {!referenceImagePreview ? (
                                        <label className="relative group/upload cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <div className="w-full px-5 py-6 bg-black/20 border border-white/10 border-dashed rounded-2xl hover:bg-black/30 hover:border-purple-500/50 transition-all duration-300 flex flex-col items-center justify-center gap-3">
                                                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300">
                                                    <Upload className="w-6 h-6" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-300 font-medium">
                                                        Upload a reference image
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Click to select an image (PNG, JPG, etc.)
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    ) : (
                                        <div className="relative group/preview">
                                            <img
                                                src={referenceImagePreview}
                                                alt="Reference"
                                                className="w-full h-48 object-cover rounded-2xl border border-white/10"
                                            />
                                            <button
                                                onClick={handleRemoveImage}
                                                className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors backdrop-blur-sm"
                                            >
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                            <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                                                Reference Image
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Art Style Selector */}
                                <div className="mb-8">
                                    <label className="block text-sm font-medium mb-3 text-gray-300 ml-1">
                                        Choose Visual Style
                                    </label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {(Object.keys(artStyleIcons) as ArtStyle[]).map((style) => {
                                            const Icon = artStyleIcons[style];
                                            const isSelected = artStyle === style;
                                            return (
                                                <button
                                                    key={style}
                                                    onClick={() => setArtStyle(style)}
                                                    className={`relative p-4 rounded-xl border transition-all duration-300 text-left group/btn overflow-hidden ${
                                                        isSelected
                                                            ? "border-purple-500/50 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                                                            : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4 relative z-10">
                                                        <div className={`p-2.5 rounded-lg transition-colors ${isSelected ? "bg-purple-500 text-white" : "bg-white/10 text-gray-400 group-hover/btn:text-white"}`}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className={`font-semibold transition-colors ${isSelected ? "text-white" : "text-gray-300 group-hover/btn:text-white"}`}>
                                                                {artStyleLabels[style]}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-0.5 font-medium">
                                                                {artStyleDescriptions[style]}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg text-white hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/submit relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/submit:translate-y-0 transition-transform duration-300" />
                                    <span className="relative z-10">{isGenerating ? "Crafting World..." : "Generate Adventure"}</span>
                                    {!isGenerating && <Sparkles className="w-5 h-5 relative z-10 group-hover/submit:rotate-12 transition-transform" />}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Library Section */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="lg:col-span-7"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <PlayCircle className="w-6 h-6 text-pink-400" />
                                Recent Adventures
                            </h2>
                            <div className="text-sm text-gray-500 font-medium">
                                {stories.length} {stories.length === 1 ? 'Story' : 'Stories'} Created
                            </div>
                        </div>

                        <div className="grid gap-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatePresence>
                                {stories.length === 0 ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed"
                                    >
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                                            <Search className="w-8 h-8" />
                                        </div>
                                        <p className="text-gray-400 text-lg font-medium">
                                            No adventures yet.
                                        </p>
                                        <p className="text-gray-600 text-sm mt-2">
                                            Create your first story to begin the journey!
                                        </p>
                                    </motion.div>
                                ) : (
                                    stories.map((story: Story, index) => {
                                        const Icon = artStyleIcons[story.artStyle];
                                        return (
                                            <motion.div
                                                key={story._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <StoryCard
                                                    story={story}
                                                    Icon={Icon}
                                                    onStart={(firstRoomId) => router.push(`/room/${firstRoomId}`)}
                                                />
                                            </motion.div>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}

function StoryCard({ story, Icon, onStart }: { story: Story; Icon: LucideIcon; onStart: (firstRoomId: Id<"rooms">) => void }) {
    const firstRoomId = useQuery(api.riddles.getFirstRoomId, { storyId: story._id });
    const [isLoading, setIsLoading] = useState(false);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
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
            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-3/4 mb-4" />
                <div className="h-4 bg-white/10 rounded w-1/2" />
            </div>
        );
    }

    return (
        <div
            onClick={handleClick}
            className={`group relative bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/20 text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                            <Icon className="w-3 h-3" />
                            {artStyleLabels[story.artStyle]}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                            <Clock className="w-3 h-3" />
                            {formatDate(story._creationTime)}
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-purple-300 transition-colors">
                        {story.prompt}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                        <span className="text-gray-500 font-medium mr-1">Goal:</span>
                        {story.goal}
                    </p>
                </div>
                
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 text-gray-500">
                    <PlayCircle className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
