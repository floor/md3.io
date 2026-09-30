// The M3 Expressive shapes mtrl ships (mtrl/core/shapes, a port of Compose's
// MaterialShapes, which its loading indicator morphs through), as SVG paths. Shared by
// the server, which draws the Shape page's gallery, and the page's morph demo.
import { materialShape, radialProfile, type MaterialShapeName, type RadialProfile } from 'mtrl/core/shapes';

/** Every shape mtrl names, labelled: a Record, so a shape mtrl adds fails the type check until it is listed. */
export const SHAPE_LABELS: Record<MaterialShapeName, string> = {
  circle: 'Circle', oval: 'Oval', pill: 'Pill', pentagon: 'Pentagon', sunny: 'Sunny', cookie4: '4-sided cookie', cookie9: '9-sided cookie', softBurst: 'Soft burst',
};
export const SHAPE_NAMES = Object.keys(SHAPE_LABELS) as MaterialShapeName[];

const round = (value: number) => Math.round(value * 1000) / 10;
/** A shape's outline as an SVG path in a 0–100 box: its cubics, as mtrl builds them. */
export function shapePath(name: MaterialShapeName): string {
  const { cubics } = materialShape(name);
  if (!cubics.length) return '';
  const [x0, y0] = cubics[0]!;
  return `M${round(x0)} ${round(y0)}${cubics.map(c => `C${round(c[2])} ${round(c[3])} ${round(c[4])} ${round(c[5])} ${round(c[6])} ${round(c[7])}`).join('')}Z`;
}

/** The radial profiles the morph interpolates, as the loading indicator does. */
export const shapeProfile = (name: MaterialShapeName, samples = 180): RadialProfile => radialProfile(materialShape(name), samples);

/** A path between two profiles, `t` of the way, fitted to a 0–100 box and turned `rotation` degrees. */
export function morphPath(from: RadialProfile, to: RadialProfile, t: number, rotation = 0): string {
  const samples = from.radii.length;
  const scale = 50 / Math.max(from.maxRadius + (to.maxRadius - from.maxRadius) * t, 1e-6);
  const turn = (rotation / 180) * Math.PI;
  let d = '';
  for (let i = 0; i < samples; i++) {
    const r = (from.radii[i]! + (to.radii[i]! - from.radii[i]!) * t) * scale;
    const a = (i / samples) * Math.PI * 2 + turn;
    d += `${i ? 'L' : 'M'}${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`;
  }
  return `${d}Z`;
}
