export const prop =
  <P extends string>(path: P) =>
  <V>(obj: {[p in P]: V} & {[key: string]: any}): V =>
    obj[path]
