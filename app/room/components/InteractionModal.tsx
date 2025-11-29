import React from 'react';
import { X } from 'lucide-react';
import type { InteractiveObject, Option, GameState } from '../engine';
import { checkCondition } from '../engine';

interface InteractionModalProps {
    object: InteractiveObject;
    gameState: GameState;
    onClose: () => void;
    onOptionSelect: (option: Option) => void;
}

export const InteractionModal: React.FC<InteractionModalProps> = ({
    object,
    gameState,
    onClose,
    onOptionSelect,
}) => {
    // Find the first text variant that matches the condition
    const textVariant = object.text.find((t) => checkCondition(t.condition, gameState));
    const content = textVariant ? textVariant.content : "You see nothing of interest.";

    // Filter options based on condition
    const visibleOptions = object.options.filter((opt) => checkCondition(opt.condition, gameState));

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
            <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[80vh]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Media Section (Left) */}
                {(object.image || object.video) && (
                    <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative">
                        {object.video ? (
                            <video
                                src={object.video}
                                autoPlay
                                loop
                                muted
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={object.image}
                                alt="Object"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                )}

                {/* Content Section (Right) */}
                <div className={`w-full ${object.image || object.video ? 'md:w-1/2' : 'w-full'} p-8 flex flex-col`}>
                    <div className="flex-grow overflow-y-auto mb-6">
                        <p className="text-xl text-gray-200 leading-relaxed whitespace-pre-wrap font-serif">
                            {content}
                        </p>
                    </div>

                    {/* Options */}
                    <div className="flex flex-col gap-3 mt-auto">
                        {visibleOptions.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => onOptionSelect(option)}
                                className="w-full py-3 px-6 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-left transition-all hover:border-gray-400 group"
                            >
                                <span className="text-lg text-gray-100 group-hover:text-white">
                                    {option.label}
                                </span>
                            </button>
                        ))}

                        {visibleOptions.length === 0 && (
                            <button
                                onClick={onClose}
                                className="w-full py-3 px-6 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-center text-gray-400"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
