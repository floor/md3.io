// The theme app's UI as a declarative layout for mtrl-addons' createLayout:
// [factory, 'name', { options }, ...children]. Named parts land on `app.ui.<name>`.
// mtrl's own factories for every control; the scheme card and palette strips are the
// app's (scheme-card.ts, palette-strip.ts).
import createTopAppBar from 'mtrl/components/top-app-bar';
import createSelect from 'mtrl/components/select';
import createTextField from 'mtrl/components/textfield';
import createIconButton from 'mtrl/components/icon-button';
import createButtonGroup from 'mtrl/components/button-group';
import { createSchemeCard } from '../scheme-card';
import { createPaletteStrip } from '../palette-strip';
import share from '../../../../icons/share.svg' with { type: 'text' };
import image from '../../../../icons/image.svg' with { type: 'text' };
import download from '../../../../icons/download.svg' with { type: 'text' };
import standard from '../../../../icons/brightness_7.svg' with { type: 'text' };
import medium from '../../../../icons/brightness_6.svg' with { type: 'text' };
import high from '../../../../icons/brightness_5.svg' with { type: 'text' };
import { CONTRASTS, VARIANTS } from '../features/withVariant';

/** The variant select's options: "Original" is a hand-made theme's own colours, hidden for the others. */
const VARIANT_OPTIONS = [{ id: 'original', text: 'Original' }, ...VARIANTS.map(([id, text]) => ({ id, text }))];
const CONTRAST_ICONS = [standard, medium, high];

/** The bar's tooltips, by part (set up by withSetup). */
export const TOOLTIPS: Record<string, string> = {
  image: 'Make a theme from an image. It stays in your browser: nothing is uploaded.',
  download: 'Download this theme: CSS or JSON',
  share: 'Copy a link to this theme',
};
export const PALETTES = [['primary', 'Primary'], ['secondary', 'Secondary'], ['tertiary', 'Tertiary'], ['neutral', 'Neutral'], ['neutralVariant', 'Neutral Variant'], ['error', 'Error']] as const;

export interface LayoutData { themes: { name: string; label: string }[]; roles: string[]; selected: string }

export const layout = ({ themes, roles, selected }: LayoutData): unknown[] => [
  [createTopAppBar, 'bar', { type: 'small', title: 'Themes', scrollable: false }],
  // The bar's actions: moved into its trailing slot by withSetup.
  ['actions', { class: 'theme-app__actions' },
    [createIconButton, 'image', { icon: image, ariaLabel: 'Make a theme from an image (it stays in your browser)', variant: 'standard' }],
    [createIconButton, 'download', { icon: download, ariaLabel: 'Download this theme', variant: 'standard' }],
    [createIconButton, 'share', { icon: share, ariaLabel: 'Copy a link to this theme', variant: 'standard' }],
    ['file', { tag: 'input', class: 'theme-app__file', attributes: { type: 'file', accept: 'image/*', hidden: '', 'aria-hidden': 'true', tabindex: '-1' } }],
  ],
  // The scheme's three axes: the theme (its seed), the variant and the contrast.
  ['controls', { class: 'theme-app__controls' },
    [createSelect, 'theme', { variant: 'outlined', density: 'compact', label: 'Theme', value: selected, options: themes.map(({ name, label }) => ({ id: name, text: label })) }],
    [createSelect, 'variant', { variant: 'outlined', density: 'compact', label: 'Variant', value: 'tonal-spot', options: VARIANT_OPTIONS, supportingText: ' ' }],
    [createButtonGroup, 'contrast', {
      kind: 'connected', selection: 'single', required: true, size: 's', variant: 'outlined', ariaLabel: 'Contrast',
      buttons: CONTRASTS.map(([value, , label], i) => ({ value: String(value), icon: CONTRAST_ICONS[i], ariaLabel: label, selected: value === 0 })),
    }],
    // The downloaded file's name: `custom` until typed; a built-in theme's name is refused.
    // The blank supporting text keeps the row element; its height is reserved in
    // styles/theme-app.css — a whitespace-only helper draws no line box (the variant
    // select needs no such rule: its row always holds the seed line).
    [createTextField, 'name', { variant: 'outlined', density: 'compact', label: 'Theme name', value: 'custom', supportingText: ' ' }],
  ],
  ['content', { tag: 'div', class: 'theme-app__content' },
    [createSchemeCard, 'scheme', { roles }],
    ['palettes', { tag: 'section', class: 'theme-app__palettes' },
      [{ tag: 'h2', class: 'theme-app__heading', text: 'Tonal palettes' }],
      ['paletteNote', { tag: 'p', class: 'theme-app__note' }],
      ['paletteList', { class: 'theme-app__palette-list' },
        ...PALETTES.map(([key, label]) => [createPaletteStrip, `palette-${key}`, { key, label }]),
      ],
    ],
  ],
];
