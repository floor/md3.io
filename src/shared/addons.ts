import { avatarComponent } from './content/avatar';

export const addons = {
  avatar: avatarComponent,
};

export type AddonSlug = keyof typeof addons;
export const addonSlugs = Object.keys(addons) as AddonSlug[];
export const isAddon = (slug: string): slug is AddonSlug => Object.hasOwn(addons, slug);
export const playgroundHref = (slug: string): string => `/${isAddon(slug) ? 'addons' : 'components'}/${slug}/`;
