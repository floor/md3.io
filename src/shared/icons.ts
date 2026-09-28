// The official Material Symbols (Rounded) the examples use, from icons/ — see
// scripts/icons.ts. Keys are the names the playground state already stores; values are
// the symbol each one shows.
import accountCircle from '../../icons/account_circle-fill.svg' with { type: 'text' };
import add from '../../icons/add.svg' with { type: 'text' };
import bookmark from '../../icons/bookmark.svg' with { type: 'text' };
import check from '../../icons/check.svg' with { type: 'text' };
import close from '../../icons/close.svg' with { type: 'text' };
import download from '../../icons/download.svg' with { type: 'text' };
import edit from '../../icons/edit.svg' with { type: 'text' };
import favorite from '../../icons/favorite.svg' with { type: 'text' };
import formatBold from '../../icons/format_bold.svg' with { type: 'text' };
import formatItalic from '../../icons/format_italic.svg' with { type: 'text' };
import formatUnderlined from '../../icons/format_underlined.svg' with { type: 'text' };
import inbox from '../../icons/inbox.svg' with { type: 'text' };
import menu from '../../icons/menu.svg' with { type: 'text' };
import send from '../../icons/send.svg' with { type: 'text' };
import volumeOff from '../../icons/volume_off.svg' with { type: 'text' };
import volumeUp from '../../icons/volume_up.svg' with { type: 'text' };

const trim = (svg: string) => svg.trim();
export const symbols = {
  accountCircle: trim(accountCircle), add: trim(add), bookmark: trim(bookmark), check: trim(check), close: trim(close), download: trim(download), edit: trim(edit), heart: trim(favorite),
  bold: trim(formatBold), italic: trim(formatItalic), underline: trim(formatUnderlined),
  inbox: trim(inbox), menu: trim(menu), send: trim(send), volumeOff: trim(volumeOff), volumeUp: trim(volumeUp),
};
