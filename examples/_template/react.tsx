// React: material/react wraps the same elements.
import { useState } from "react";
import { Button, Card, Switch } from "material/react";
import { DEFAULTS, summary, type Notify as State } from "./shared";

export default function Notify() {
  const [s, setS] = useState<State>(DEFAULTS);
  const [status, setStatus] = useState("");

  return (
    <section className="notify">
      <Card headline="Notifications">
        <p>Get a message when a save finishes.</p>
        <Switch
          className="notify__switch"
          checked={s.notify}
          onChange={(e) => setS((prev) => ({ ...prev, notify: e.detail.checked }))}
        >
          Notify me
        </Switch>
        <Button slot="actions" onClick={() => setStatus(summary(s))}>Save</Button>
      </Card>
      <output className="notify__status" role="status">{status}</output>
    </section>
  );
}
