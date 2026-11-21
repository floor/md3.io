import { describe, expect, test } from 'bun:test';
import { parse, type SFCTemplateBlock } from 'vue/compiler-sfc';
import { addonSlugs } from '../src/shared/addons';
import { components, elementConfig, initialComponentState, normalizeComponentState } from '../src/shared/components';
import { elementMeta } from '../src/server/elements-meta';
import { frameworkCode } from '../src/shared/frameworks';

type TemplateNode = NonNullable<SFCTemplateBlock['ast']>['children'][number];
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

/** The existing Vue parser reports mismatched/missing tags without browser repair. */
function markupErrors(html: string): string[] {
  const { descriptor, errors } = parse(`<template>\n${html}\n</template>`);
  const issues = errors.map(error => typeof error === 'string' ? error : error.message);
  const ast = descriptor.template?.ast;
  if (!ast) return [...issues, 'No parsed template'];
  const visit = (node: TemplateNode) => {
    if (node.type !== 1) return;
    // HTML custom elements need explicit closing tags; SVG/MathML may self-close.
    if (node.ns === 0 && node.isSelfClosing && !voidTags.has(node.tag)) issues.push(`Self-closing HTML tag: ${node.tag}`);
    node.children.forEach(visit);
  };
  ast.children.forEach(visit);
  return issues;
}

describe('generated add-on HTML', () => {
  for (const slug of addonSlugs) {
    const meta = elementMeta(slug);
    // Form and Color picker are Factory-only and have no generated HTML tab.
    if (!meta) continue;
    for (const scenario of [null, ...components[slug].scenarios]) {
      test(`${slug}/${scenario?.id ?? 'default'} has balanced markup`, () => {
        const state = normalizeComponentState(slug, { ...initialComponentState(slug), ...scenario?.options });
        const html = frameworkCode('html', meta, elementConfig(slug, state), { theme: 'baseline', mode: 'light' });
        expect(markupErrors(html)).toEqual([]);
      });
    }
  }

  test.each([
    '<m-stepper><m-step></m-step></m-step>',
    '<section><m-avatar></section></m-avatar>',
    '<m-avatar />',
  ])('rejects broken markup: %s', html => {
    expect(markupErrors(html).length).toBeGreaterThan(0);
  });

  test('accepts void elements, foreign self-closing tags and raw script/style text', () => {
    expect(markupErrors(`<m-stepper><m-step><input type="email"><br><svg><path d="M0 0" /></svg></m-step></m-stepper>
<style>.example::before { content: "<m-step>"; }</style>
<script type="module">const tag = '<m-step>'; if (1 < 2) console.log(tag);</script>
<!-- </m-stepper> -->`)).toEqual([]);
  });
});
