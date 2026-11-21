// The site uses only these Navigation API members; TypeScript 5.9's DOM library
// predates them. Keep this narrow until lib.dom includes the standard API.
interface NavigationEntry { key: string; url: string }
interface SiteNavigateEvent extends Event {
  canIntercept: boolean;
  hashChange: boolean;
  downloadRequest: string | null;
  formData: FormData | null;
  navigationType: 'push' | 'replace' | 'reload' | 'traverse';
  destination: NavigationEntry;
  sourceElement?: Element;
  signal: AbortSignal;
  intercept(options: { focusReset: 'manual'; scroll: 'manual'; handler: () => Promise<void> }): void;
}
interface SiteNavigation {
  currentEntry: NavigationEntry | null;
  addEventListener(type: 'navigate', listener: (event: SiteNavigateEvent) => void): void;
}
interface Window { navigation?: SiteNavigation }
interface Element { moveBefore?(node: Node, child: Node | null): void }
