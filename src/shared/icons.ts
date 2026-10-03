// The official Material Symbols (Rounded) the examples use, from icons/ — see
// scripts/icons.ts. Keys are the names the playground state already stores; values are
// the symbol each one shows.
import accountCircle from '../../icons/account_circle-fill.svg' with { type: 'text' };
import add from '../../icons/add.svg' with { type: 'text' };
import bookmark from '../../icons/bookmark.svg' with { type: 'text' };
import check from '../../icons/check.svg' with { type: 'text' };
import chevronLeft from '../../icons/chevron_left.svg' with { type: 'text' };
import chevronRight from '../../icons/chevron_right.svg' with { type: 'text' };
import close from '../../icons/close.svg' with { type: 'text' };
import download from '../../icons/download.svg' with { type: 'text' };
import edit from '../../icons/edit.svg' with { type: 'text' };
import error from '../../icons/error.svg' with { type: 'text' };
import favorite from '../../icons/favorite.svg' with { type: 'text' };
import firstPage from '../../icons/first_page.svg' with { type: 'text' };
import formatBold from '../../icons/format_bold.svg' with { type: 'text' };
import formatItalic from '../../icons/format_italic.svg' with { type: 'text' };
import formatUnderlined from '../../icons/format_underlined.svg' with { type: 'text' };
import inbox from '../../icons/inbox.svg' with { type: 'text' };
import lastPage from '../../icons/last_page.svg' with { type: 'text' };
import mail from '../../icons/mail.svg' with { type: 'text' };
import menu from '../../icons/menu.svg' with { type: 'text' };
import search from '../../icons/search.svg' with { type: 'text' };
import send from '../../icons/send.svg' with { type: 'text' };
import visibility from '../../icons/visibility.svg' with { type: 'text' };
import visibilityOff from '../../icons/visibility_off.svg' with { type: 'text' };
import volumeOff from '../../icons/volume_off.svg' with { type: 'text' };
import volumeUp from '../../icons/volume_up.svg' with { type: 'text' };

const trim = (svg: string) => svg.trim();
export const symbols = {
  accountCircle: trim(accountCircle), add: trim(add), bookmark: trim(bookmark), check: trim(check), close: trim(close), download: trim(download), edit: trim(edit), heart: trim(favorite),
  bold: trim(formatBold), italic: trim(formatItalic), underline: trim(formatUnderlined),
  inbox: trim(inbox), menu: trim(menu), send: trim(send), volumeOff: trim(volumeOff), volumeUp: trim(volumeUp),
  firstPage: trim(firstPage), chevronLeft: trim(chevronLeft), chevronRight: trim(chevronRight), lastPage: trim(lastPage),
  mail: trim(mail), error: trim(error), search: trim(search), visibility: trim(visibility), visibilityOff: trim(visibilityOff),
};

/** Each symbol's file in icons/, named as fonts.google.com/icons names the symbol (`-fill` when filled). */
const files: Record<keyof typeof symbols, string> = {
  accountCircle: 'account_circle-fill', add: 'add', bookmark: 'bookmark', check: 'check', close: 'close', download: 'download', edit: 'edit',
  heart: 'favorite', bold: 'format_bold', italic: 'format_italic', underline: 'format_underlined', inbox: 'inbox', menu: 'menu',
  send: 'send', volumeOff: 'volume_off', volumeUp: 'volume_up',
  firstPage: 'first_page', chevronLeft: 'chevron_left', chevronRight: 'chevron_right', lastPage: 'last_page',
  mail: 'mail', error: 'error', search: 'search', visibility: 'visibility', visibilityOff: 'visibility_off',
};
/** The icons/ file of a symbol's SVG (`edit`), when it is one of ours. */
export const symbolFile = (svg: string): string | undefined => {
  const key = (Object.keys(symbols) as (keyof typeof symbols)[]).find(k => symbols[k] === svg.trim());
  return key && files[key];
};

/** The SVG of an icons/ file name (`favorite`), as the copied code imports it. */
export const symbolByFile = (file: string): string | undefined => {
  const key = (Object.keys(files) as (keyof typeof symbols)[]).find(k => files[k] === file);
  return key && symbols[key];
};
