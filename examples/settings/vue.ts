// Vue: mtrl/vue wraps the same elements; v-model binds their live state.
import { defineComponent, reactive, ref } from "vue";
import { MButton, MSwitch, MTab, MTabs } from "material/vue";
import { DEFAULTS, summary } from "./shared";

export default defineComponent({
  components: { MButton, MSwitch, MTab, MTabs },
  setup() {
    const s = reactive({ ...DEFAULTS });
    const status = ref("");
    const save = () => (status.value = summary(s));
    const reset = () => {
      Object.assign(s, { ...DEFAULTS, tab: s.tab });
      status.value = "Reset to the defaults.";
    };
    return { s, status, save, reset };
  },
  template: `
    <section class="settings">
      <MTabs v-model="s.tab">
        <MTab value="connectivity">Connectivity</MTab>
        <MTab value="notifications">Notifications</MTab>
      </MTabs>
      <div class="settings__panel" :hidden="s.tab !== 'connectivity'">
        <MSwitch v-model="s.wifi" :disabled="s.airplane">Wi-Fi</MSwitch>
        <MSwitch v-model="s.bluetooth" :disabled="s.airplane">Bluetooth</MSwitch>
        <MSwitch v-model="s.airplane" supporting-text="Turns off Wi-Fi and Bluetooth">Airplane mode</MSwitch>
      </div>
      <div class="settings__panel" :hidden="s.tab !== 'notifications'">
        <MSwitch v-model="s.notifications">Allow notifications</MSwitch>
        <MSwitch v-model="s.sounds">Sounds</MSwitch>
      </div>
      <footer class="settings__actions">
        <MButton variant="outlined" @click="reset">Reset</MButton>
        <MButton @click="save">Save</MButton>
      </footer>
      <output class="settings__status" role="status">{{ status }}</output>
    </section>`,
});
