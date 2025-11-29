import type {
    Condition,
    Effect,
    GameState,
    InteractiveObject,
    TextVariant,
    Option,
} from './schema';

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

export function isObjectVisible(object: InteractiveObject, state: GameState): boolean {
    return checkCondition(object.visibleCondition, state);
}

export function getActiveTextVariant(object: InteractiveObject, state: GameState): TextVariant | undefined {
    return object.text.find((variant) => checkCondition(variant.condition, state)) ?? object.text[0];
}

export function getVisibleOptions(object: InteractiveObject, state: GameState): Option[] {
    return object.options.filter((option) => checkCondition(option.condition, state));
}

export interface ResolvedObjectView {
    object: InteractiveObject;
    text: TextVariant | undefined;
    options: Option[];
    isVisible: boolean;
}

export function resolveObjectView(object: InteractiveObject, state: GameState): ResolvedObjectView {
    const isVisible = isObjectVisible(object, state);
    const text = getActiveTextVariant(object, state);
    const options = getVisibleOptions(object, state);

    return { object, text, options, isVisible };
}
