// Vue: material/vue wraps the same elements; v-model binds their live state.
import { defineComponent, onMounted, onUnmounted, ref } from "vue";
import { MBottomSheet, MButton, MButtonGroup, MButtonGroupItem, MCard, MChip, MChips, MDialog, MDrawer, MDrawerItem, MExtendedFab, MIconButton, MMenu, MMenuItem, MSearch, MSnackbar, MTextField, MTopAppBar } from "material/vue";
import { DEFAULTS, LABELS, ADD_ICON, CLOSE_ICON, GRID_ICON, LIST_ICON, MENU_ICON, MORE_ICON, SEARCH_ICON,
  categoryItems, categoryLabels, editedLabel, emptyLabel, labelOf, nextEdit, noteGroups, noteTitle, observeCompact, status, visible,
  type Category, type LabelId, type Note, type State } from "./shared";

export default defineComponent({
  components: { MBottomSheet, MButton, MButtonGroup, MButtonGroupItem, MCard, MChip, MChips, MDialog, MDrawer, MDrawerItem, MExtendedFab, MIconButton, MMenu, MMenuItem, MSearch, MSnackbar, MTextField, MTopAppBar },
  setup() {
    const s = ref<State>({ ...DEFAULTS, notes: DEFAULTS.notes.map((n) => ({ ...n, labels: [...n.labels] })) });
    const draft = ref<{ note: Note | null; title: string; text: string; labels: LabelId[] } | null>(null);
    const snackbar = ref<{ element?: { show: () => void } } | null>(null);
    let deleted: { note: Note; at: number } | null = null;
    const shell = ref<HTMLElement | null>(null);
    const compact = ref(false);
    const drawerOpen = ref(false);
    const searchOpen = ref(false);
    let resizing = false;
    let stopObserving: (() => void) | undefined;
    onMounted(() => {
      stopObserving = observeCompact(shell.value!, narrow => {
        resizing = true;
        compact.value = narrow;
        drawerOpen.value = false;
        searchOpen.value = false;
        requestAnimationFrame(() => requestAnimationFrame(() => { resizing = false; }));
      });
    });
    onUnmounted(() => stopObserving?.());
    const dismissEditor = () => { if (!resizing) draft.value = null; };
    const closeDrawer = () => {
      if (!compact.value) return;
      drawerOpen.value = false;
      queueMicrotask(() => shell.value?.querySelector<HTMLElement>(".notes__menu")?.focus());
    };
    const chooseCategory = (value: Category) => {
      s.value = { ...s.value, category: value };
      if (compact.value) drawerOpen.value = false;
    };
    const toggleSearch = () => {
      searchOpen.value = !searchOpen.value;
      if (!searchOpen.value) s.value = { ...s.value, query: "" };
      else requestAnimationFrame(() => shell.value?.querySelector<HTMLElement>(".notes__search")?.focus());
    };

    const open = (note: Note | null) =>
      (draft.value = note
        ? { note, title: note.title, text: note.text, labels: [...note.labels] }
        : { note: null, title: "", text: "", labels: categoryLabels(s.value.category) });
    const save = () => {
      const d = draft.value;
      if (!d) return;
      if (d.note) {
        d.note.title = noteTitle(d.title);
        d.note.text = d.text;
        d.note.labels = [...d.labels];
        d.note.editedAt = nextEdit(s.value.notes);
        s.value = { ...s.value };
      } else {
        s.value = { ...s.value, notes: [...s.value.notes, { id: crypto.randomUUID(), title: noteTitle(d.title), text: d.text, labels: [...d.labels], pinned: s.value.category === "pinned", editedAt: nextEdit(s.value.notes) }] };
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
    const cardAction = (note: Note, value: string) => {
      if (value === "pin") {
        s.value = { ...s.value, notes: s.value.notes.map(n => n === note ? { ...n, pinned: !n.pinned } : n) };
      } else if (value === "labels") open(note);
      else if (value === "delete") remove(note);
    };
    const groups = () => noteGroups(visible(s.value));
    const items = () => categoryItems(s.value);
    return { s, draft, snackbar, shell, compact, drawerOpen, searchOpen, dismissEditor, LABELS, ADD_ICON, CLOSE_ICON,
      GRID_ICON, LIST_ICON, MENU_ICON, MORE_ICON, SEARCH_ICON, labelOf, editedLabel, emptyLabel, status,
      groups, items, open, save, remove, undo, cardAction, chooseCategory, closeDrawer, toggleSearch };
  },
  template: `
    <section class="notes" ref="shell" :data-compact="compact">
      <MTopAppBar headline="Notes" noScroll>
        <MIconButton v-if="compact" slot="leading" class="notes__menu" :icon="MENU_ICON"
          ariaLabel="Open categories" @click="drawerOpen = true" />
        <div slot="trailing" class="notes__tools">
          <MIconButton v-if="compact" :icon="searchOpen ? CLOSE_ICON : SEARCH_ICON"
            :ariaLabel="searchOpen ? 'Close search' : 'Search notes'" @click="toggleSearch" />
          <template v-else>
            <MSearch class="notes__search" placeholder="Search notes" :value="s.query" @input="s = { ...s, query: $event.detail.value }" />
            <MButtonGroup kind="connected" selection="single" required :value="s.view"
              @change="s = { ...s, view: $event.detail.value === 'list' ? 'list' : 'grid' }">
              <MButtonGroupItem :icon="GRID_ICON" value="grid" ariaLabel="Grid view" />
              <MButtonGroupItem :icon="LIST_ICON" value="list" ariaLabel="List view" />
            </MButtonGroup>
          </template>
        </div>
      </MTopAppBar>
      <div v-if="compact" class="notes__mobile-search" :hidden="!searchOpen">
        <MSearch class="notes__search" placeholder="Search notes" :value="s.query" @input="s = { ...s, query: $event.detail.value }" />
      </div>
      <div class="notes__workspace">
        <MDrawer :key="String(compact)" class="notes__drawer" :modal="compact" :open="!compact || drawerOpen"
          width="216" :value="s.category" ariaLabel="Categories" @close="closeDrawer" @change="chooseCategory($event.detail.value)">
          <MDrawerItem v-for="item in items().slice(0, 2)" :key="item.id" :value="item.id" :badge="item.badge">{{ item.label }}</MDrawerItem>
          <MDrawerItem type="section">Labels</MDrawerItem>
          <MDrawerItem v-for="item in items().slice(2)" :key="item.id" :value="item.id" :badge="item.badge">{{ item.label }}</MDrawerItem>
        </MDrawer>
        <div class="notes__content">
          <output class="notes__status" role="status">{{ status(s) }}</output>
          <div v-if="groups().length === 0" class="notes__empty">
            <p>{{ emptyLabel(s) }}</p>
            <MButton v-if="!s.query" variant="text" @click="open(null)">Create note</MButton>
          </div>
          <section v-for="group in groups()" :key="group.title" class="notes__section">
            <h2>{{ group.title }}</h2>
            <div :class="'notes__grid ' + s.view">
              <article v-for="note in group.notes" :key="note.id" class="notes__card" :aria-label="note.title">
                <MCard>
                  <div class="notes__card-heading">
                    <button type="button" class="notes__open" @click="open(note)">{{ note.title }}</button>
                    <MIconButton :id="'notes-more-' + note.id" class="notes__more" :icon="MORE_ICON"
                      :ariaLabel="'More actions for ' + note.title" />
                  </div>
                  <p>{{ note.text }}</p>
                  <p v-if="note.labels.length" class="notes__labels">{{ note.labels.map(labelOf).join(' · ') }}</p>
                  <time :datetime="new Date(note.editedAt).toISOString()">{{ editedLabel(note.editedAt) }}</time>
                </MCard>
                <MMenu :anchor="'notes-more-' + note.id" position="bottom-end" @select="cardAction(note, $event.detail.value)">
                  <MMenuItem value="pin">{{ note.pinned ? 'Unpin' : 'Pin' }}</MMenuItem>
                  <MMenuItem value="labels">Labels</MMenuItem>
                  <MMenuItem value="delete">Delete</MMenuItem>
                </MMenu>
              </article>
            </div>
          </section>
        </div>
      </div>
      <MExtendedFab :icon="ADD_ICON" ariaLabel="New note" @click="open(null)">New note</MExtendedFab>
      <MDialog v-if="!compact" :open="draft !== null" :headline="draft && draft.note ? 'Edit note' : 'New note'" @close="dismissEditor">
        <div class="notes__fields">
          <MTextField label="Title" :value="draft ? draft.title : ''" @input="draft && (draft = { ...draft, title: $event.detail.value })" />
          <MTextField label="Note" type="multiline" :value="draft ? draft.text : ''" @input="draft && (draft = { ...draft, text: $event.detail.value })" />
          <MChips :value="draft ? draft.labels.join(',') : ''" @change="draft && (draft = { ...draft, labels: $event.detail.value })">
            <MChip v-for="l in LABELS" :key="l.value" :label="l.text" :value="l.value" />
          </MChips>
        </div>
        <div slot="actions" class="notes__editor-actions">
          <MButton variant="outlined" @click="draft && (draft.note ? remove(draft.note) : (draft = null))">Delete</MButton>
          <MButton variant="text" @click="draft = null">Cancel</MButton>
          <MButton @click="save()">Save</MButton>
        </div>
      </MDialog>
      <MBottomSheet v-else modal :open="draft !== null" :title="draft && draft.note ? 'Edit note' : 'New note'" @close="dismissEditor">
        <div class="notes__fields">
          <MTextField label="Title" :value="draft ? draft.title : ''" @input="draft && (draft = { ...draft, title: $event.detail.value })" />
          <MTextField label="Note" type="multiline" :value="draft ? draft.text : ''" @input="draft && (draft = { ...draft, text: $event.detail.value })" />
          <MChips :value="draft ? draft.labels.join(',') : ''" @change="draft && (draft = { ...draft, labels: $event.detail.value })">
            <MChip v-for="l in LABELS" :key="l.value" :label="l.text" :value="l.value" />
          </MChips>
        </div>
        <div class="notes__editor-actions">
          <MButton variant="outlined" @click="draft && (draft.note ? remove(draft.note) : (draft = null))">Delete</MButton>
          <MButton variant="text" @click="draft = null">Cancel</MButton>
          <MButton @click="save()">Save</MButton>
        </div>
      </MBottomSheet>
      <MSnackbar ref="snackbar" message="Note deleted" action="Undo" duration="4000" dismissible @action="undo" />
    </section>`,
});
