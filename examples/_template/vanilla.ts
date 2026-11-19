// Vanilla: the create* factories the elements are built on.
import createButton from "material/components/button";
import createCard from "material/components/card";
import createSwitch from "material/components/switch";
import { DEFAULTS, summary, type Notify } from "./shared";

const s: Notify = { ...DEFAULTS };
const app = document.getElementById("app")!;
const section = Object.assign(document.createElement("section"), { className: "notify" });

const text = Object.assign(document.createElement("p"), { textContent: "Get a message when a save finishes." });
const status = Object.assign(document.createElement("output"), { className: "notify__status" });
status.setAttribute("role", "status");

const notify = createSwitch({ label: "Notify me", checked: s.notify, class: "notify__switch" });
notify.on("change", ({ checked }) => (s.notify = checked));

const save = createButton({ text: "Save" });
save.on("click", () => (status.textContent = summary(s)));

const card = createCard({
  header: { title: "Notifications" },
  content: { children: [text, notify.element] },
  actions: { actions: [save.element] },
});

section.append(card.element, status);
app.append(section);
