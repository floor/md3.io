// The components check-tabs runs, shared with the batch runner so the filter lives in one place.
import { componentSlugs, components } from '../src/shared/components';

export function eligibleTabComponents() {
  return componentSlugs.filter(slug => components[slug].scenarios && components[slug].scenarios.length > 0);
}
