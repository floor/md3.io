// Material 3's corner radius scale, as a reference beside mtrl's own values: the
// Styles › Shape page shows the M3 steps in this order, takes each value from mtrl's
// CSS where mtrl has the step, and marks the ones it lacks. Values in dp (= CSS px).
// Sources: m3.material.io/styles/shape/corner-radius-scale, and Compose Material 3
// ShapeDefaults (CornerNone … CornerExtraExtraLarge, CornerFull), with M3 Expressive's
// large-increased, extra-large-increased and extra-extra-large.

export interface M3CornerStep {
  /** The step's name, as mtrl's token names it: --mtrl-sys-shape-corner-<step>. */
  step: string;
  /** M3's radius in dp; null for full, which is half the component's shorter side. */
  dp: number | null;
}

export const M3_CORNER_SCALE: readonly M3CornerStep[] = [
  { step: 'none', dp: 0 },
  { step: 'extra-small', dp: 4 },
  { step: 'small', dp: 8 },
  { step: 'medium', dp: 12 },
  { step: 'large', dp: 16 },
  { step: 'large-increased', dp: 20 },
  { step: 'extra-large', dp: 28 },
  { step: 'extra-large-increased', dp: 32 },
  { step: 'extra-extra-large', dp: 48 },
  { step: 'full', dp: null },
];

/** How many shapes the M3 Expressive shape library defines (MaterialShapes). */
export const M3_SHAPE_COUNT = 35;
