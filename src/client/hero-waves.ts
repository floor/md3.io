// The overview heroes' art tile: layered waves drawn in the theme's own colours.
// After the owner's generative-waves sketch (seven waves of four to eight points,
// smoothed, each filled with a gradient), drawn without libraries. Its colours are the
// theme's roles as CSS variables, so a theme or mode change recolours it without a redraw.
//
// Configurable per tile with data attributes (or the options argument):
//   data-waves="7"                      how many waves
//   data-roles="primary,tertiary,…"     the colour roles they are drawn from
//   data-depth="3"                      how many back waves are darkened
//   data-points="4-8"                   points per wave, a range
//   data-amplitude="32-64"              how far a point strays from its line, a range
//   data-seed="md3"                     the same drawing on every visit (otherwise new each time)
//   data-shape="swell"                  waves (diagonal bands), swell (rolling hills) or blobs
// The page address overrides any of them with a hero- prefix: ?hero-shape=blobs&hero-seed=7.
const SVG = 'http://www.w3.org/2000/svg';
const SIZE = 1000;

export type WavesShape = 'waves' | 'swell' | 'blobs';

export interface WavesOptions {
  shape: WavesShape;
  waves: number;
  roles: readonly string[];
  depth: number;
  points: readonly [number, number];
  amplitude: readonly [number, number];
  seed?: string;
}

export const WAVES_DEFAULTS: WavesOptions = {
  shape: 'swell',
  waves: 7,
  // The theme's accents, and their containers.
  roles: ['primary', 'secondary', 'tertiary', 'primary-container', 'secondary-container', 'tertiary-container'],
  depth: 3,
  points: [4, 8],
  amplitude: [32, 64],
};

type Point = { x: number; y: number };

/** A seeded random source (mulberry32 over a string hash), or Math.random. */
function source(seed?: string): () => number {
  if (seed === undefined) return Math.random;
  let state = [...seed].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 2654435761), 2166136261) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const map = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
const lerp = (from: number, to: number, t: number) => from * (1 - t) + to * t;

/** A smooth curve through the points: Catmull-Rom segments as cubic Béziers; closed, a loop. */
function spline(points: readonly Point[], closed = false): string {
  const at = (i: number) => closed ? points[(i + points.length) % points.length]! : points[Math.max(0, Math.min(points.length - 1, i))]!;
  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < (closed ? points.length : points.length - 1); i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    path += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
  }
  return closed ? `${path} Z` : path;
}

const role = (name: string) => `var(--mtrl-sys-color-${name})`;
const darker = (color: string) => `color-mix(in srgb, ${color} 45%, ${role('on-surface')})`;

function element<K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string | number>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}

const range = (value: string | undefined, fallback: readonly [number, number]): [number, number] => {
  const [min, max] = (value ?? '').split('-').map(Number);
  return Number.isFinite(min) && Number.isFinite(max) ? [min!, max!] : [...fallback] as [number, number];
};

/**
 * The tile's options: its data attributes over the defaults, and the page address over
 * both, to try a look without editing anything: ?hero-shape=blobs&hero-seed=7&hero-amplitude=60-120.
 */
export function wavesOptions(tile: HTMLElement): WavesOptions {
  const query = new URLSearchParams(location.search);
  const read = (name: string) => query.get(`hero-${name}`) ?? tile.dataset[name];
  const [shape, waves, roles, depth, points, amplitude, seed] = ['shape', 'waves', 'roles', 'depth', 'points', 'amplitude', 'seed'].map(read);
  return {
    shape: shape === 'waves' || shape === 'swell' || shape === 'blobs' ? shape : WAVES_DEFAULTS.shape,
    waves: Number(waves) > 0 ? Number(waves) : WAVES_DEFAULTS.waves,
    roles: roles ? roles.split(',').map(name => name.trim()).filter(Boolean) : WAVES_DEFAULTS.roles,
    depth: depth !== undefined && Number.isFinite(Number(depth)) ? Number(depth) : WAVES_DEFAULTS.depth,
    points: range(points, WAVES_DEFAULTS.points),
    amplitude: range(amplitude, WAVES_DEFAULTS.amplitude),
    seed,
  };
}

