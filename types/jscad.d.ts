declare module '@jscad/modeling' {
  export const geometries: any
  export const booleans: any
  export const primitives: any
  export const transforms: any
}

declare module '@jscad/stl-serializer' {
  export function serialize(options: any, geometry: any): string
}

declare module '@jscad/io' {
  export const io: any
}