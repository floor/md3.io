import type { ExampleMeta } from "../types";

export default {
  slug: "settings",
  title: "Settings",
  description: "A device settings app with grouped rows, immediate preferences and a Wi-Fi sub-screen, in every framework.",
  components: ["app-bar", "icon-button", "avatar", "button", "list", "switch", "progress", "dialog", "text-field", "snackbar"],
  tags: ["Apps", "Forms"],
  about: [
    "A device settings app with an account, grouped preferences, storage and version information. Open Wi-Fi to choose a saved network or add a new one, then return with Back.",
    "Every framework runs the same screen and state rules. The account avatar comes from material-addons 3.2.0. All names, networks and device details are invented.",
  ],
  how: [
    "Preferences apply immediately. Airplane mode turns Wi-Fi and Bluetooth off; turning it off leaves those connections off until you enable them again. Disabling notifications also disables the sound control.",
    "List activation opens the Wi-Fi sub-screen or a detail dialog. The search action filters settings by label, section and supporting text. A snackbar confirms airplane mode and network connections.",
  ],
} satisfies ExampleMeta;
