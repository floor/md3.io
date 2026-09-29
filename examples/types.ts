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
}

/** The variants every example ships, in tab order: the web components first. */
export const FRAMEWORKS = [
  { id: "html", label: "HTML", file: "html.ts" },
  { id: "react", label: "React", file: "react.tsx" },
  { id: "vue", label: "Vue", file: "vue.ts" },
  { id: "svelte", label: "Svelte", file: "svelte.svelte" },
  { id: "solid", label: "Solid", file: "solid.tsx" },
  { id: "vanilla", label: "Vanilla", file: "vanilla.ts" },
] as const;

export type FrameworkId = (typeof FRAMEWORKS)[number]["id"];
