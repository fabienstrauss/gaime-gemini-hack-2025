import type { Condition, Effect, GameState } from './schema';

export function checkCondition(condition: Condition | undefined, state: GameState): boolean {
    if (!condition) return true;

    if (condition.requiredTrue) {
        for (const key of condition.requiredTrue) {
            if (!state[key]) return false;
        }
    }

    if (condition.requiredFalse) {
        for (const key of condition.requiredFalse) {
            if (state[key]) return false;
        }
    }

    return true;
}

export function applyEffect(effect: Effect | undefined, state: GameState): GameState {
    if (!effect) return state;

    const newState = { ...state };

    if (effect.setTrue) {
        for (const key of effect.setTrue) {
            newState[key] = true;
        }
    }

    if (effect.setFalse) {
        for (const key of effect.setFalse) {
            newState[key] = false;
        }
    }

    return newState;
}
