import type { Room } from '../engine';

export const nanoBanaRoom: Room = {
  backgroundImage: "/assets/lab_bg.png",
  objects: [
    {
      id: "stasis_field",
      area: { x: 35, y: 30, width: 30, height: 40 },
      image: "/assets/nano_banana.png",
      text: [
        {
          content: "The legendary 'Nano Banana' floats within a high-energy stasis field. It hums with infinite potential.",
          condition: { requiredFalse: ["fieldDown", "bananaEaten"] }
        },
        {
          content: "The stasis field is down. The Nano Banana is vulnerable... and looks delicious.",
          condition: { requiredTrue: ["fieldDown"], requiredFalse: ["bananaEaten"] }
        },
        {
          content: "The field is empty. You can still taste the potassium-rich knowledge.",
          condition: { requiredTrue: ["bananaEaten"] }
        }
      ],
      options: [
        {
          label: "Deactivate Field",
          action: "none",
          effects: { setTrue: ["fieldDown"] },
          condition: { requiredFalse: ["fieldDown"] }
        },
        {
          label: "Consume Nano Banana",
          action: "finish",
          effects: { setTrue: ["bananaEaten"] },
          condition: { requiredTrue: ["fieldDown"], requiredFalse: ["bananaEaten"] }
        }
      ]
    },
    {
      id: "terminal",
      area: { x: 70, y: 50, width: 15, height: 20 },
      text: [
        {
          content: "A terminal displaying complex potassium metrics. All systems nominal.",
        }
      ],
      options: [
        {
          label: "Read Logs",
          action: "none",
        }
      ]
    },
    {
      id: "quantum_console",
      area: { x: 15, y: 35, width: 18, height: 25 },
      text: [
        {
          content: "A secondary console scrolls through quantum fluctuation data, awaiting manual overrides.",
        }
      ],
      options: [
        {
          label: "Run Diagnostics",
          action: "none",
        }
      ]
    }
  ]
};
