// What the docs examples take from the app around them, declared once for the docs
// check (scripts/check-docs.ts): types for level 1, working values for level 2.
//
// Keep it short and reviewed. Only app identifiers belong here, never an mtrl value:
// an example that needs an mtrl component or constant must create or import it.
declare global {
  // The app's icons, as SVG markup
  var addIcon: string, audioIcon: string, backIcon: string, bikeIcon: string, calendarIcon: string,
    carIcon: string, checkIcon: string, closeIcon: string, copyIcon: string, editIcon: string,
    eyeIcon: string, eyeOffIcon: string, forwardIcon: string, gridIcon: string, heartFilledIcon: string,
    heartOutlineIcon: string, homeIcon: string, inboxIcon: string, labelIcon: string, listIcon: string,
    locationIcon: string, menuIcon: string, micIcon: string, micSvg: string, moreIcon: string, outboxIcon: string,
    pauseIcon: string, photoIcon: string, playIcon: string, saveIcon: string, searchIcon: string,
    settingsIcon: string, shareIcon: string, starIcon: string, videoIcon: string, volumeOffIcon: string,
    volumeUpIcon: string, walkIcon: string, watchIcon: string;

  // The app's state and services
  var form: HTMLFormElement;
  var holidays: Date[];
  var inbox: { subscribe(listener: (unread: number) => void): void };
  var labels: Promise<string[]>;
  var meetingInput: HTMLInputElement;
  var myApi: { saveUser(data: unknown): Promise<unknown>; updateUser(data: unknown): Promise<unknown> };
  var people: { name: string; email: string; avatar: string }[];
  var request: XMLHttpRequest;
  var router: { go(path: string): void };
  var submit: HTMLButtonElement;
  var timeButton: HTMLButtonElement;

  // The app's actions
  function acceptTerms(accepted: boolean): void;
  function addEvent(): void;
  function addToFavorites(): void;
  function applyFilters(values?: string[]): void;
  function applyMarks(marks: string[]): void;
  function applyThemeColor(color: string): void;
  function book(checkIn: Date, checkOut: Date): void;
  function checkForUpdates(): Promise<void>;
  function choose(id: string): void;
  function commitArchive(): void;
  function createItem(): void;
  function deleteItem(): void;
  function exportPdf(): void;
  function filterByPrice(levels: string[]): void;
  function getCPUUsage(): number;
  function getSelectedFile(): File;
  function hideExportPanel(): void;
  function isFavorite(): boolean;
  function loadAllFilters(): void;
  function loadMoreItems(): Promise<void>;
  function logoutUser(): void;
  function lookup(query: string): string[];
  function online(): boolean;
  function openMenu(): void;
  function performStep(step: number): Promise<void>;
  function refreshResults(): void;
  function removeFromFavorites(): void;
  function renderEditor(): string;
  function runSearch(query: string): void;
  function save(data?: unknown): Promise<void>;
  function saveColor(color: string): void;
  function search(date: Date | [Date, Date] | null): void;
  function saveSettings(settings: Record<string, number>): void;
  function setFavorite(favorite: boolean): void;
  function setPriceRange(low: number, high: number): void;
  function setSize(size: string): void;
  function setSystemVolume(volume: number): void;
  function setWifi(on: boolean): void;
  function showDetail(event: Event): void;
  function showExportPanel(): void;
  function showPanel(value: string): void;
  function showRange(range: string): void;
  function showSlide(index: number): void;
  function showView(view: string): void;
  function startVoice(): void;
  function submitForm(data: FormData): Promise<void>;
  function track(event: string): void;
  function undoArchive(): void;
  function unsend(email: string): void;
  function updateEqualizer(band: number, gain: number): void;
  function uploadFile(file: File, onProgress: (percent: number) => void): Promise<void>;
  function watchLater(): void;
}

const svg = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 4h16v16H4z"/></svg>';
const icons = `
  add audio back bike calendar car check close copy edit eye eyeOff forward grid heartFilled
  heartOutline home inbox label list location menu mic more outbox pause photo play save search
  settings share star video volumeOff volumeUp walk watch
`;
const noops = `
  acceptTerms addEvent addToFavorites applyFilters applyMarks applyThemeColor book choose commitArchive
  createItem deleteItem exportPdf filterByPrice hideExportPanel loadAllFilters
  logoutUser openMenu refreshResults removeFromFavorites runSearch saveColor search saveSettings
  setFavorite setPriceRange setSize setSystemVolume setWifi showDetail showExportPanel showPanel showRange showSlide showView
  startVoice track undoArchive unsend updateEqualizer watchLater
`;
const noop = () => {};
Object.assign(globalThis,
  { micSvg: svg },
  Object.fromEntries(icons.trim().split(/\s+/).map(name => [`${name}Icon`, svg])),
  Object.fromEntries(noops.trim().split(/\s+/).map(name => [name, noop])),
  {
    form: document.body.appendChild(document.createElement('form')),
    holidays: [new Date(2026, 11, 25), new Date(2027, 0, 1)],
    inbox: { subscribe: (listener: (unread: number) => void) => listener(3) },
    labels: Promise.resolve(['Family', 'Work']),
    meetingInput: document.createElement('input'),
    myApi: { saveUser: async (data: unknown) => data, updateUser: async (data: unknown) => data },
    people: [{ name: 'Ada Lovelace', email: 'ada@example.com', avatar: '/avatars/ada.png' }],
    request: new XMLHttpRequest(),
    router: { go: noop },
    submit: document.createElement('button'),
    timeButton: document.body.appendChild(document.createElement('button')),
    checkForUpdates: async () => {},
    getCPUUsage: () => 42,
    getSelectedFile: () => new File([''], 'photo.jpg'),
    isFavorite: () => false,
    loadMoreItems: async () => {},
    lookup: (query: string) => [query],
    online: () => true,
    performStep: async () => {},
    renderEditor: () => '<p>Editor</p>',
    save: async () => {},
    submitForm: async () => {},
    uploadFile: async (_file: File, onProgress: (percent: number) => void) => onProgress(100),
  },
);

// The app's API, for the examples that fetch from it
const api: Record<string, unknown> = {
  '/api/departments': [{ id: 'eng', name: 'Engineering' }, { id: 'ops', name: 'Operations' }],
};
const fetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const path = String(input);
  return path.startsWith('/api/') ? Promise.resolve(Response.json(api[path] ?? {})) : fetch(input, init);
};

export {};
