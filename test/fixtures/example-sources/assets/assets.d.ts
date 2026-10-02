// The fixture imports files a real example can: data it reads and a component file.
declare module "*.csv" { const text: string; export default text; }
declare module "*.json" { const value: unknown; export default value; }
declare module "*.vue" { const component: unknown; export default component; }
