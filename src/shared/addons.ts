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

export { addonsPublic, isAddonPath } from './visibility';

export type AddonSlug = keyof typeof addons;
export const addonSlugs = Object.keys(addons) as AddonSlug[];
export const isAddon = (slug: string): slug is AddonSlug => Object.hasOwn(addons, slug);
export const playgroundHref = (slug: string): string => `/${isAddon(slug) ? 'addons' : 'components'}/${slug}/`;
/** The page with the playground itself: a component's Playground tab, or an add-on's page. */
export const componentPlaygroundHref = (slug: string): string => isAddon(slug) ? playgroundHref(slug) : `/components/${slug}/playground/`;
