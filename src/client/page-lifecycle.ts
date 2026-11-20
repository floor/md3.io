/** Resources owned by one visit. Persistent shell modules never use this scope. */
export class PageLifecycle {
  private controller = new AbortController();
  private cleanups: (() => void)[] = [];
  get active() { return !this.controller.signal.aborted; }
  add(cleanup: () => void) { this.cleanups.push(cleanup); }
  events<T extends EventTarget>(target: T): Pick<T, 'addEventListener'>;
  events<T extends EventTarget>(target: T | null | undefined): Pick<T, 'addEventListener'> | undefined;
  events(target: EventTarget | null | undefined) {
    if (!target) return undefined;
    // Keep each target's native overloads (and event types) at the call site.
    return { addEventListener: (type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) => {
      target.addEventListener(type, listener, { ...(typeof options === 'boolean' ? { capture: options } : options), signal: this.controller.signal });
    } };
  }
  observer<T extends { disconnect(): void }>(observer: T): T {
    this.add(() => observer.disconnect());
    return observer;
  }
  timeout = (callback: () => void, delay: number) => {
    const timer = setTimeout(() => { if (this.active) callback(); }, delay);
    this.add(() => clearTimeout(timer));
    return timer;
  };
  destroy() {
    this.controller.abort();
    for (const cleanup of this.cleanups.splice(0).reverse()) cleanup();
  }
}

type Init = (content: HTMLElement, life: PageLifecycle) => void;
const pages = new Map<string, Init>();
let autoMount = true;
let activeNames: Set<string> | undefined;
const visits = new Map<string, PageLifecycle>();
// Counts are deliberately observable for the browser's duplicate-initialization check.
export const pageInitializations: Record<string, number> = {};
export function mountPage(name: string) {
  if (visits.has(name)) return;
  const content = document.getElementById('content');
  const init = pages.get(name);
  if (!content || !init) return;
  const life = new PageLifecycle();
  visits.set(name, life);
  pageInitializations[name] = (pageInitializations[name] ?? 0) + 1;
  try { init(content, life); } catch (error) { life.destroy(); visits.delete(name); throw error; }
}
export function registerPage(name: string, init: Init) {
  pages.set(name, init);
  if (autoMount && (!activeNames || activeNames.has(name))) mountPage(name);
}
export function preparePage() { autoMount = false; }
export function enterPage(names: string[]) {
  activeNames = new Set(names);
  autoMount = true;
  for (const name of names) mountPage(name);
}
export function leavePage() {
  autoMount = false;
  for (const life of visits.values()) life.destroy();
  visits.clear();
}
