/** @jsxImportSource solid-js */
// Solid: material/solid wraps the same elements.
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { Button, Card, Switch } from "material/solid";
import { DEFAULTS, summary, type Notify as State } from "./shared";

export default function Notify() {
  const [s, setS] = createStore<State>({ ...DEFAULTS });
  const [status, setStatus] = createSignal("");

  return (
    <section class="notify">
      <Card headline="Notifications">
        <p>Get a message when a save finishes.</p>
        <Switch
          class="notify__switch"
          checked={s.notify}
          onChange={(e) => setS("notify", e.detail.checked)}
        >
          Notify me
        </Switch>
        <Button slot="actions" onClick={() => setStatus(summary(s))}>Save</Button>
      </Card>
      <output class="notify__status" role="status">{status()}</output>
    </section>
  );
}
