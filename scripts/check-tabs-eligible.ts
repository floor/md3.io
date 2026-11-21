// The components check-tabs runs, shared with the batch runner so the filter lives in one place.
import { componentSlugs, components } from '../src/shared/components';
import { addonSlugs } from '../src/shared/addons';

export function eligibleTabComponents() {
  return [...componentSlugs, ...addonSlugs].filter(slug => components[slug].scenarios && components[slug].scenarios.length > 0);
}
