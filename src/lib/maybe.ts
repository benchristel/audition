export type M<T> = T | null | void

export namespace Maybe {
  export const map: <I, O>(
    f: (arg: I) => O,
  ) => (maybe: M<I>) => M<O> = (f) => (arg) =>
    arg == null ? null : f(arg)
}
