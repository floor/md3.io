// The renamed catalog card uses the existing drawer definition.
// Shell imports keep using ./drawer and its defineSiteDrawer unchanged.
import { define as defineDrawerCard } from './drawer';

export const define = (): void => { defineDrawerCard(); };
