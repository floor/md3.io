// The theme app's UI as a declarative layout for mtrl-addons' createLayout:
// [factory, 'name', { options }, ...children]. Named parts land on `app.ui.<name>`.
// mtrl's own factories for every control; the scheme card and palette strips are the
// app's (scheme-card.ts, palette-strip.ts).
import createTopAppBar from 'mtrl/components/top-app-bar';
import createSelect from 'mtrl/components/select';
import createIconButton from 'mtrl/components/icon-button';
import { createSchemeCard } from '../scheme-card';
import { createPaletteStrip } from '../palette-strip';
import share from '../../../../icons/share.svg' with { type: 'text' };
import image from '../../../../icons/image.svg' with { type: 'text' };
import download from '../../../../icons/download.svg' with { type: 'text' };

/** The bar's tooltips, by part (set up by withSetup). */
export const TOOLTIPS: Record<string, string> = {
  image: 'Make a theme from an image. It stays in your browser: nothing is uploaded.',
  download: 'Download this theme: CSS, SCSS or JSON',
  share: 'Copy a link to this theme',
};
export const PALETTES = [['primary', 'Primary'], ['secondary', 'Secondary'], ['tertiary', 'Tertiary'], ['neutral', 'Neutral'], ['neutralVariant', 'Neutral Variant'], ['error', 'Error']] as const;

export interface LayoutData { themes: { name: string; label: string }[]; roles: string[]; selected: string }

export const layout = ({ themes, roles, selected }: LayoutData): unknown[] => [
  [createTopAppBar, 'bar', { type: 'small', title: 'Themes', scrollable: false }],
  // The bar's actions: moved into its trailing slot by withSetup.
  ['actions', { class: 'theme-app__actions' },
    [createSelect, 'theme', { variant: 'outlined', density: 'compact', label: 'Theme', value: selected, options: themes.map(({ name, label }) => ({ id: name, text: label })) }],
    [createIconButton, 'image', { icon: image, ariaLabel: 'Make a theme from an image (it stays in your browser)', variant: 'standard' }],
    [createIconButton, 'download', { icon: download, ariaLabel: 'Download this theme', variant: 'standard' }],
    [createIconButton, 'share', { icon: share, ariaLabel: 'Copy a link to this theme', variant: 'standard' }],
    ['file', { tag: 'input', class: 'theme-app__file', attributes: { type: 'file', accept: 'image/*', hidden: '', 'aria-hidden': 'true', tabindex: '-1' } }],
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
