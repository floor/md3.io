// What an example declares; the build and the pages read it.
export interface ExampleMeta {
  slug: string;
  title: string;
  description: string;
  /** mtrl components the example uses. */
  components: string[];
  /** Paragraphs for the side panel (trusted HTML, written here). */
  about: string[];
  how: string[];
  variants?: FrameworkId[];
  /** Public package CSS exports, in cascade order; linked before the example stylesheet. */
  packageStyles?: string[];
}

/** The variants every example ships, in tab order: the web components first. */
export const FRAMEWORKS = [
  { id: "vanilla", label: "Vanilla", file: "vanilla.ts" },
  { id: "html", label: "Web Components", file: "html.ts" },
  { id: "react", label: "React", file: "react.tsx" },
  { id: "vue", label: "Vue", file: "vue.ts" },
  { id: "svelte", label: "Svelte", file: "svelte.svelte" },
  { id: "solid", label: "SolidJS", file: "solid.tsx" },
] as const;

export type FrameworkId = (typeof FRAMEWORKS)[number]["id"];

export function exampleVariantIds(meta: ExampleMeta): FrameworkId[] {
  if (meta.variants) {
    if (meta.variants.length === 0) throw new Error(`Example ${meta.slug} declares an empty variants array`);
    const valid = FRAMEWORKS.map((f) => f.id);
    const invalid = meta.variants.find((id) => !valid.includes(id));
    if (invalid) throw new Error(`Unknown framework id: ${invalid}`);
    return meta.variants;
  }
  return FRAMEWORKS.map((f) => f.id);
}

export function exampleReferenceId(meta: ExampleMeta): FrameworkId {
  const ids = exampleVariantIds(meta);
  return ids.includes("html") ? "html" : ids[0]!;
}