/** One layer's outline, for each shape. Layers go from the back (0) to the front. */
function shapePath(shape: WavesShape, i: number, count: number, steps: number, stray: number, between: (min: number, max: number) => number): string {
  const points: Point[] = [];
  if (shape === 'blobs') {
    // A soft loop around a centre, its radius wandering by the amplitude.
    const centre = { x: between(0, SIZE), y: map(i, 0, count, 0, SIZE) + between(-120, 120) };
    const radius = between(SIZE * 0.22, SIZE * 0.42) * map(i, 0, count, 1.3, 0.8);
    const turns = Math.max(5, steps + 2);
    const rotation = between(0, Math.PI * 2);
    for (let k = 0; k < turns; k++) {
      const angle = rotation + (k / turns) * Math.PI * 2;
      const r = radius + between(-stray, stray) * 2;
      points.push({ x: centre.x + Math.cos(angle) * r, y: centre.y + Math.sin(angle) * r });
    }
    return spline(points, true);
  }
  if (shape === 'swell') {
    // Rolling hills across the tile: a level line, lifted and dropped in long arcs.
    const level = map(i, 0, count, SIZE * 0.08, SIZE * 0.85);
    const phase = between(0, Math.PI * 2);
    const cycles = between(0.6, 1.4);
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const x = lerp(-SIZE * 0.1, SIZE * 1.1, t);
      const y = level + Math.sin(phase + t * Math.PI * 2 * cycles) * stray * 2.4 + between(-stray, stray) * 0.5;
      points.push({ x, y });
    }
    const first = points[0]!;
    const last = points[points.length - 1]!;
    return `${spline(points)} L ${last.x} ${SIZE * 1.1} L ${first.x} ${SIZE * 1.1} Z`;
  }
  // Waves: diagonal bands, as in the sketch.
  const offset = between(-50, 50);
  const start = { x: 0, y: map(i, 0, count, -SIZE / 2, SIZE / 3) + offset };
  const end = { x: SIZE, y: map(i, 0, count, 0, SIZE) + offset };
  for (let step = 0; step <= steps; step++) {
    const t = map(step, 0, steps, 0, 1);
    const edge = step === 0 || step === steps;
    points.push({ x: lerp(start.x, end.x, t) + (edge ? 0 : between(-stray, stray)), y: lerp(start.y, end.y, t) + (edge ? 0 : between(-stray, stray)) });
  }
  return `${spline(points)} L ${end.x} ${SIZE} L ${start.x} ${SIZE} Z`;
}

/** A drawing for one tile, from its data attributes unless options are given. */
export function drawWaves(tile: HTMLElement, options: WavesOptions = wavesOptions(tile)): void {
  const random = source(options.seed);
  const between = (min: number, max: number) => min + random() * (max - min);
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
  // The next stop's colour is the next role along: a turn of the palette, as the sketch
  // spins its colour by 60°.
  const turn = (name: string) => options.roles[(options.roles.indexOf(name) + 1) % options.roles.length]!;

  const svg = element('svg', { viewBox: `0 0 ${SIZE} ${SIZE}`, preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true', focusable: 'false' });
  svg.classList.add('page-hero__waves');
  const defs = element('defs', {});
  svg.append(defs, element('rect', { width: SIZE, height: SIZE, style: `fill: ${darker(role(pick(options.roles)))}` }));
  const id = `waves-${Math.floor(random() * 1e9).toString(36)}`;
  for (let i = 0; i < options.waves; i++) {
    const steps = Math.round(between(options.points[0], options.points[1]));
    const stray = between(options.amplitude[0], options.amplitude[1]);
    const d = shapePath(options.shape, i, options.waves, steps, stray, between);
    const accent = pick(options.roles);
    // The back waves are darker, as in the sketch.
    const back = i < options.depth;
    const from = back ? darker(role(accent)) : role(accent);
    const to = back ? darker(role(turn(accent))) : role(turn(accent));
    const gradient = element('linearGradient', { id: `${id}-${i}`, x1: 0.5, y1: 0, x2: 0, y2: 1 });
    gradient.append(
      element('stop', { offset: 0, style: `stop-color: color-mix(in srgb, ${from} 60%, white)` }),
      element('stop', { offset: map(i, 0, options.waves, 0.1, 1), style: `stop-color: ${to}` }),
    );
    defs.append(gradient);
    svg.append(element('path', { d, fill: `url(#${id}-${i})` }));
  }
  tile.replaceChildren(svg);
}
