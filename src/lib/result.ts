import {test, expect, equals} from "@benchristel/taste"
import {exhausted} from "./exhaust"

export type Result<T, F> = SuccessResult<T> | FailureResult<F>

export type SuccessResult<T> = {type: "success"; value: T}
export type FailureResult<F> = {type: "failure"; detail: F}

export function success<T>(value: T): SuccessResult<T> {
  return {type: "success", value}
}

export function failure<F>(detail: F): FailureResult<F> {
  return {type: "failure", detail}
}

test("Result.map returns a function that", {
  "transforms a success"() {
    const inc = (n: number) => n + 1
    const rInc = Result.map(inc)
    expect(rInc(success(3)), equals(success(4)))
  },

  "passes a failure through"() {
    const inc = (n: number) => n + 1
    const rInc = Result.map(inc)
    expect(rInc(failure("oops")), equals(failure("oops")))
  },
})

test("Result.flatMap returns a function that", {
  "transforms a success"() {
    const reciprocal = (x: number) =>
      x === 0 ? failure("can't divide by 0") : success(1 / x)
    const rReciprocal = Result.flatMap(reciprocal)
    expect(rReciprocal(success(4)), equals(success(0.25)))
  },

  "transforms success into failure"() {
    const reciprocal = (x: number) =>
      x === 0 ? failure("can't divide by 0") : success(1 / x)
    const rReciprocal = Result.flatMap(reciprocal)
    expect(
      rReciprocal(success(0)),
      equals(failure("can't divide by 0")),
    )
  },

  "passes a failure through"() {
    const fail = () => failure("this should be ignored")
    expect(
      Result.flatMap(fail)(failure("oops")),
      equals(failure("oops")),
    )
  },
})

test("Result.objAll", {
  "is typesafe"() {
    const a: Result<{a: number; b: string}, string> = Result.objAll({
      a: success(1),
      b: failure("uh oh"),
    })
    // @ts-expect-error
    const b: Result<{a: string; b: string}, string> = Result.objAll({
      a: success(1),
      b: failure("uh oh"),
    })
  },
})

export namespace Result {
  export type Value<T extends Result<any, any>> = Extract<
    T,
    {type: "success"}
  >["value"]

  export type Failure<T extends Result<any, any>> = Extract<
    T,
    {type: "failure"}
  >["detail"]

  export const map: <I, O>(
    f: (arg: I) => O,
  ) => <F>(result: Result<I, F>) => Result<O, F> = (f) => {
    return (r) => {
      switch (r.type) {
        case "success":
          return success(f(r.value))
        case "failure":
          return r
        default:
          throw exhausted(r)
      }
    }
  }

  export const flatMap: <I, O, F>(
    f: (arg: I) => Result<O, F>,
  ) => <E>(result: Result<I, E>) => Result<O, E | F> = (f) => {
    return (r) => {
      switch (r.type) {
        case "success":
          return f(r.value)
        case "failure":
          return r
        default:
          throw exhausted(r)
      }
    }
  }

  export function all<A, B, F>(
    results: [Result<A, F>, Result<B, F>],
  ): Result<[A, B], F>
  export function all<T, F>(
    results: Array<Result<T, F>>,
  ): Result<Array<T>, F>
  export function all<T, F>(
    results: Array<Result<T, F>>,
  ): Result<Array<T>, F> {
    const successes = []
    for (const r of results) {
      switch (r.type) {
        case "success":
          successes.push(r.value)
          break
        case "failure":
          return r
        default:
          throw exhausted(r)
      }
    }
    return success(successes)
  }

  export function objAll<
    Obj extends {[key: string]: Result<any, F>},
    F,
  >(
    results: Obj,
  ): Result<{[Prop in keyof Obj]: Value<Obj[Prop]>}, F> {
    const successes: any = {}
    for (const [k, v] of Object.entries(results)) {
      switch (v.type) {
        case "success":
          successes[k] = v.value
          break
        case "failure":
          return v
        default:
          throw exhausted(v)
      }
    }
    return success(successes)
  }

  export const recover = function <T, F>(
    handle: (e: FailureResult<F>) => T,
  ): (r: Result<T, F>) => T {
    return (r) => {
      switch (r.type) {
        case "success":
          return r.value
        case "failure":
          return handle(r)
        default:
          throw exhausted(r)
      }
    }
  }

  export function mapFailure<T, FIn, FOut>(
    fn: (detail: FIn) => FOut,
  ): (r: Result<T, FIn>) => Result<T, FOut> {
    return (r) => {
      switch (r.type) {
        case "success":
          return r
        case "failure":
          return failure(fn(r.detail))
      }
    }
  }

  export function assert<T>(r: Result<T, any>): T {
    switch (r.type) {
      case "success":
        return r.value
      case "failure":
        throw r.detail
      default:
        throw exhausted(r)
    }
  }
}
