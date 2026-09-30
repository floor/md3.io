import { describe, expect, test } from 'bun:test';
import { exampleCode, parseExample, renderExample } from '../src/server/example-block';
import { renderDocument } from '../src/server/content';
import { appRef, type Framework } from '../src/shared/frameworks';

const code = (source: string, framework: Framework) => exampleCode(parseExample(source)).code[framework]!;

const withEvent = 'switch:\n  label: Wi-Fi\n  checked: true\n  on change: setWifi(checked)\n';
const withAction = 'slider:\n  label: Volume\n  value: 40\n  action mute:\n    set value: 0\n    set disabled: true\n';
const withChildren = 'tabs:\n  tabs:\n    - { text: Flights, value: flights, state: active }\n    - { text: Trips, value: trips }\n  on change: showPanel(value)\n';

describe('the example fence', () => {
  test('parses the component, its options, handlers and actions', () => {
    expect(parseExample(withEvent)).toEqual({
      slug: 'switch', config: { label: 'Wi-Fi', checked: true },
      handlers: [{ event: 'change', call: 'setWifi', args: ['checked'] }], actions: [],
    });
    const button = parseExample("button:\n  icon: saveIcon\n  on click: track('save', 1)\n  action busy:\n    - set disabled: true\n    - open\n");
    expect(button.config.icon).toBe(appRef('saveIcon'));
    expect(button.handlers).toEqual([{ event: 'click', call: 'track', args: ["'save'", '1'] }]);
    expect(button.actions).toEqual([{ name: 'busy', steps: [{ set: 'disabled', value: true }, { open: true }] }]);
  });
  test('says why a block is not an example', () => {
    expect(() => parseExample('switch: 1\nbutton: 2\n')).toThrow('one component');
    expect(() => parseExample('switch:\n  on change: setWifi\n')).toThrow('is not a call');
    expect(() => parseExample('switch:\n  on change: setWifi(a + b)\n')).toThrow('neither a payload field nor a literal');
    expect(() => parseExample('switch:\n  action reset:\n    toggle: true\n')).toThrow('is not a step');
    expect(() => parseExample('switch:\n  when change: x()\n')).toThrow('neither an option');
  });
  test('a framework that cannot render a block fails it', () => {
    expect(() => exampleCode(parseExample('button:\n  text: Upload\n  progress: true\n'))).toThrow('<m-button> does not take progress');
    expect(() => exampleCode(parseExample('button:\n  text: Go\n  on click: go(event)\n'))).toThrow("click event has no detail");
    expect(() => exampleCode(parseExample('slider:\n  action reset:\n    set value: 0\n'))).toThrow('set value needs the first value');
  });
  test('a component without an element renders in Vanilla only, with a note', () => {
    const { element, code: rendered } = exampleCode(parseExample('form:\n  class: signup\n'));
    expect(element).toBe(false);
    expect(Object.keys(rendered)).toEqual(['vanilla']);
    const html = renderExample('form:\n  class: signup\n');
    expect(html.match(/class="framework-note"/g)).toHaveLength(5);
  });
  test('renders six highlighted panels, and one switch at the top of a page with examples', () => {
    const html = renderExample(withEvent);
    expect(html.match(/class="doc-example__panel"/g)).toHaveLength(6);
    expect(html).toContain('data-framework="solid"><span class="doc-example__label">SolidJS</span><pre><code class="hljs language-typescript">');
    const document = renderDocument('slider')!;
    expect(document.html).not.toContain('framework-switch');
    expect(document.frameworkSwitch.match(/class="framework-tab framework-switch__option"/g)).toHaveLength(6);
    expect(renderDocument('drawer')!.frameworkSwitch).toBe('');
    expect(document.html).not.toContain('doc-example__error');
  });
});

describe('Vanilla', () => {
  test('a switch with an event', () => {
    expect(code(withEvent, 'vanilla')).toBe("import { createSwitch } from 'mtrl';\n\nconst toggle = createSwitch({ label: 'Wi-Fi', checked: true });\ntoggle.on('change', ({ checked }) => setWifi(checked));\ndocument.body.append(toggle.element);\n");
  });
  test('an action calls the setters', () => {
    expect(code(withAction, 'vanilla')).toContain('function mute() {\n  slider.setValue(0);\n  slider.disable();\n}\n');
  });
  test('open and close are the factory\'s own methods', () => {
    expect(code('dialog:\n  title: Hi\n  action ask:\n    open\n', 'vanilla')).toContain('function ask() {\n  dialog.open();\n}');
    expect(code('snackbar:\n  message: Saved\n  action tell:\n    - open\n    - close\n', 'vanilla')).toContain('function tell() {\n  snackbar.show();\n  snackbar.hide();\n}');
  });
  test('a tooltip\'s target is made by its own factory, and its element passed', () => {
    expect(code('tooltip:\n  text: Save\n  target: { icon: saveIcon, ariaLabel: Save }\n', 'vanilla')).toBe("import { createTooltip, createIconButton } from 'mtrl';\n\nconst iconButton = createIconButton({ icon: saveIcon, ariaLabel: 'Save' });\ndocument.body.append(iconButton.element);\n\nconst tooltip = createTooltip({ text: 'Save', target: iconButton.element });\ndocument.body.append(tooltip.element);\n");
  });
  test('children are the config array', () => {
    expect(code(withChildren, 'vanilla')).toContain("const tabs = createTabs({\n  tabs: [\n    { text: 'Flights', value: 'flights', state: 'active' },\n    { text: 'Trips', value: 'trips' },\n  ],\n});\ntabs.on('change', ({ value }) => showPanel(value));");
  });
});

