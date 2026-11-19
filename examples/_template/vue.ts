// Vue: material/vue wraps the same elements; v-model binds their live state.
import { defineComponent, reactive, ref } from "vue";
import { MButton, MCard, MSwitch } from "material/vue";
import { DEFAULTS, summary } from "./shared";

export default defineComponent({
  components: { MButton, MCard, MSwitch },
  setup() {
    const s = reactive({ ...DEFAULTS });
    const status = ref("");
    const save = () => (status.value = summary(s));
    return { s, status, save };
  },
  template: `
    <section class="notify">
      <MCard headline="Notifications">
        <p>Get a message when a save finishes.</p>
        <MSwitch v-model="s.notify" class="notify__switch">Notify me</MSwitch>
        <MButton slot="actions" @click="save">Save</MButton>
      </MCard>
      <output class="notify__status" role="status">{{ status }}</output>
    </section>`,
});
