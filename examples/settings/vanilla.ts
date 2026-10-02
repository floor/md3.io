// Vanilla: the create* factories the elements are built on. The screen is in app.ts,
// the fixture in data.ts, the state in state.ts, each control in controls.ts.
import { createSettingsApp } from "./app";

document.getElementById("app")!.append(createSettingsApp());
