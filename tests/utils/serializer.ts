export const serializer = <T>(v: T) =>
  Deno.inspect(v, {
    sorted: true,
    depth: Infinity,
    iterableLimit: Infinity,
    strAbbreviateSize: Infinity,
  })
