import React, { useState, useEffect } from 'react';
import { checkCondition, applyEffect } from '../engine';
import type { Room, InteractiveObject, GameState, Option } from '../engine';
import { InteractionModal } from './InteractionModal';
import clsx from 'clsx';

interface RoomEngineProps {
    room: Room;
    initialState?: GameState;
    onFinish: (outcome: any) => void;
}

export const RoomEngine: React.FC<RoomEngineProps> = ({
    room,
    initialState = {},
    onFinish,
}) => {
    const [gameState, setGameState] = useState<GameState>(initialState);
    const [activeObject, setActiveObject] = useState<InteractiveObject | null>(null);

    // Reset state if initialState changes (optional, but good for debugging)
    useEffect(() => {
        setGameState(initialState);
    }, [initialState]);

    const handleObjectClick = (obj: InteractiveObject) => {
        setActiveObject(obj);
    };

    const handleOptionSelect = (option: Option) => {
        // Apply effects
        const newState = applyEffect(option.effects, gameState);
        setGameState(newState);

        // Handle actions
        if (option.action === 'finish') {
            onFinish({ success: true, finalState: newState });
            setActiveObject(null);
        } else if (option.action === 'fail') {
            onFinish({ success: false, finalState: newState });
            setActiveObject(null);
        } else if (option.action === 'next') {
            // In a multi-room setup, this would trigger a room change. 
            // For single room, we might just close the modal or do nothing.
            setActiveObject(null);
        } else {
            // 'none' action, just stay or close if no options left?
            // Usually we might want to close the modal if it was a "Leave" option, 
            // but if it was "Take Key", we might want to stay to see the result?
            // For now, let's assume we close the modal if the option doesn't explicitly say otherwise, 
            // OR we re-evaluate the modal content.

            // If the option has effects, the modal content might change (e.g. "Take Key" -> Key gone).
            // If the object becomes invisible due to the effect, we MUST close the modal.
            if (activeObject && activeObject.visibleCondition && !checkCondition(activeObject.visibleCondition, newState)) {
                setActiveObject(null);
            }
        }
    };

    return (
        <div className="w-full aspect-video relative overflow-hidden bg-black shadow-2xl rounded-lg select-none">
            {/* Background */}
            <img
                src={room.backgroundImage}
                alt="Room Background"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Interactive Zones */}
            {room.objects.map((obj) => {
                const isVisible = checkCondition(obj.visibleCondition, gameState);
                if (!isVisible) return null;

                return (
                    <button
                        key={obj.id}
                        onClick={() => handleObjectClick(obj)}
                        className={clsx(
                            "absolute hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/30 rounded",
                            // Debugging helper: uncomment to see zones
                            // "bg-red-500/20 border-red-500" 
                        )}
                        style={{
                            left: `${obj.area.x}%`,
                            top: `${obj.area.y}%`,
                            width: `${obj.area.width}%`,
                            height: `${obj.area.height}%`,
                        }}
                        aria-label={`Interact with object ${obj.id}`}
                    />
                );
            })}

            {/* Modal */}
            {activeObject && (
                <InteractionModal
                    object={activeObject}
                    gameState={gameState}
                    onClose={() => setActiveObject(null)}
                    onOptionSelect={handleOptionSelect}
                />
            )}

            {/* Debug Overlay (Optional) */}
            {/* <div className="absolute top-0 left-0 p-2 bg-black/50 text-xs text-white font-mono pointer-events-none">
        {JSON.stringify(gameState, null, 2)}
      </div> */}
        </div>
    );
};
