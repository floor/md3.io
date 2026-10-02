// The Material Symbols this app uses, as the site's icons/ folder has them. The five
// symbols a settings app would pick first (wifi, notifications, lock, arrow_back,
// chevron_right) are not in the folder yet — adding them means touching icons/ and
// scripts/icons.ts, which waits for the answer on the structural question — so these
// are stand-ins from what is already fetched.
import accountCircle from "../../icons/account_circle.svg" with { type: "text" };
import brightness5 from "../../icons/brightness_5.svg" with { type: "text" };
import brightness6 from "../../icons/brightness_6.svg" with { type: "text" };
import brightness7 from "../../icons/brightness_7.svg" with { type: "text" };
import inbox from "../../icons/inbox.svg" with { type: "text" };
import share from "../../icons/share.svg" with { type: "text" };
import volumeOff from "../../icons/volume_off.svg" with { type: "text" };
import volumeUp from "../../icons/volume_up.svg" with { type: "text" };

const trim = (svg: string): string => svg.trim();

export const ICONS = {
  accountCircle: trim(accountCircle),
  brightness5: trim(brightness5),
  brightness6: trim(brightness6),
  brightness7: trim(brightness7),
  inbox: trim(inbox),
  share: trim(share),
  volumeOff: trim(volumeOff),
  volumeUp: trim(volumeUp),
};

export type IconName = keyof typeof ICONS;
