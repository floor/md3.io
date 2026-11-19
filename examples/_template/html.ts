// Web components: the elements themselves, no framework.
import "material/elements/css";
import { defineAll } from "material/elements";
import { DEFAULTS, summary } from "./shared";

defineAll();

const app = document.getElementById("app")!;
app.innerHTML = `
  <section class="notify">
    <m-card headline="Notifications">
      <p>Get a message when a save finishes.</p>
      <m-switch class="notify__switch">Notify me</m-switch>
      <m-button slot="actions">Save</m-button>
    </m-card>
    <output class="notify__status" role="status"></output>
  </section>`;

const s = { ...DEFAULTS };
const status = app.querySelector("output")!;
const notify = app.querySelector("m-switch")!;
notify.addEventListener("change", (e) => (s.notify = (e as CustomEvent<{ checked: boolean }>).detail.checked));
app.querySelector("m-button")!.addEventListener("click", () => (status.textContent = summary(s)));
