import type { Value } from "./types";
import { basename } from "node:path";
import { variant } from "../plain/html";
export { nested } from "./nested";
export const shared: Value = basename(variant);
