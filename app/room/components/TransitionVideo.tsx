"use client";

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface TransitionVideoProps {
    videoUrl: string;
    onComplete: () => void;
}

export const TransitionVideo: React.FC<TransitionVideoProps> = ({
    videoUrl,
    onComplete,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isSkipped, setIsSkipped] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleEnded = () => {
            if (!isSkipped) {
                onComplete();
            }
        };

        video.addEventListener('ended', handleEnded);

        // Auto-play the video
        video.play().catch((error) => {
            console.error('Error playing video:', error);
        });

        return () => {
            video.removeEventListener('ended', handleEnded);
        };
    }, [videoUrl, onComplete, isSkipped]);

    const handleSkip = () => {
        setIsSkipped(true);
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
            <div className="relative w-full max-w-6xl aspect-video mx-4">
                {/* Skip Button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 z-10 px-4 py-2 bg-black/70 hover:bg-black/90 rounded-lg text-white transition-colors flex items-center gap-2 border border-white/20"
                >
                    <X size={20} />
                    <span>Skip</span>
                </button>

                {/* Video Player */}
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain rounded-lg"
                    controls={false}
                    autoPlay
                    muted
                />
            </div>
        </div>
    );
};


