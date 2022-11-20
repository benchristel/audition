import {expect, is, test} from "@benchristel/taste"

type PassFn = (<T>(a: T) => T) &
  (<T1, T2>(a: T1, f1: (a: T1) => T2) => T2) &
  (<T1, T2, T3>(a: T1, f1: (a: T1) => T2, f2: (a: T2) => T3) => T3) &
  (<T1, T2, T3, T4>(
    a: T1,
    f1: (a: T1) => T2,
    f2: (a: T2) => T3,
    f3: (a: T3) => T4,
  ) => T4)
;() => _ as PassFn

test("_ (a.k.a. pass)", {
  "passes a value through several functions"() {},

  "acts as the identity function given a single argument"() {
    expect(_(123), is, 123)
  },

  "passes its first argument through a function"() {
    const inc = (n: number) => n + 1
    expect(_(1, inc), is, 2)
  },

  "passes its argument through two functions"() {
    const inc = (n: number) => n + 1
    expect(_(1, inc, inc), is, 3)
  },

  "is typesafe"() {
    const toString = (x: number) => String(x)
    // @ts-expect-error
    ;() => _(123) as string
    // @ts-expect-error
    ;() => _(123, toString) as number
  },
})

export const _ = ((
  arg: unknown,
  ...fns: Array<(a: unknown) => unknown>
) => {
  return fns.reduce((a, f) => f(a), arg)
}) as PassFn
