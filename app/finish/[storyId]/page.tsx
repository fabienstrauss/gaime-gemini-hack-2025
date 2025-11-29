"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Trophy, Home, Sparkles, Star, Map, Quote } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import { motion } from 'framer-motion';

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
            <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <div className="text-purple-200 text-lg font-medium animate-pulse">Loading adventure details...</div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative selection:bg-purple-500/30 flex items-center justify-center py-12">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            <div className="container mx-auto px-4 max-w-3xl relative z-10">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    {/* Success Icon */}
                    <div className="mb-8 relative inline-block">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                            className="relative z-10"
                        >
                            <div className="w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full flex items-center justify-center border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                                <Trophy className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                            </div>
                        </motion.div>
                        <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full animate-pulse"></div>
                        
                        {/* Confetti particles could go here */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="absolute -top-2 -right-2"
                        >
                            <Star className="w-6 h-6 text-yellow-200 fill-yellow-200 animate-bounce" />
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="absolute -bottom-2 -left-2"
                        >
                            <Star className="w-4 h-4 text-yellow-200 fill-yellow-200 animate-bounce delay-100" />
                        </motion.div>
                    </div>

                    {/* Congratulations Message */}
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-5xl md:text-6xl font-bold mb-4 tracking-tight"
                    >
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                            Mission Accomplished!
                        </span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-xl text-gray-400 max-w-lg mx-auto"
                    >
                        You've successfully unraveled the mystery and completed your adventure.
                    </motion.p>
                </motion.div>

                {/* Story Details Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden mb-10 group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300">
                                <Map className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Adventure Summary</h2>
                        </div>
                        
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                    Goal Achieved
                                </h3>
                                <p className="text-xl text-white font-medium leading-relaxed">
                                    {storyData.goal}
                                </p>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                    <Quote className="w-4 h-4 text-purple-400" />
                                    Original Prompt
                                </h3>
                                <p className="text-lg text-gray-300 italic leading-relaxed">
                                    "{storyData.prompt}"
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div>
                                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Visual Style</h3>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium capitalize">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        {storyData.artStyle}
                                    </div>
                                </div>
                                {/* Could add more stats here like "Rooms Explored" or "Time Taken" if available */}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Action Button */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex justify-center"
                >
                    <button
                        onClick={handlePlayAnother}
                        className="group relative px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 flex items-center gap-3 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-200/50 to-pink-200/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Home className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">Start New Adventure</span>
                    </button>
                </motion.div>
            </div>
        </main>
    );
}
