// Every example, in the order the Examples section lists them.
import booking from "./booking/meta";
import settings from "./settings/meta";
import notes from "./notes/meta";
import type { ExampleMeta } from "./types";

export const examples: ExampleMeta[] = [settings, booking, notes];
export { FRAMEWORKS, exampleVariantIds, exampleReferenceId, type FrameworkId, type ExampleMeta } from "./types";