describe('Web Components', () => {
  test('a switch with an event: the markup, then its listener, without the setup', () => {
    const html = code(withEvent, 'html');
    expect(html).toBe("<m-switch checked>Wi-Fi</m-switch>\n\n<script type=\"module\">\n  const switchElement = document.querySelector('m-switch');\n  switchElement.addEventListener('change', (event) => setWifi(event.detail.checked));\n</script>\n");
    expect(html).not.toContain('defineAll');
  });
  test('an action sets the live property and the attribute', () => {
    expect(code(withAction, 'html')).toContain("function mute() {\n    slider.value = 0;\n    slider.toggleAttribute('disabled', true);\n  }");
  });
  test('an action on a live property with an attribute of its own: one state, the property set', () => {
    const source = 'progress:\n  value: 30\n  action advance:\n    set value: 75\n';
    const html = code(source, 'html');
    expect(html).toContain('<m-progress value="30"></m-progress>');
    expect(html).toContain('function advance() {\n    progress.value = 75;\n  }');
    expect(html).not.toContain('progress.value = false');
    expect(code(source, 'react')).toContain('<Progress value={value} />');
  });
  test('children are elements', () => {
    expect(code(withChildren, 'html')).toContain('<m-tabs value="flights">\n  <m-tab value="flights">Flights</m-tab>\n  <m-tab value="trips">Trips</m-tab>\n</m-tabs>');
  });
});

describe('React', () => {
  test('a switch with an event runs beside the model', () => {
    const react = code(withEvent, 'react');
    expect(react).toContain("import { setWifi } from './app';");
    expect(react).toContain('<Switch checked={checked} onChange={(event) => { setChecked(event.detail.checked); setWifi(event.detail.checked); }}>Wi-Fi</Switch>');
    expect(react).not.toContain('mtrl/styles');
  });
  test('an action is a state change', () => {
    const react = code(withAction, 'react');
    expect(react).toContain('const [disabled, setDisabled] = useState(false);\n  const mute = () => {\n    setValue(0);\n    setDisabled(true);\n  };');
    expect(react).toContain('label="Volume" disabled={disabled}');
  });
  test('children are components', () => {
    expect(code(withChildren, 'react')).toContain('<Tab value="flights">Flights</Tab>');
  });
});

describe('Vue', () => {
  test('a switch with an event', () => {
    expect(code(withEvent, 'vue')).toContain('<MSwitch v-model="checked" @change="setWifi($event.detail.checked)">Wi-Fi</MSwitch>');
  });
  test('an action is a state change', () => {
    const vue = code(withAction, 'vue');
    expect(vue).toContain('function mute() {\n  value.value = 0;\n  disabled.value = true;\n}');
    expect(vue).toContain(':disabled="disabled"');
  });
  test('children are components', () => {
    expect(code(withChildren, 'vue')).toContain('<MTabs v-model="value" @change="showPanel($event.detail.value)">\n    <MTab value="flights">Flights</MTab>');
  });
});

describe('Svelte', () => {
  test('a switch with an event', () => {
    expect(code(withEvent, 'svelte')).toContain('<Switch bind:checked onchange={(event) => setWifi(event.detail.checked)}>Wi-Fi</Switch>');
  });
  test('an action is a state change', () => {
    const svelte = code(withAction, 'svelte');
    expect(svelte).toContain('  function mute() {\n    value = 0;\n    disabled = true;\n  }');
    expect(svelte).toContain('let disabled = $state(false);');
  });
  test('children are components', () => {
    expect(code(withChildren, 'svelte')).toContain('<Tabs bind:value onchange={(event) => showPanel(event.detail.value)}>\n  <Tab value="flights">Flights</Tab>');
  });
});

describe('SolidJS', () => {
  test('a switch with an event', () => {
    expect(code(withEvent, 'solid')).toContain('<Switch checked={checked()} onChange={(event) => { setChecked(event.detail.checked); setWifi(event.detail.checked); }}>Wi-Fi</Switch>');
  });
  test('an action is a signal change', () => {
    const solid = code(withAction, 'solid');
    expect(solid).toContain('const [disabled, setDisabled] = createSignal(false);');
    expect(solid).toContain('disabled={disabled()}');
  });
  test('children are components', () => {
    expect(code(withChildren, 'solid')).toContain('<Tabs value={value()} onChange={(event) => { setValue(event.detail.value); showPanel(event.detail.value); }}>');
  });
});

describe('open state and bound text', () => {
  test("a handler on the open state's event runs inside its binding", () => {
    const dialog = "dialog:\n  title: Discard draft?\n  on close: track('dialog')\n  action ask: open\n";
    expect(code(dialog, 'react')).toContain("open={open} onClose={() => { setOpen(false); track('dialog'); }}");
    expect(code(dialog, 'vue')).toContain(`:open="open" @close="open = false; track('dialog')"`);
    expect(code(dialog, 'html')).toContain('function ask() {\n    dialog.show();\n  }');
  });
  test("a button's text an action sets is state", () => {
    const button = 'button:\n  text: Send\n  action sending:\n    set text: Sending\n';
    expect(code(button, 'react')).toContain('>{text}</Button>');
    expect(code(button, 'vue')).toContain('>{{ text }}</MButton>');
    expect(code(button, 'html')).toContain('button.textContent = "Sending";');
    expect(code(button, 'vanilla')).toContain("button.setText('Sending');");
  });
});
