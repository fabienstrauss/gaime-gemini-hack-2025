import type { Room } from '../engine';

export const escapeRoomData: Room = {
    backgroundImage: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2544&auto=format&fit=crop", // Dark room / texture
    objects: [
        {
            id: "door",
            area: { x: 40, y: 20, width: 20, height: 60 },
            text: [
                {
                    content: "The heavy iron door is locked tight. There's no way out unless you find the key.",
                    condition: { requiredFalse: ["doorOpen"] }
                },
                {
                    content: "The door is unlocked and slightly ajar. Freedom awaits!",
                    condition: { requiredTrue: ["doorOpen"] }
                }
            ],
            options: [
                {
                    label: "Try to open",
                    action: "none",
                    condition: { requiredFalse: ["doorOpen", "hasKey"] }
                },
                {
                    label: "Unlock with Key",
                    action: "none",
                    effects: { setTrue: ["doorOpen"] },
                    condition: { requiredTrue: ["hasKey"], requiredFalse: ["doorOpen"] }
                },
                {
                    label: "Escape!",
                    action: "finish",
                    condition: { requiredTrue: ["doorOpen"] }
                }
            ]
        },
        {
            id: "rug",
            area: { x: 30, y: 80, width: 40, height: 15 },
            text: [
                {
                    content: "A dusty old rug covers the center of the room.",
                    condition: { requiredFalse: ["rugLifted"] }
                },
                {
                    content: "You've lifted the rug. It's just a bare floor underneath now.",
                    condition: { requiredTrue: ["rugLifted"] }
                }
            ],
            options: [
                {
                    label: "Lift Rug",
                    action: "none",
                    effects: { setTrue: ["rugLifted"] },
                    condition: { requiredFalse: ["rugLifted"] }
                }
            ]
        },
        {
            id: "key",
            area: { x: 45, y: 85, width: 5, height: 5 },
            image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=2000&auto=format&fit=crop", // Key image
            visibleCondition: { requiredTrue: ["rugLifted"], requiredFalse: ["hasKey"] },
            text: [
                {
                    content: "A shiny brass key was hidden under the rug!",
                }
            ],
            options: [
                {
                    label: "Take Key",
                    action: "none",
                    effects: { setTrue: ["hasKey"] },
                }
            ]
        }
    ]
};
