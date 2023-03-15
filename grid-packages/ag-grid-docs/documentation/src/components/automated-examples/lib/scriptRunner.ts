import { GridOptions } from 'ag-grid-community';
import { Drawer } from './createDrawer';
import { Point } from './geometry';
import { PathItem } from './pathRecorder';
import { animateClick, animateMouseDown, animateMouseUp } from './scriptActions/animateMouse';
import { AGCreatorAction, createAGActionCreator } from './scriptActions/createAGActionCreator';
import { createMoveToTargetTween } from './scriptActions/createMoveToTargetTween';
import { playPath } from './scriptActions/playPath';
import { removeFocus } from './scriptActions/removeFocus';
import { waitFor } from './scriptActions/waitFor';

export interface PathAction {
    type: 'path';
    path: PathItem<any>[];
}

export interface MoveToAction {
    type: 'moveTo';
    toPos: Point | (() => Point | undefined);
    speed?: number;
    duration?: number;
}

export interface WaitAction {
    type: 'wait';
    duration: number;
}

export interface ClickAction {
    type: 'click';
    duration?: number;
}

export interface MouseDownAction {
    type: 'mouseDown';
}

export interface MouseUpAction {
    type: 'mouseUp';
}

export interface RemoveFocusAction {
    type: 'removeFocus';
}

export interface CustomAction {
    type: 'custom';
    action: () => Promise<void> | void;
}

export type AGAction = AGCreatorAction & {
    type: 'agAction';
};

export interface ScriptRunner {
    currentState: () => RunScriptState;
    play: (params?: { loop?: boolean }) => void;
    pause: () => void;
    stop: () => void;
}

export type ScriptAction =
    | PathAction
    | MoveToAction
    | WaitAction
    | RemoveFocusAction
    | ClickAction
    | MouseDownAction
    | MouseUpAction
    | CustomAction
    | AGAction;

export interface CreateScriptActionParams {
    target: HTMLElement;
    containerEl?: HTMLElement;
    action: ScriptAction;
    gridOptions: GridOptions;
    debugDrawer?: Drawer;
}

export interface PlayScriptParams {
    target: HTMLElement;
    containerEl?: HTMLElement;
    script: ScriptAction[];
    gridOptions: GridOptions;
    loop?: boolean;
    onStateChange?: (state: RunScriptState) => void;
    debugDrawer?: Drawer;
}

export type RunScriptState = 'stopped' | 'stopping' | 'pausing' | 'paused' | 'playing';

function createScriptAction({ containerEl, target, action, gridOptions, debugDrawer }: CreateScriptActionParams) {
    const { type } = action;
    const agActionCreator = createAGActionCreator({ containerEl, gridOptions });

    if (type === 'path') {
        const scriptAction = action as PathAction;
        return playPath({ target, path: scriptAction.path });
    } else if (type === 'custom') {
        const scriptAction = action as CustomAction;
        return scriptAction.action();
    } else if (type === 'click') {
        const scriptAction = action as ClickAction;
        return animateClick(target, scriptAction.duration);
    } else if (type === 'mouseDown') {
        return animateMouseDown(target);
    } else if (type === 'mouseUp') {
        return animateMouseUp(target);
    } else if (type === 'removeFocus') {
        return removeFocus();
    } else if (type === 'wait') {
        const scriptAction = action as WaitAction;
        return waitFor(scriptAction.duration);
    } else if (type === 'moveTo') {
        const scriptAction = action as MoveToAction;
        const toPos = scriptAction.toPos instanceof Function ? scriptAction.toPos() : scriptAction.toPos;

        if (!toPos) {
            console.error(`No 'toPos' in 'moveTo' action`, scriptAction);
            return;
        }

        return createMoveToTargetTween({
            target,
            toPos,
            speed: scriptAction.speed,
            duration: scriptAction.duration,
            debugDrawer,
        });
    } else if (type === 'agAction') {
        const scriptAction = action as AGAction;
        const params = {
            actionType: scriptAction.actionType,
            // @ts-ignore
            actionParams: scriptAction.actionParams,
        };

        return agActionCreator(params);
    } else {
        throw new Error(`Unknown script action: ${JSON.stringify(action)}`);
    }
}

export function createScriptRunner({
    containerEl,
    target,
    script,
    gridOptions,
    loop,
    onStateChange,
    debugDrawer,
}: PlayScriptParams): ScriptRunner {
    const isDebugging = Boolean(debugDrawer);
    let runScriptState: RunScriptState;
    let loopScript = loop;
    let pauseIndex: number | undefined;
    const actionSequence = script.map((scriptAction) => {
        return () => {
            try {
                const result = createScriptAction({
                    containerEl,
                    target,
                    action: scriptAction,
                    gridOptions,
                    debugDrawer,
                });

                return result;
            } catch (error) {
                console.error('Script action error', {
                    scriptAction: JSON.stringify(scriptAction, function replacer(key, value) {
                        if (typeof value === 'function') {
                            return value.toString().replaceAll(/\s/gm, '').replace('function', '');
                        }
                        return value;
                    }),
                    error,
                });
                throw error;
            }
        };
    });

    const startActionSequence = (startIndex: number = 0) => {
        updateState('playing');
        const sequence = new Promise((resolve, reject) => {
            actionSequence
                .slice(startIndex)
                .reduce((p, action, index) => {
                    return p
                        .then(async () => {
                            if (runScriptState === 'stopping') {
                                updateState('stopped');
                                return;
                            } else if (runScriptState === 'stopped') {
                                return;
                            } else if (runScriptState === 'pausing') {
                                pauseIndex = index;
                                updateState('paused');
                                return;
                            } else if (runScriptState === 'paused') {
                                return;
                            }

                            return action();
                        })
                        .catch((error) => {
                            console.error('Action error (stopping)', {
                                index,
                                error,
                            });

                            // Error in action, stop the script
                            updateState('stopping');
                        });
                }, Promise.resolve())
                .then(resolve)
                .catch(reject);
        });

        sequence
            .then(() => {
                if (loopScript && runScriptState === 'playing') {
                    updateState('stopped');
                    startActionSequence();
                } else if (runScriptState === 'pausing') {
                    updateState('paused');
                } else if (runScriptState === 'paused') {
                    // Do nothing
                } else {
                    updateState('stopped');
                }
            })
            .catch((error) => {
                console.error('Action sequence error', error);
                stop();
            });
    };

    const stop: ScriptRunner['stop'] = () => {
        // Initiate stop
        updateState('stopping');
        pauseIndex = undefined;
        createjs.Tween.removeAllTweens();
    };
    const play: ScriptRunner['play'] = ({ loop } = {}) => {
        loopScript = loop === undefined ? loopScript : Boolean(loop);
        startActionSequence(pauseIndex);

        pauseIndex = undefined;
    };
    const pause: ScriptRunner['pause'] = () => {
        if (runScriptState === 'playing') {
            updateState('pausing');
        }
    };
    const currentState: ScriptRunner['currentState'] = (): RunScriptState => {
        return runScriptState;
    };

    const updateState = (state: RunScriptState) => {
        if (isDebugging) {
            console.log('Script runner state:', {
                state,
                pauseIndex,
            });
        }
        runScriptState = state;
        onStateChange && onStateChange(state);
    };

    // Initial playState
    updateState('stopped');

    return {
        currentState,
        play,
        pause,
        stop,
    };
}
