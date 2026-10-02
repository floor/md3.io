import "./dispatches.csv";
import rows from "./rows.json";
import Card from "./Card.vue";
export { helper } from "./helper";

export const count = Array.isArray(rows) ? rows.length : 0;
export { Card };
