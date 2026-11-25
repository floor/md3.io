// The home page's code, highlighted on the server as the docs are. The framework snippets
// follow each framework's guide (docs/components/<framework>.md): a Save button.
import { highlightCode } from './content';

const FRAMEWORK_SNIPPETS: readonly [id: string, name: string, code: string, note: string][] = [
  ['vanilla', 'Vanilla JS', "import { createButton } from 'material';\n\nconst save = createButton({ text: 'Save' });\ndocument.body.append(save.element);", "createButton() and the other factories, in any page."],
  ['html', 'Web Components', "import 'material/elements/css';\nimport { defineAll } from 'material/elements';\n\ndefineAll();\n// <m-button variant=\"filled\">Save</m-button>", "<m-button> and the other elements, after defineAll()."],
  ['react', 'React', "import { Button } from 'material/react';\n\n<Button variant=\"filled\">Save</Button>", "<Button> and the others, from material/react."],
  ['vue', 'Vue', "import { MButton } from 'material/vue';\n\n<MButton variant=\"filled\">Save</MButton>", "<MButton> and the others, from material/vue."],
  ['svelte', 'Svelte', "import { Button } from 'material/svelte';\n\n<Button variant=\"filled\">Save</Button>", "<Button> and the others, from material/svelte."],
  ['solid', 'SolidJS', "import { Button } from 'material/solid';\n\n<Button variant=\"filled\">Save</Button>", "<Button> and the others, from material/solid."],
];

let cached: { frameworks: { id: string; name: string; note: string; html: string }[]; lightweight: string } | undefined;
export const homeCode = () => cached ??= {
  frameworks: FRAMEWORK_SNIPPETS.map(([id, name, code, note]) => ({ id, name, note, html: highlightCode(code, 'javascript') })),
  lightweight: highlightCode("import { createButton } from 'material';\nimport 'material/styles/base';\nimport 'material/styles/button';", 'javascript'),
};
