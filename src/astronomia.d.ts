declare module "astronomia" {
  export const julian: any;
  export const moonposition: any;
  export const moonnode: any;
  export const sidereal: any;
  export const planetposition: any;
}

declare module "astronomia/data/*" {
  const data: unknown;
  export default data;
}
