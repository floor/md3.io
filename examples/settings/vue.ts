// Vue: reactive state and the generated Material adapters.
import { computed, defineComponent, ref } from "vue";
import type { SnackbarElement } from "material/elements";
import { MButton, MDialog, MIconButton, MList, MListItem, MProgress, MSnackbar, MSwitch, MTextField, MTopAppBar } from "material/vue";
import { MAvatar } from "material-addons/vue";
import { DEFAULTS, ICONS, activate, announces, dialog, groups, isNetwork, reduce, wifiRow, type Action } from "./shared";

export default defineComponent({
  components: { MAvatar, MButton, MDialog, MIconButton, MList, MListItem, MProgress, MSnackbar, MSwitch, MTextField, MTopAppBar },
  setup() {
    const s = ref({ ...DEFAULTS });
    const snackbar = ref<SnackbarElement | null>(null);
    const send = (a: Action) => {
      s.value = reduce(s.value, a);
      if (announces(a)) requestAnimationFrame(() => snackbar.value?.show());
    };
    return { s, snackbar, send, ICONS, activate, isNetwork, details: computed(() => dialog(s.value)), shown: computed(() => groups(s.value)), wifi: computed(() => wifiRow(s.value)) };
  },
  template: `
    <section class="settings">
      <MTopAppBar :headline="s.screen === 'wifi' ? 'Wi-Fi' : 'Settings'" type="small" no-scroll>
        <MIconButton v-if="s.screen === 'wifi'" slot="leading" :icon="ICONS.back" aria-label="Back" @click="send({ type: 'back' })" />
        <MIconButton slot="trailing" :icon="ICONS.search" aria-label="Search settings" @click="send({ type: 'search' })" />
        <MIconButton class="settings__mobile" slot="trailing" :icon="ICONS.more" aria-label="Device information" @click="send({ type: 'row', id: 'version' })" />
      </MTopAppBar>
      <div class="settings__content">
        <div v-if="s.searching" class="settings__search"><MTextField label="Search settings" type="search" :value="s.query" @input="send({ type: 'query', value: $event.detail.value })" /></div>
        <div v-if="s.screen === 'home'" class="settings__grid">
          <section v-for="g in shown" :key="g.title" class="settings__group" :aria-label="g.title">
            <MList selection="none"><MListItem kind="subheader" :headline="g.title" /></MList>
            <div v-for="r in g.rows" :key="r.id">
              <div class="settings__row" :class="{ 'settings__row--toggle': r.toggle, 'settings__row--account': r.account }">
                <MAvatar v-if="r.account" variant="text" size="medium" text="MV" decorative />
                <MList selection="single" @activate="activate($event, () => send(r.toggle ? { type: 'toggle', key: r.toggle, checked: !s[r.toggle] } : { type: 'row', id: r.id }))">
                  <MListItem :value="r.id" :headline="r.label" :supporting-text="r.supporting" :leading-icon="r.icon || undefined" :trailing-icon="r.toggle ? undefined : ICONS.chevron" :disabled="r.disabled" />
                </MList>
                <MSwitch v-if="r.toggle" :aria-label="r.label" :checked="s[r.toggle]" :disabled="r.disabled" @change="send({ type: 'toggle', key: r.toggle, checked: $event.detail.checked })" />
              </div>
              <div v-if="r.storage" class="settings__storage"><MProgress variant="linear" :value="38" :max="128" aria-label="Storage used" /></div>
            </div>
          </section>
          <p v-if="!shown.length">No settings found.</p>
        </div>
        <div v-else class="settings__wifi">
          <div><div class="settings__row settings__row--toggle">
            <MList selection="single" @activate="activate($event, () => send({ type: 'toggle', key: 'wifi', checked: !s.wifi }))">
              <MListItem :value="wifi.id" :headline="wifi.label" :supporting-text="wifi.supporting" :leading-icon="wifi.icon" :disabled="wifi.disabled" />
            </MList>
            <MSwitch aria-label="Use Wi-Fi" :checked="s.wifi" :disabled="s.airplane" @change="send({ type: 'toggle', key: 'wifi', checked: $event.detail.checked })" />
          </div></div>
          <MList v-if="s.wifi && !s.airplane" selection="single" aria-label="Nearby networks" @activate="activate($event, () => send({ type: 'row', id: $event.detail.value }))">
            <MListItem kind="subheader" headline="Nearby networks" />
            <MListItem v-for="n in s.networks" :key="n.name" :value="'network:' + n.name" :headline="n.name" :supporting-text="s.connected === n.name ? 'Connected' : n.secure ? 'Saved · Secured' : 'Open network'" :leading-icon="ICONS.wifi" :trailing-icon="s.connected === n.name ? ICONS.check : n.secure ? ICONS.lock : ICONS.chevron" />
            <MListItem value="add-network" headline="Add network" supporting-text="Connect to a hidden or new network" :leading-icon="ICONS.add" :trailing-icon="ICONS.chevron" />
          </MList>
          <p v-else>Turn on Wi-Fi to see nearby networks.</p>
        </div>
      </div>
      <MDialog :open="!!s.dialog" :headline="details.title" @close="send({ type: 'close' })">
        <p>{{ details.text }}</p>
        <div v-if="s.dialog === 'add-network'" class="settings__fields">
          <MTextField label="Network name" :value="s.draftName" @input="send({ type: 'name', value: $event.detail.value })" />
          <MTextField label="Password (optional)" type="password" :value="s.password" @input="send({ type: 'password', value: $event.detail.value })" />
        </div>
        <div slot="actions" class="settings__actions">
          <MButton variant="text" @click="send({ type: 'close' })">{{ isNetwork(s) || s.dialog === 'add-network' ? 'Cancel' : 'Done' }}</MButton>
          <MButton v-if="isNetwork(s) || s.dialog === 'add-network'" :disabled="s.dialog === 'add-network' && !s.draftName.trim()" @click="send({ type: s.dialog === 'add-network' ? 'add' : 'connect' })">Connect</MButton>
        </div>
      </MDialog>
      <MSnackbar :message="s.notice" duration="short" dismissible ref="snackbar" />
    </section>`,
});
