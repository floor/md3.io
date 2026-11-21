import { autocompleteComponent } from './content/autocomplete';
import { colorpickerComponent } from './content/colorpicker';
import { expansionPanelComponent } from './content/expansion-panel';
import { formComponent } from './content/form';
import { skeletonComponent } from './content/skeleton';
import { stepperComponent } from './content/stepper';
import { avatarComponent } from './content/avatar';

export const addons = {
  autocomplete: autocompleteComponent,
  avatar: avatarComponent,
  colorpicker: colorpickerComponent,
  'expansion-panel': expansionPanelComponent,
  form: formComponent,
  skeleton: skeletonComponent,
  stepper: stepperComponent,
};

/**
 * Whether the Add-ons section is public. While false (the owner's call, 2026-11-21: the
 * components are not finished) nothing links to it: no navigation entry, docs sidebar group,
 * search result, sitemap entry or Showcase link. Its pages still answer for review, marked
 * noindex. Flip to true to publish.
 */
export const addonsPublic = false;
/** A page of the Add-ons section, or one of its reference documents. */
export const isAddonPath = (path: string): boolean => path.startsWith('/addons/') || path.startsWith('/docs/addons/');

export type AddonSlug = keyof typeof addons;
export const addonSlugs = Object.keys(addons) as AddonSlug[];
export const isAddon = (slug: string): slug is AddonSlug => Object.hasOwn(addons, slug);
export const playgroundHref = (slug: string): string => `/${isAddon(slug) ? 'addons' : 'components'}/${slug}/`;
