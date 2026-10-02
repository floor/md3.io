// The theme app's two foundation features, each `(config) => (app) => ({ ...app, ns })`:
// a small state (get, set, on) with the app's teardown list, and the UI built once from
// config/layout.ts by mtrl-addons' createLayout.
import { createEmitter } from 'mtrl/core/state';
import { createLayout, clearClassCache, clearFragmentPool } from 'mtrl-addons/layout';

export type App = Record<string, any>;

/** `app.state`: `set` emits `<key>` with the new value, and nothing when it is unchanged; `touch` emits it anyway. */
export const withState = (initial: Record<string, unknown>) => (app: App) => {
  const emitter = createEmitter();
  const data = { ...initial };
  const cleanups: (() => void)[] = [() => emitter.clear()];
  return {
    ...app,
    state: {
      get: (key: string) => data[key],
      set: (key: string, value: unknown) => { if (!Object.is(data[key], value)) { data[key] = value; emitter.emit(key, value); } },
      on: (key: string, handler: (value: any) => void) => emitter.on(key, handler),
      /** Emits a key's value again: what it names has changed in place. */
      touch: (key: string) => emitter.emit(key, data[key]),
    },
    teardown: { add: (cleanup: () => void) => cleanups.push(cleanup), run: () => { for (const cleanup of cleanups.splice(0).reverse()) cleanup(); } },
  };
};

/** `app.ui`: the layout's named parts. Its teardown destroys them and empties the layout's caches. */
export const withUI = (layout: unknown[], container: HTMLElement) => (app: App) => {
  const result = createLayout(layout, container, { prefix: false });
  app.teardown.add(() => { result.destroy(); clearClassCache(); clearFragmentPool(); container.replaceChildren(); });
  return { ...app, ui: result.component as Record<string, any>, element: container };
};
