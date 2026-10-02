import type { Value } from "./types";
export { shared } from "./shared";
export const lazy = () => import("./nested");
export const value: Value = "vanilla";
// import "./stray";
export const text = 'import "./stray"';
