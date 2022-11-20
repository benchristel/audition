import {test, expect, equals} from "@benchristel/taste"

export type Result<T> = SuccessResult<T> | ErrorResult

export type SuccessResult<T> = {type: "success"; value: T}
export type ErrorResult = {type: "error"; message: string}

export function success<T>(value: T): SuccessResult<T> {
  return {type: "success", value}
}

export function error(message: string): ErrorResult {
  return {type: "error", message}
}

test("Result.map returns a function that", {
  "transforms a success"() {
    const inc = (n: number) => n + 1
    const rInc = Result.map(inc)
    expect(rInc(success(3)), equals(success(4)))
  },

  "passes an error through"() {
    const inc = (n: number) => n + 1
    const rInc = Result.map(inc)
    expect(rInc(error("oops")), equals(error("oops")))
  },
})

test("Result.flatMap returns a function that", {
  "transforms a success"() {
    const reciprocal = (x: number) =>
      x === 0 ? error("can't divide by 0") : success(1 / x)
    const rReciprocal = Result.flatMap(reciprocal)
    expect(rReciprocal(success(4)), equals(success(0.25)))
  },

  "transforms success into failure"() {
    const reciprocal = (x: number) =>
      x === 0 ? error("can't divide by 0") : success(1 / x)
    const rReciprocal = Result.flatMap(reciprocal)
    expect(
      rReciprocal(success(0)),
      equals(error("can't divide by 0")),
    )
  },

  "passes an error through"() {
    const fail = () => error("this should be ignored")
    expect(Result.flatMap(fail)(error("oops")), equals(error("oops")))
  },
})

test("Result.objAll", {
  "is typesafe"() {
    const a: Result<{a: number; b: string}> = Result.objAll({
      a: success(1),
      b: error("uh oh"),
    })
    // @ts-expect-error
    const b: Result<{a: string; b: string}> = Result.objAll({
      a: success(1),
      b: error("uh oh"),
    })
  },
})

export namespace Result {
  export type Value<T extends Result<any>> = Extract<
    T,
    {type: "success"}
  >["value"]

  export const map: <I, O>(
    f: (arg: I) => O,
  ) => (result: Result<I>) => Result<O> = (f) => {
    return (r) => {
      switch (r.type) {
        case "success":
          return success(f(r.value))
        case "error":
          return r
      }
    }
  }

  export const flatMap: <I, O>(
    f: (arg: I) => Result<O>,
  ) => (result: Result<I>) => Result<O> = (f) => {
    return (r) => {
      switch (r.type) {
        case "success":
          return f(r.value)
        case "error":
          return r
      }
    }
  }

  export function all<T>(
    results: Array<Result<T>>,
  ): Result<Array<T>> {
    const successes = []
    for (const r of results) {
      if (r.type === "success") {
        successes.push(r.value)
      } else {
        return r
      }
    }
    return success(successes)
  }

  export function objAll<T extends {[key: string]: Result<any>}>(
    results: T,
  ): Result<{[Property in keyof T]: Value<T[Property]>}> {
    const successes: any = {}
    for (const [k, v] of Object.entries(results)) {
      if (v.type === "success") {
        successes[k] = v.value
      } else {
        return v
      }
    }
    return success(successes)
  }
}
