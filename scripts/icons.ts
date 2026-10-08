// Fetch the official Material Symbols used by the examples into icons/.
// `bun run icons` after adding a name below; the SVGs are committed, so the site never
// fetches at build time. Source: the Google Fonts icon CDN (Apache 2.0), the same files
// fonts.google.com/icons downloads.
import { mkdir, readdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';

// Symbol names exactly as fonts.google.com/icons spells them.
const names = [
  'account_circle',
  'add',
  'bookmark',
  'check',
  'close',
  'download',
  'edit',
  'favorite',
  'format_bold',
  'format_italic',
  'format_underlined',
  'inbox',
  'menu',
  'send',
  'volume_off',
  'volume_up',
  // The carousel remote control (the catalog's playground).
  'chevron_left',
  'chevron_right',
  'first_page',
  'last_page',
  // The device chooser (src/client/device-frame.ts).
  'desktop_windows',
  'screen_rotation',
  'smartphone',
  'tablet',
  // The Themes app's bar (src/client/theme-app/).
  'brightness_5',
  'brightness_6',
  'brightness_7',
  'content_copy',
  'image',
  'share',
  // The text field's playground (src/shared/content/text-field.ts).
  'error',
  'mail',
  'search',
  'visibility',
  'visibility_off',
  // The chips playground's named sets (src/shared/content/chips.ts).
  'add_a_photo',
  'restaurant',
  // The toolbar playground's action sets (src/shared/content/toolbar.ts).
  'archive',
  'arrow_back',
  'arrow_forward',
  'call_end',
  'delete',
  'format_color_fill',
  'format_color_text',
  'front_hand',
  'mark_email_unread',
  'mic',
  'redo',
  'snooze',
  'star',
  'tab',
  'undo',
  'videocam_off',
  // The navigation playground's named sets (rail, drawer, tabs, menu).
  'alarm',
  'bar_chart',
  'bedtime',
  'content_cut',
  'content_paste',
  'explore',
  'flight',
  'folder',
  'folder_open',
  'hourglass_bottom',
  'luggage',
  'music_note',
  'open_in_new',
  'outbox',
  'photo_library',
  'save',
  'schedule',
  'timer',
  'videocam',
  // The navigation bar's figures (src/shared/content/navigation-bar.ts).
  'chat_bubble',
  'groups',
  'home',
  'video_camera_front',
  // The bottom sheet playground's named sets (src/shared/content/bottom-sheet.ts).
  'album',
  'cloud',
  'near_me',
  'pause',
  'person_search',
  'playlist_add',
  'playlist_play',
  'skip_next',
  // The actions playground (icon button, split button, extended FAB, FAB menu).
  'arrow_upward',
  'calendar_today',
  'chat',
  'folder_shared',
  'forest',
  'landscape',
  'library_music',
  'person',
  'pets',
  'play_circle',
  'radio',
  'shopping_cart',
  'stop',
  // The tooltip's present-now scenario (src/shared/content/tooltip.ts).
  'present_to_all',
  // The Files drawer (src/shared/content/drawer.ts): A in a square, and a page of lines.
  'font_download',
  'article',
  // The bottom app bar's notes figure (src/shared/content/bottom-app-bar.ts): a checkbox and a brush.
  'check_box',
  'brush',
];
// Rounded, weight 400, grade 0, optical size 24: the Google Fonts defaults for the
// Rounded style. Each symbol comes outlined (`name.svg`) and filled (`name-fill.svg`),
// the second for selected states.
const style = 'materialsymbolsrounded';
const variants = { '': 'default', '-fill': 'fill1' } as const;

const outdir = resolve(import.meta.dir, '../icons');
await mkdir(outdir, { recursive: true });

// The CDN serves `<svg xmlns height width viewBox>`; give every icon the same root so it
// takes the text colour and stays out of the accessibility tree.
const normalize = (svg: string) => svg.trim().replace(/^<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true">');

const wanted = new Set<string>();
await Promise.all(names.flatMap(name => Object.entries(variants).map(async ([suffix, variant]) => {
  const url = `https://fonts.gstatic.com/s/i/short-term/release/${style}/${name}/${variant}/24px.svg`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${name} (${variant}): ${response.status} from ${url}`);
  const file = `${name}${suffix}.svg`;
  wanted.add(file);
  await Bun.write(resolve(outdir, file), normalize(await response.text()) + '\n');
})));

for (const file of await readdir(outdir)) {
  if (file.endsWith('.svg') && !wanted.has(file)) await unlink(resolve(outdir, file));
}
console.log(`Fetched ${wanted.size} Material Symbols into icons/.`);
