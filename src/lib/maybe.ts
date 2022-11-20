export type M<T> = T | null | void

export namespace Maybe {
  export const map: <In, Out>(
    f: (arg: NonNullable<In>) => Out,
  ) => (maybe: M<In>) => M<Out> = (f) => (arg) =>
    arg == null ? null : f(arg)
}
