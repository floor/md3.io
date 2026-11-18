// Vue: material/vue wraps the same elements; v-model binds their live state.
import { defineComponent, ref } from "vue";
import { MBottomSheet, MButton, MButtonGroup, MButtonGroupItem, MCard, MChip, MChips, MDialog, MExtendedFab, MIconButton, MSearch, MSnackbar, MTextField } from "material/vue";
import { DEFAULTS, LABELS, ADD_ICON, DELETE_ICON, GRID_ICON, LIST_ICON, PIN_ICON, labelOf, status, visible, type LabelId, type Note, type State } from "./shared";

export default defineComponent({
  components: { MBottomSheet, MButton, MButtonGroup, MButtonGroupItem, MCard, MChip, MChips, MDialog, MExtendedFab, MIconButton, MSearch, MSnackbar, MTextField },
  setup() {
    const s = ref<State>({ ...DEFAULTS, notes: DEFAULTS.notes.map((n) => ({ ...n, labels: [...n.labels] })) });
    const draft = ref<{ note: Note | null; title: string; text: string; labels: LabelId[] } | null>(null);
    const snackbar = ref<{ element?: { show: () => void } } | null>(null);
    let deleted: { note: Note; at: number } | null = null;
    const narrow = matchMedia("(max-width: 600px)").matches;

    const open = (note: Note | null) =>
      (draft.value = note
        ? { note, title: note.title, text: note.text, labels: [...note.labels] }
        : { note: null, title: "", text: "", labels: [] });
    const save = () => {
      const d = draft.value;
      if (!d) return;
      if (d.note) {
        d.note.title = d.title;
        d.note.text = d.text;
        d.note.labels = [...d.labels];
        s.value = { ...s.value };
      } else {
        s.value = { ...s.value, notes: [...s.value.notes, { id: crypto.randomUUID(), title: d.title, text: d.text, labels: [...d.labels], pinned: false }] };
      }
      draft.value = null;
    };
    const remove = (note: Note) => {
      deleted = { note, at: s.value.notes.indexOf(note) };
      s.value = { ...s.value, notes: s.value.notes.filter((n) => n !== note) };
      draft.value = null;
      snackbar.value?.element?.show();
    };
    const undo = () => {
      if (!deleted) return;
      const { note, at } = deleted;
      deleted = null;
      s.value = { ...s.value, notes: [...s.value.notes.slice(0, at), note, ...s.value.notes.slice(at)] };
    };
    const setFilter = (value: string[]) => (s.value = { ...s.value, filter: value as LabelId[] });
    const pin = (note: Note) => (s.value = { ...s.value, notes: s.value.notes.map((n) => (n === note ? { ...n, pinned: !n.pinned } : n)) });

    const pinnedNotes = () => visible(s.value).filter((n) => n.pinned);
    const otherNotes = () => visible(s.value).filter((n) => !n.pinned);

    return { s, draft, snackbar, narrow, LABELS, ADD_ICON, DELETE_ICON, GRID_ICON, LIST_ICON, PIN_ICON, labelOf, status, pinnedNotes, otherNotes, open, save, remove, undo, setFilter, pin };
  },
  template: `
    <section class="notes">
      <div class="notes__bar">
        <MSearch placeholder="Search notes" @input="s = { ...s, query: $event.detail.value }" />
        <MButtonGroup kind="connected" selection="single" required :value="s.view" @change="s = { ...s, view: $event.detail.value === 'list' ? 'list' : 'grid' }">
          <MButtonGroupItem :icon="GRID_ICON" value="grid" ariaLabel="Grid view" />
          <MButtonGroupItem :icon="LIST_ICON" value="list" ariaLabel="List view" />
        </MButtonGroup>
      </div>
      <MChips :value="s.filter.join(',')" @change="setFilter($event.detail.value)">
        <MChip v-for="l in LABELS" :key="l.value" :label="l.text" :value="l.value" />
      </MChips>
      <output class="notes__status" role="status">{{ status(s) }}</output>
      <section v-if="pinnedNotes().length > 0" class="notes__section">
        <h2>Pinned</h2>
        <div :class="'notes__grid ' + s.view">
          <MCard v-for="note in pinnedNotes()" :key="note.id" :headline="note.title">
            <MIconButton slot="header-action" toggle :selected="note.pinned" :icon="PIN_ICON" :aria-label="(note.pinned ? 'Unpin ' : 'Pin ') + note.title" @change="pin(note)" />
            <p>{{ note.text }}</p>
            <MChips v-if="note.labels.length > 0" :value="s.filter.join(',')" @change="setFilter($event.detail.value)">
              <MChip v-for="id in note.labels" :key="id" :label="labelOf(id)" :value="id" />
            </MChips>
            <div slot="actions" class="notes__card-actions">
              <MButton variant="text" :aria-label="'Open ' + note.title" @click="open(note)">Open</MButton>
              <MIconButton :icon="DELETE_ICON" :aria-label="'Delete ' + note.title" @click="remove(note)" />
            </div>
          </MCard>
        </div>
      </section>
      <section class="notes__section">
        <h2>Notes</h2>
        <div v-if="otherNotes().length > 0" :class="'notes__grid ' + s.view">
          <MCard v-for="note in otherNotes()" :key="note.id" :headline="note.title">
            <MIconButton slot="header-action" toggle :selected="note.pinned" :icon="PIN_ICON" :aria-label="(note.pinned ? 'Unpin ' : 'Pin ') + note.title" @change="pin(note)" />
            <p>{{ note.text }}</p>
            <MChips v-if="note.labels.length > 0" :value="s.filter.join(',')" @change="setFilter($event.detail.value)">
              <MChip v-for="id in note.labels" :key="id" :label="labelOf(id)" :value="id" />
            </MChips>
            <div slot="actions" class="notes__card-actions">
              <MButton variant="text" :aria-label="'Open ' + note.title" @click="open(note)">Open</MButton>
              <MIconButton :icon="DELETE_ICON" :aria-label="'Delete ' + note.title" @click="remove(note)" />
            </div>
          </MCard>
        </div>
        <p v-else class="notes__empty">No notes match.</p>
      </section>
      <MExtendedFab :icon="ADD_ICON" text="New note" ariaLabel="New note" @click="open(null)" />
      <MDialog v-if="!narrow" :open="draft !== null" :headline="draft && draft.note ? 'Edit note' : 'New note'" @close="draft = null">
        <div class="notes__fields">
          <MTextField label="Title" :value="draft ? draft.title : ''" @input="draft && (draft = { ...draft, title: $event.detail.value })" />
          <MTextField label="Note" type="multiline" :value="draft ? draft.text : ''" @input="draft && (draft = { ...draft, text: $event.detail.value })" />
          <MChips :value="draft ? draft.labels.join(',') : ''" @change="draft && (draft = { ...draft, labels: $event.detail.value })">
            <MChip v-for="l in LABELS" :key="l.value" :label="l.text" :value="l.value" />
          </MChips>
        </div>
        <div slot="actions" class="notes__editor-actions">
          <MButton variant="outlined" @click="draft && draft.note && remove(draft.note)">Delete</MButton>
          <MButton variant="text" @click="draft = null">Cancel</MButton>
          <MButton @click="save()">Save</MButton>
        </div>
      </MDialog>
      <MBottomSheet v-else :open="draft !== null" :title="draft && draft.note ? 'Edit note' : 'New note'" @close="draft = null">
        <div class="notes__fields">
          <MTextField label="Title" :value="draft ? draft.title : ''" @input="draft && (draft = { ...draft, title: $event.detail.value })" />
          <MTextField label="Note" type="multiline" :value="draft ? draft.text : ''" @input="draft && (draft = { ...draft, text: $event.detail.value })" />
          <MChips :value="draft ? draft.labels.join(',') : ''" @change="draft && (draft = { ...draft, labels: $event.detail.value })">
            <MChip v-for="l in LABELS" :key="l.value" :label="l.text" :value="l.value" />
          </MChips>
        </div>
        <div class="notes__editor-actions">
          <MButton variant="outlined" @click="draft && draft.note && remove(draft.note)">Delete</MButton>
          <MButton variant="text" @click="draft = null">Cancel</MButton>
          <MButton @click="save()">Save</MButton>
        </div>
      </MBottomSheet>
      <MSnackbar ref="snackbar" message="Note deleted" action="Undo" duration="4000" dismissible @action="undo" />
    </section>`,
});
