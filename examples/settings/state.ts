// The settings state: one object, replaced on every change, with subscribers. The
// framework variants all keep the same shape; only the way a change reaches the screen
// differs.
import { DEFAULTS, type Settings, type SettingsKey } from "./data";

export interface Store {
  /** A copy of the current settings. */
  get: () => Settings;
  /** Applies a partial change and notifies. No-op if nothing actually changes. */
  set: (changes: Partial<Settings>) => void;
  /** Back to DEFAULTS. */
  reset: () => void;
  /** A copy of the current settings to hand to `restore` later. */
  snapshot: () => Settings;
  /** Replaces the settings with a snapshot and notifies. */
  restore: (snapshot: Settings) => void;
  /** Calls back on every change; returns the unsubscribe. */
  subscribe: (listener: (state: Settings) => void) => () => void;
}

export const createStore = (initial: Settings = { ...DEFAULTS }): Store => {
  let state: Settings = { ...initial };
  const listeners = new Set<(state: Settings) => void>();
  const update = (next: Settings): void => {
    if ((Object.keys(next) as SettingsKey[]).every((key) => state[key] === next[key])) return;
    state = next;
    for (const listener of listeners) listener(state);
  };
  return {
    get: () => ({ ...state }),
    set: (changes) => update({ ...state, ...changes }),
    reset: () => update({ ...DEFAULTS }),
    snapshot: () => ({ ...state }),
    restore: (snapshot) => update({ ...snapshot }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

/**
 * One setting change as the screen makes it. Airplane mode is the one setting that
 * reaches into others: turning it on turns Wi-Fi and Bluetooth off (they are disabled
 * while it is on), turning it off leaves them off.
 */
export const changeSetting = <K extends SettingsKey>(store: Store, key: K, value: Settings[K]): void => {
  if (key === "airplane" && value === true) store.set({ airplane: true, wifi: false, bluetooth: false });
  else store.set({ [key]: value } as Partial<Settings>);
};
