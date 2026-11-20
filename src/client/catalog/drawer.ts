// The card has its own tag so the site's section drawer doesn't upgrade it early.
import 'material/elements/css/drawer';
import { defineDrawer } from 'material/elements';

export const define = (): void => { defineDrawer({ prefix: 'md3-catalog' }); };
export const defineSiteDrawer = (): void => { defineDrawer(); };
