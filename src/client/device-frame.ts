// The device chooser: a toolbar of Mobile, Tablet and Desktop above a frame, with an
// orientation toggle. Mobile and Tablet give the frame the device's CSS size (its
// `innerWidth` is the device's), centred, and scaled down with `transform: scale` when
// the container is smaller, the scale shown beside. Desktop leaves the frame as the
// page styles it, filling its container. The choice is remembered per viewer.
//
// One module for every page that shows a frame of real mtrl: the example pages
// (src/server/shells/example.eta) and the Styles pages. The toolbar is mtrl itself, a
// connected button group and an icon button, painted with the site's colours
// (styles/device-frame.css).
import createButtonGroup from 'mtrl/components/button-group';
import createIconButton from 'mtrl/components/icon-button';
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
  /** Called after every change, with the size applied (undefined on Desktop). */
  onChange?: (choice: DeviceChoice, size?: { width: number; height: number; scale: number }) => void;
}
export interface DeviceFrame {
  element: HTMLElement;
  get(): DeviceChoice;
  set(choice: Partial<DeviceChoice>): void;
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
 * frame stays the same element (its `src` and listeners are untouched).
 */
export function mountDeviceFrame(frame: HTMLIFrameElement, options: DeviceFrameOptions = {}): DeviceFrame {
  const key = options.storageKey ?? 'md3-device';
  let choice = readChoice(key);

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
  root.append(bar, stage);

  const group = createButtonGroup({
    kind: 'connected', selection: 'single', required: true, size: 'xs', variant: 'tonal', ripple: false,
    buttons: (Object.keys(DEVICES) as Device[]).map(device => ({ value: device, text: DEVICES[device].label, icon: DEVICES[device].icon, selected: device === choice.device })),
  });
  group.element.setAttribute('aria-label', options.label ?? 'Device');
  const turn = createIconButton({ icon: rotate, ariaLabel: 'Rotate', variant: 'standard', size: 'xs', toggle: true, selected: choice.landscape, toggleOnClick: false, ripple: false });
  const readout = document.createElement('span');
  readout.className = 'device__size';
  readout.setAttribute('aria-live', 'polite');
  bar.append(group.element, turn.element, readout);

  const layout = () => {
    const desktop = choice.device === 'desktop';
    root.dataset.device = choice.device;
    turn.element.disabled = desktop;
    turn.element.setAttribute('aria-pressed', String(choice.landscape && !desktop));
    turn.element.classList.toggle('mtrl-icon-button--selected', choice.landscape && !desktop);
    const size = fit(choice, stage.clientWidth || root.clientWidth, Math.max(360, innerHeight - 120));
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
    choice = { ...choice, ...next };
    if (!group.isSelected(choice.device)) group.select(choice.device);
    saveChoice(key, choice);
    layout();
  };
  group.on('change', event => {
    const value = (event as { values?: string[] }).values?.[0];
    if (isDevice(value) && value !== choice.device) set({ device: value });
  });
  turn.element.addEventListener('click', () => { if (choice.device !== 'desktop') set({ landscape: !choice.landscape }); });

  const observer = new ResizeObserver(() => layout());
  observer.observe(stage);
  addEventListener('resize', layout);
  layout();

  return {
    element: root,
    get: () => ({ ...choice }),
    set,
    destroy() {
      observer.disconnect();
      removeEventListener('resize', layout);
      root.replaceWith(frame);
      for (const property of ['width', 'height', 'transform']) frame.style.removeProperty(property);
    },
  };
}
