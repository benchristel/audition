import {expect, equals, test} from "@benchristel/taste"
import {M} from "./maybe"
import {failure, FailureResult, Result, success} from "./result"

type Mold<T> = (value: unknown) => Result<T, string>

test("Mold.string", {
  "casts a string"() {
    const result: Result<string, string> = Mold.string("hello")
    expect(result, equals, success("hello"))
  },

  "fails to cast a number"() {
    const result: Result<string, string> = Mold.string(3)
    expect(result, equals, failure("can't cast 3 to string"))
  },
})

test("Mold.array", {
  "casts an array of strings"() {
    const result: Result<Array<string>, string> = Mold.array(
      Mold.string,
    )(["one", "two"])
    expect(result, equals, success(["one", "two"]))
  },

  "fails on an array of mismatched values"() {
    const result: Result<Array<string>, string> = Mold.array(
      Mold.string,
    )(["one", 99])
    expect(
      result,
      equals,
      failure("at index 1: can't cast 99 to string"),
    )
  },

  "fails on a non-array"() {
    const result: Result<Array<string>, string> = Mold.array(
      Mold.string,
    )({})
    expect(result, equals, failure("can't cast object to array"))
  },

  "works on arrays of arrays"() {
    const arrayOfArraysOfStrings = Mold.array(Mold.array(Mold.string))
    const result: Result<
      Array<Array<string>>,
      string
    > = arrayOfArraysOfStrings([["one"], ["two", "three"]])
    expect(result, equals, success([["one"], ["two", "three"]]))
  },

  "fails on an arrays of arrays with mismatched values"() {
    const arrayOfArraysOfStrings = Mold.array(Mold.array(Mold.string))
    const result: Result<
      Array<Array<string>>,
      string
    > = arrayOfArraysOfStrings([["one"], [99, "three"]])
    expect(
      result,
      equals,
      failure("at index 1: at index 0: can't cast 99 to string"),
    )
  },
})

test("Mold.struct", {
  "casts an object with the specified properties"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Result<{foo: string; bar: string}, string> =
      structMold({
        foo: "a",
        bar: "b",
      })
    expect(result, equals, success({foo: "a", bar: "b"}))
  },

  "fails on an object with a missing property"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Result<{foo: string; bar: string}, string> =
      structMold({
        foo: "a",
      })
    expect(
      result,
      equals,
      failure("at property bar: can't cast undefined to string"),
    )
  },

  "fails on an object with a property that has the wrong type"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Result<{foo: string; bar: string}, string> =
      structMold({
        foo: "a",
        bar: 99,
      })
    expect(
      result,
      equals,
      failure("at property bar: can't cast 99 to string"),
    )
  },

  "succeeds on an object with an extra property"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Result<{foo: string; bar: string}, string> =
      structMold({
        foo: "a",
        bar: "b",
        baz: "c",
      })
    expect(result, equals, success({foo: "a", bar: "b", baz: "c"}))
  },

  "fails on null"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Result<{foo: string; bar: string}, string> =
      structMold(null)
    expect(result, equals, failure("can't cast null to struct"))
  },

  "fails on an array"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Result<{foo: string; bar: string}, string> =
      structMold([])
    expect(result, equals, failure("can't cast array to struct"))
  },

  "fails on a non-object"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Result<{foo: string; bar: string}, string> =
      structMold("bork")
    expect(result, equals, failure("can't cast bork to struct"))
  },

  "succeeds recursively"() {
    const structMold = Mold.struct({
      foo: Mold.struct({bar: Mold.string}),
    })
    const result: Result<{foo: {bar: string}}, string> = structMold({
      foo: {bar: "a"},
    })
    expect(result, equals, success({foo: {bar: "a"}}))
  },

  "fails recursively"() {
    const structMold = Mold.struct({
      foo: Mold.struct({bar: Mold.string}),
    })
    const result: Result<{foo: {bar: string}}, string> = structMold({
      foo: {bar: null},
    })
    expect(
      result,
      equals,
      failure(
        "at property foo: at property bar: can't cast null to string",
      ),
    )
  },
})

test("Mold.optional", {
  "succeeds on null"() {
    const result = Mold.optional(Mold.string)(null)
    expect(result, equals, success(null))
  },

  "succeeds on undefined"() {
    const result = Mold.optional(Mold.string)(undefined)
    expect(result, equals, success(undefined))
  },

  "succeeds on a value matching the type"() {
    const result = Mold.optional(Mold.string)("foo")
    expect(result, equals, success("foo"))
  },

  "fails on a value that doesn't match the type"() {
    const result = Mold.optional(Mold.string)(99)
    expect(result, equals, failure("can't cast 99 to string"))
  },

  "can be used to make struct properties optional"() {
    const structMold = Mold.struct({foo: Mold.optional(Mold.string)})
    const result = structMold({})
    expect(result, equals, success({}))
  },
})

export namespace Mold {
  export const string: Mold<string> = (value) =>
    typeof value === "string"
      ? success(value)
      : failedToCast(value, "string")

  export function array<T>(contents: Mold<T>): Mold<Array<T>> {
    return (value) => {
      if (!Array.isArray(value)) {
        return failedToCast(value, "array")
      }
      for (let i = 0; i < value.length; i++) {
        const result = contents(value[i])
        if (result.type === "failure") {
          return prefixError(result, `at index ${i}:`)
        }
      }
      return success(value)
    }
  }

  export function struct<T extends {}>(shape: {
    [P in keyof T]: Mold<T[P]>
  }): Mold<T> {
    return (value) => {
      if (typeof value !== "object" || value == null) {
        return failedToCast(value, "struct")
      }
      if (Array.isArray(value)) {
        return failedToCast(value, "struct")
      }
      for (const [k, mold] of Object.entries(shape)) {
        // @ts-ignore-error
        const result = mold(value[k])
        if (result.type === "failure") {
          return prefixError(result, `at property ${k}:`)
        }
      }
      return success(value as any)
    }
  }

  export function optional<T>(shape: Mold<T>): Mold<M<T>> {
    return (value) => {
      if (value == null) {
        return success(value)
      }
      return shape(value)
    }
  }
}

function failedToCast(
  value: unknown,
  mold: string,
): FailureResult<string> {
  return failure(`can't cast ${describe(value)} to ${mold}`)

  function describe(value: unknown): string {
    if (value === null) return "null"
    if (Array.isArray(value)) return "array"
    if (typeof value === "object") return "object"
    return String(value)
  }
}

function prefixError(
  e: FailureResult<string>,
  prefix: string,
): FailureResult<string> {
  return failure(prefix + " " + e.detail)
}
