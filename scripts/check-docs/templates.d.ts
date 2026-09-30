// What the TypeScript generated from a vue or svelte block calls (check-docs/templates.ts):
// each component in a template becomes a call that types its props against the
// component's own types, as the framework's language tools would.

/** A native event as a prop: `onClick` for `click`, typed with the browser's event. */
type __NativeEvents = { [K in keyof HTMLElementEventMap as `on${Capitalize<K>}`]?: (event: HTMLElementEventMap[K]) => void };
/** A Vue component's props: its declared props and `on*` events; a functional component's first parameter. */
type __VueProps<C> = C extends abstract new (...args: any) => { $props: infer P } ? P : C extends (props: infer P, ...rest: any) => any ? P : never;

/** A Vue component: its own props typed; any other attribute falls through to the element, as in Vue. */
declare function __vue<C>(component: C, props: NoInfer<__VueProps<C> & Omit<__NativeEvents, keyof __VueProps<C>>> & Record<string, unknown>): void;
/** A plain element in a Vue template: its listeners get the browser's events. */
declare function __vueElement(props: __NativeEvents & Record<string, unknown>): void;
/** What `v-model` (`v-model:name`) writes back: the payload of the component's `update:` event. */
declare function __vueModel<C, K extends string>(component: C, name: K): __VueProps<C> extends { [P in `onUpdate:${K}`]?: (value: infer V) => any } ? V : never;
/** A Vue component's named slots (`$slots`): `default` and each slot its element declares. */
type __VueSlots<C> = C extends abstract new (...args: any) => { $slots: infer S } ? S : Record<string, unknown>;
/** `<template #name>` (`v-slot:name`) in a component: `name` must be one of its slots. */
declare function __vueSlot<C>(component: C, name: keyof __VueSlots<C> & string): void;
/** `v-for`: the item, the key or index, the index. */
declare function __vueFor<T>(source: Iterable<T> | ArrayLike<T>): [T, number, number][];
declare function __vueFor(source: number): [number, number, number][];
/** A `<script setup>`'s bindings as its template reads them: refs unwrapped. */
declare function __vueScope<T extends object>(bindings: T): import('vue').ShallowUnwrapRef<T>;

/** A Svelte component: its props typed. */
declare function __svelte<P extends Record<string, any>>(component: import('svelte').Component<P, any, any>, props: NoInfer<P>): void;
/** A plain element in a Svelte template: its attributes typed as Svelte types them. */
declare function __svelteElement<K extends string>(tag: K, props: K extends keyof import('svelte/elements').SvelteHTMLElements ? import('svelte/elements').SvelteHTMLElements[K] : Record<string, unknown>): void;
/** `{#each}`: the item and its index. */
declare function __svelteEach<T>(source: Iterable<T> | ArrayLike<T> | null | undefined): [T, number][];
/** What `bind:this` on a plain element assigns. */
declare function __svelteThis<K extends string>(tag: K): K extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[K] : HTMLElement;
/** `bind:this` on a component: its instance, which is its exports (`element` on mtrl's). */
declare function __svelteInstance<X extends Record<string, any>>(component: import('svelte').Component<any, X, any>): X;
/** A `{#snippet}` passed to a component: its parameters typed by the prop it fills. */
declare function __svelteSnippet<A extends unknown[] = []>(render: (...args: A) => void): import('svelte').Snippet<A>;
