// The components the Shape page's gallery renders under each corner step: a few real
// mtrl components per step, at rest. Each pairing is checked against mtrl's compiled
// CSS (test/styles.test.ts): the component's stylesheet reads that step's token.

export interface GalleryItem {
  /** The mtrl stylesheet (dist/styles/<component>.css) that reads the step. */
  component: string;
  label: string;
}

export const SHAPE_GALLERY: readonly { step: string; items: readonly GalleryItem[] }[] = [
  { step: 'extra-small', items: [{ component: 'textfield', label: 'Text field' }] },
  { step: 'small', items: [{ component: 'chips', label: 'Chips' }] },
  { step: 'medium', items: [{ component: 'card', label: 'Card' }, { component: 'button', label: 'Square button' }] },
  { step: 'large', items: [{ component: 'fab', label: 'FAB' }] },
  { step: 'large-increased', items: [{ component: 'fab', label: 'Medium FAB' }] },
  { step: 'extra-large', items: [{ component: 'fab', label: 'Large FAB' }, { component: 'dialog', label: 'Dialog' }] },
  { step: 'full', items: [{ component: 'switch', label: 'Switch' }, { component: 'slider', label: 'Slider' }] },
];
