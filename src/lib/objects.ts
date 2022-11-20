import {M} from "./maybe"

export const prop =
  <P extends string>(path: P) =>
  <V>(obj: {[p in P]: V} & {[key: string]: any}): V =>
    obj[path]

export const get =
  (key: string) =>
  <V>(obj: {[key: string]: V}): M<V> => {
    return obj[key]
  }
