// The Material Symbols this app uses, as the site's icons/ folder has them. The five
// the settings screens call for (wifi, notifications, lock, arrow_back, chevron_right)
// were fetched with `bun run icons` under the review's approval (2026-10-02).
import arrowBack from "../../icons/arrow_back.svg" with { type: "text" };
import brightness5 from "../../icons/brightness_5.svg" with { type: "text" };
import brightness6 from "../../icons/brightness_6.svg" with { type: "text" };
import brightness7 from "../../icons/brightness_7.svg" with { type: "text" };
import chevronRight from "../../icons/chevron_right.svg" with { type: "text" };
import lock from "../../icons/lock.svg" with { type: "text" };
import notifications from "../../icons/notifications.svg" with { type: "text" };
import volumeOff from "../../icons/volume_off.svg" with { type: "text" };
import volumeUp from "../../icons/volume_up.svg" with { type: "text" };
import wifi from "../../icons/wifi.svg" with { type: "text" };

const trim = (svg: string): string => svg.trim();

export const ICONS = {
  arrowBack: trim(arrowBack),
  brightness5: trim(brightness5),
  brightness6: trim(brightness6),
  brightness7: trim(brightness7),
  chevronRight: trim(chevronRight),
  lock: trim(lock),
  notifications: trim(notifications),
  volumeOff: trim(volumeOff),
  volumeUp: trim(volumeUp),
  wifi: trim(wifi),
};

export type IconName = keyof typeof ICONS;
