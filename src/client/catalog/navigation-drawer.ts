// The renamed catalog card uses the existing drawer definition.
// Shell imports keep using ./drawer and its defineSiteDrawer unchanged. In a component's At a
// glance screen, choosing a destination shows its list (glance.ts).
import { define as defineDrawerCard } from './drawer';
import { glanceLists } from './glance';

export const define = (visual?: Element): void | (() => void) => { defineDrawerCard(); return glanceLists(visual); };
