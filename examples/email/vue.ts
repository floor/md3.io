// Vue: material/vue wraps the same elements; a reactive state mirrors the shared one.
import { computed, defineComponent, reactive, ref } from "vue";
import {
  MButton, MCheckbox, MChip, MChips, MDialog, MExtendedFab, MIconButton,
  MNavigationRail, MNavigationRailItem, MSearch, MSnackbar, MTextField,
} from "material/vue";
import {
  ARCHIVE_LABEL, BACK_LABEL, CHIPS_LABEL, CLEAR_LABEL, COMPOSE_HEADLINE, DELETE_LABEL, EMPTY_DETAIL,
  FOLDERS, LABELS, RAIL_LABEL, ROWS_LABEL, SEARCH_PLACEHOLDER, SENT_TEXT, STAR_LABEL,
  archiveChecked, archiveOpen, badgeFor, canSend, clearChecked, closeCompose, deleteChecked, deleteOpen,
  emptyText, findMessage, goBack, icons, initialState, mailbox, openCompose, openMessage,
  replyToOpen, selectLabel, selectionText, sendDraft, setFolder, setLabel, setQuery, toggleChecked,
  toggleStar, visibleMessages,
  type FolderId, type MailState, type Message,
} from "./shared";

const messages = mailbox();

export default defineComponent({
  components: {
    MButton, MCheckbox, MChip, MChips, MDialog, MExtendedFab, MIconButton,
    MNavigationRail, MNavigationRailItem, MSearch, MSnackbar, MTextField,
  },
  setup() {
    const s = reactive<MailState>(initialState());
    const dialog = ref<{ element: HTMLElement & { show(): void; close(): void } } | null>(null);
    const snackbar = ref<{ element: HTMLElement & { show(): void } } | null>(null);

    // Mutations (star, archive, delete, send) change the mailbox; tick re-reads it.
    const tick = ref(0);
    const update = (fn: () => void) => {
      fn();
      tick.value++;
    };
    const showDialog = (fn: () => void) => {
      fn();
      dialog.value?.element.show();
    };
    const open = computed(() => (tick.value, findMessage(messages, s.open)));
    const visible = computed(() => (tick.value, visibleMessages(messages, s)));
    const sendDisabled = computed(() => !canSend(s.draft));

    return {
      s, dialog, snackbar, open, visible, sendDisabled, update, showDialog,
      messages, FOLDERS, LABELS, icons,
      RAIL_LABEL, CHIPS_LABEL, ROWS_LABEL, SEARCH_PLACEHOLDER, SENT_TEXT, STAR_LABEL,
      ARCHIVE_LABEL, BACK_LABEL, CLEAR_LABEL, COMPOSE_HEADLINE, DELETE_LABEL, EMPTY_DETAIL,
      badgeFor, emptyText, selectLabel, selectionText,
      onRail: (e: CustomEvent<{ value: string }>) => setFolder(s, e.detail.value as FolderId),
      onQuery: (e: CustomEvent<{ value: string }>) => setQuery(s, e.detail.value),
      onLabel: (e: CustomEvent<{ value: string | null }>) => setLabel(s, e.detail.value ?? null),
      check: (m: Message) => toggleChecked(s, m.id),
      openRow: (m: Message) => update(() => openMessage(s, messages, m.id)),
      star: (m: Message) => update(() => toggleStar(messages, m.id)),
      back: () => goBack(s),
      clear: () => clearChecked(s),
      archiveSelection: () => update(() => archiveChecked(s, messages)),
      deleteSelection: () => update(() => deleteChecked(s, messages)),
      reply: () => showDialog(() => replyToOpen(s, messages)),
      archiveOpenMessage: () => update(() => archiveOpen(s, messages)),
      deleteOpenMessage: () => update(() => deleteOpen(s, messages)),
      compose: () => showDialog(() => openCompose(s)),
      cancelCompose: () => {
        closeCompose(s);
        dialog.value?.element.close();
      },
      closeCompose: () => closeCompose(s),
      send: () => update(() => {
        sendDraft(s, messages);
        dialog.value?.element.close();
        snackbar.value?.element.show();
      }),
    };
  },
  template: `
    <section class="mail" :data-reading="String(s.reading)">
      <MNavigationRail :aria-label="RAIL_LABEL" :value="s.folder" @change="onRail">
        <MNavigationRailItem v-for="f in FOLDERS" :key="f.id" :value="f.id" :label="f.label" :icon="f.icon"
          :selected-icon="f.activeIcon" :badge="badgeFor(messages, f.id)?.badge" :badge-label="badgeFor(messages, f.id)?.label" />
      </MNavigationRail>
      <div class="mail__main">
        <div class="mail__list-pane">
          <header class="mail__top">
            <MSearch :placeholder="SEARCH_PLACEHOLDER" no-expand-on-focus full-width @input="onQuery" />
            <MChips :aria-label="CHIPS_LABEL" selection="single" @change="onLabel">
              <MChip v-for="l in LABELS" :key="l.id" :value="l.id" :label="l.label" />
            </MChips>
          </header>
          <div class="mail__selection">
            <template v-if="s.checked.length">
              <MIconButton :icon="icons.close" :aria-label="CLEAR_LABEL" @click="clear" />
              <span class="mail__selection-count">{{ selectionText(s.checked.length) }}</span>
              <MIconButton :icon="icons.archive" :aria-label="ARCHIVE_LABEL" @click="archiveSelection" />
              <MIconButton :icon="icons.delete" :aria-label="DELETE_LABEL" @click="deleteSelection" />
            </template>
          </div>
          <ul class="mail__rows" :aria-label="ROWS_LABEL">
            <li v-if="!visible.length" class="mail__empty">{{ emptyText(s) }}</li>
            <li v-for="m in visible" :key="m.id" class="mail-row" :data-id="m.id"
              :data-unread="m.unread || undefined" :data-open="s.open === m.id || undefined">
              <MCheckbox class="mail-row__check" :aria-label="selectLabel(m)" :checked="s.checked.includes(m.id)" @change="check(m)" />
              <button type="button" class="mail-row__open" :aria-pressed="s.open === m.id" @click="openRow(m)">
                <span class="mail-row__sender">{{ m.from }}</span>
                <span class="mail-row__subject">{{ m.subject }}</span>
                <span class="mail-row__snippet">{{ m.snippet }}</span>
                <span class="mail-row__time">{{ m.time }}</span>
              </button>
              <MIconButton class="mail-row__star" toggle :icon="icons.star" :selected-icon="icons.starFill"
                :selected="m.starred" :aria-label="STAR_LABEL" @change="star(m)" />
            </li>
          </ul>
        </div>
        <div class="mail__detail-pane">
          <div v-if="!open" class="mail__placeholder">{{ EMPTY_DETAIL }}</div>
          <article v-else class="mail-message">
            <header class="mail-message__head">
              <MIconButton class="mail-message__back" :icon="icons.back" :aria-label="BACK_LABEL" @click="back" />
              <h2 class="mail-message__subject">{{ open.subject }}</h2>
            </header>
            <p class="mail-message__meta">{{ open.from }} · {{ open.address }}</p>
            <p class="mail-message__date">{{ open.date }}</p>
            <div class="mail-message__body"><p v-for="(p, i) in open.body" :key="i">{{ p }}</p></div>
            <footer class="mail-message__actions">
              <MButton variant="outlined" :icon="icons.reply" @click="reply">Reply</MButton>
              <MButton variant="outlined" :icon="icons.archive" @click="archiveOpenMessage">{{ ARCHIVE_LABEL }}</MButton>
              <MButton variant="outlined" :icon="icons.delete" @click="deleteOpenMessage">{{ DELETE_LABEL }}</MButton>
            </footer>
          </article>
        </div>
      </div>
      <MExtendedFab class="mail__compose" :icon="icons.edit" @click="compose">Compose</MExtendedFab>
      <MDialog ref="dialog" class="mail-compose" :headline="COMPOSE_HEADLINE" @close="closeCompose">
        <div class="mail-compose__fields">
          <MTextField v-model="s.draft.to" label="To" variant="outlined" />
          <MTextField v-model="s.draft.subject" label="Subject" variant="outlined" />
          <MTextField v-model="s.draft.message" label="Message" variant="outlined" type="multiline" />
        </div>
        <template #actions>
          <MButton variant="text" @click="cancelCompose">Cancel</MButton>
          <MButton :disabled="sendDisabled" @click="send">Send</MButton>
        </template>
      </MDialog>
      <MSnackbar ref="snackbar" :message="SENT_TEXT" />
    </section>`,
});
