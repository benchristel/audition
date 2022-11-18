import {test, expect, equals} from '@benchristel/taste'

export type Result<T> =
  | SuccessResult<T>
  | ErrorResult

export type SuccessResult<T> = {type: "success", value: T}
export type ErrorResult = {type: "error", message: string}

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
    expect(
      rInc(success(3)),
      equals(success(4)),
    )
  },

  "passes an error through"() {
    const inc = (n: number) => n + 1
    const rInc = Result.map(inc)
    expect(
      rInc(error("oops")),
      equals(error("oops")),
    )
  }
})

test("Result.flatMap returns a function that", {
  "transforms a success"() {
    const reciprocal = (x: number) => 
      x === 0
        ? error("can't divide by 0")
        : success(1 / x)
    const rReciprocal = Result.flatMap(reciprocal)
    expect(
      rReciprocal(success(4)),
      equals(success(0.25)),
    )
  },

  "transforms success into failure"() {
    const reciprocal = (x: number) => 
      x === 0
        ? error("can't divide by 0")
        : success(1 / x)
    const rReciprocal = Result.flatMap(reciprocal)
    expect(
      rReciprocal(success(0)),
      equals(error("can't divide by 0")),
    )
  },

  "passes an error through"() {
    const fail = () => error("this should be ignored")
    expect(
      Result.flatMap(fail)(error("oops")),
      equals(error("oops")),
    )
  },
})


export namespace Result {
  export const map: <I, O>(f: (arg: I) => O) => (result: Result<I>) => Result<O>
    = (f) => {
      return (r) => {
        switch (r.type) {
          case "success": return success(f(r.value))
          case "error": return r
        }
      }
  }

  export const flatMap: <I, O>(f: (arg: I) => Result<O>) => (result: Result<I>) => Result<O>
    = (f) => {
      return (r) => {
        switch (r.type) {
          case "success": return f(r.value)
          case "error": return r
        }
      }
    }
}
