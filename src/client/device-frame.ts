// The device chooser: a toolbar of Mobile, Tablet and Desktop above a frame, with an
// orientation toggle. Mobile and Tablet give the frame the device's CSS size (its
// `innerWidth` is the device's), centred, and scaled down with `transform: scale` when
// the container is smaller, the scale shown beside. Desktop leaves the frame as the
// page styles it, filling its container. The choice is remembered per viewer.
//
// One module for every page that shows a frame of real mtrl: the example pages
// (src/server/shells/example.eta) and the Styles pages. The toolbar pairs a Material
// connected button group with a rotate button, both painted with the site's colours
// (styles/device-frame.css).
import createButtonGroup from 'material/components/button-group';
import smartphone from '../../icons/smartphone.svg' with { type: 'text' };
import tablet from '../../icons/tablet.svg' with { type: 'text' };
import desktop from '../../icons/desktop_windows.svg' with { type: 'text' };
import rotate from '../../icons/screen_rotation.svg' with { type: 'text' };

export type Device = 'mobile' | 'tablet' | 'desktop';
/** Each device's CSS size in portrait; Desktop fills the container. */
export const DEVICES: Record<Device, { label: string; icon: string; width?: number; height?: number }> = {
  mobile: { label: 'Mobile', icon: smartphone, width: 390, height: 844 },
  tablet: { label: 'Tablet', icon: tablet, width: 820, height: 1180 },
  desktop: { label: 'Desktop', icon: desktop },
};
export interface DeviceChoice { device: Device; landscape: boolean }
export interface DeviceFrameOptions {
  /** Where the choice is remembered. Pages that share a key share the choice. */
  storageKey?: string;
  /** The group's accessible name. */
  label?: string;
  /** Where the toolbar is placed. Defaults to the top of the frame's own stack. */
  barParent?: HTMLElement;
  /** Called after every change, with the size applied (undefined on Desktop). */
  onChange?: (choice: DeviceChoice, size?: { width: number; height: number; scale: number }) => void;
}
export interface DeviceFrame {
  element: HTMLElement;
  get(): DeviceChoice;
  set(choice: Partial<DeviceChoice>): void;
  /** Show `choice` without remembering it. `null` returns to the remembered choice. */
  hold(choice: DeviceChoice | null): void;
  destroy(): void;
}

const DEFAULT: DeviceChoice = { device: 'desktop', landscape: false };
const isDevice = (value: unknown): value is Device => typeof value === 'string' && Object.hasOwn(DEVICES, value);
function readChoice(key: string): DeviceChoice {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    return { device: isDevice(saved?.device) ? saved.device : DEFAULT.device, landscape: saved?.landscape === true };
  } catch { return { ...DEFAULT }; }
}
function saveChoice(key: string, choice: DeviceChoice) {
  try { localStorage.setItem(key, JSON.stringify(choice)); } catch { /* The choice lasts until the page closes. */ }
}

/** The frame's size and scale for a choice in a container `available` px wide. */
export function fit(choice: DeviceChoice, available: number, maxHeight = Infinity): { width: number; height: number; scale: number } | undefined {
  const { width, height } = DEVICES[choice.device];
  if (!width || !height) return undefined;
  const [w, h] = choice.landscape ? [height, width] : [width, height];
  const scale = Math.min(1, available / w, maxHeight / h);
  return { width: w, height: h, scale: Math.max(0.1, Math.floor(scale * 1000) / 1000) };
}

/**
 * Puts the device chooser above `frame` and wraps it in a stage that sizes it. The
 * frame stays the same element (its `src` and listeners are untouched). `barParent`
 * places the toolbar somewhere else, such as a card header.
 */
export function mountDeviceFrame(frame: HTMLIFrameElement, options: DeviceFrameOptions = {}): DeviceFrame {
  const key = options.storageKey ?? 'md3-device';
  let persisted = readChoice(key);
  let held: DeviceChoice | null = null;
  const shown = (): DeviceChoice => held ?? persisted;

  const root = document.createElement('div');
  root.className = 'device';
  const bar = document.createElement('div');
  bar.className = 'device__bar';
  const stage = document.createElement('div');
  stage.className = 'device__stage';
  const viewport = document.createElement('div');
  viewport.className = 'device__viewport';
  frame.replaceWith(root);
  viewport.append(frame);
  stage.append(viewport);
  if (options.barParent) options.barParent.append(bar);
  else root.append(bar);
  root.append(stage);

  const group = createButtonGroup({
    kind: 'connected', selection: 'single', required: true, size: 'xs', variant: 'tonal', ripple: false,
    buttons: (Object.keys(DEVICES) as Device[]).map(device => ({ value: device, text: DEVICES[device].label, icon: DEVICES[device].icon, selected: device === persisted.device })),
  });
  group.element.setAttribute('aria-label', options.label ?? 'Device');
  const turn = document.createElement('button');
  turn.type = 'button';
  turn.className = 'site-icon-button device__rotate';
  turn.setAttribute('aria-label', 'Rotate');
  turn.innerHTML = rotate;
  const readout = document.createElement('span');
  readout.className = 'device__size';
  readout.setAttribute('aria-live', 'polite');
  bar.append(group.element, turn, readout);

  const layout = () => {
    const choice = shown();
    const desktop = choice.device === 'desktop';
    root.dataset.device = choice.device;
    turn.disabled = desktop;
    turn.setAttribute('aria-pressed', String(choice.landscape && !desktop));
    // A hidden Preview (the Code tab) reports no width. Measuring it floors the
    // scale at 0.1 and the readout sticks at 10% until the stage is shown again.
    const available = stage.clientWidth || root.clientWidth;
    if (available <= 0) return;
    const size = fit(choice, available, Math.max(360, innerHeight - 120));
    if (!size) {
      viewport.removeAttribute('style');
      frame.style.removeProperty('width');
      frame.style.removeProperty('height');
      frame.style.removeProperty('transform');
      readout.textContent = '';
    } else {
      viewport.style.width = `${size.width * size.scale}px`;
      viewport.style.height = `${size.height * size.scale}px`;
      frame.style.width = `${size.width}px`;
      frame.style.height = `${size.height}px`;
      frame.style.transform = size.scale < 1 ? `scale(${size.scale})` : '';
      readout.textContent = `${size.width} × ${size.height}${size.scale < 1 ? ` · ${Math.round(size.scale * 100)}%` : ''}`;
    }
    options.onChange?.(choice, size);
  };
  const set = (next: Partial<DeviceChoice>) => {
    persisted = { ...persisted, ...next };
    if (!held && !group.isSelected(persisted.device)) group.select(persisted.device);
    saveChoice(key, persisted);
    layout();
  };
  const hold = (next: DeviceChoice | null) => {
    held = next;
    layout();
  };
  group.on('change', event => {
    if (held) return;
    const value = (event as { values?: string[] }).values?.[0];
    if (isDevice(value) && value !== persisted.device) set({ device: value });
  });
  turn.addEventListener('click', () => { if (!held && persisted.device !== 'desktop') set({ landscape: !persisted.landscape }); });

  const observer = new ResizeObserver(() => layout());
  observer.observe(stage);
  addEventListener('resize', layout);
  layout();

  return {
    element: root,
    get: () => ({ ...shown() }),
    set,
    hold,
    destroy() {
      observer.disconnect();
      group.destroy();
      removeEventListener('resize', layout);
      bar.remove();
      root.replaceWith(frame);
      for (const property of ['width', 'height', 'transform']) frame.style.removeProperty(property);
    },
  };
}
