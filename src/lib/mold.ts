import {expect, equals, test} from "@benchristel/taste"
import {validateHeaderValue} from "http"
import {type} from "os"
import {empty} from "./indexables"
import {M} from "./maybe"
import {failure, FailureResult, Result, success} from "./result"

type Mold<T> = (value: unknown, path: Path) => Cast<T>
type Cast<T> = Result<T, CastFailure>
type CastFailure = Array<Mismatch>
type Mismatch = {
  actual:
    | {type: "string"; value: string}
    | {type: "array"}
    | {type: "object"}
    | {type: "atom"; value: unknown}
  expected: "string" | "array" | "struct"
  path: Path
}
type Path = Array<string | number>

test("Mold.string", {
  "casts a string"() {
    const result: Cast<string> = Mold.string("hello", [])
    expect(result, equals, success("hello"))
  },

  "fails to cast a number"() {
    const result: Cast<string> = Mold.string(3, ["a-path-component"])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 3},
          expected: "string",
          path: ["a-path-component"],
        },
      ]),
    )
  },
})

test("Mold.array", {
  "casts an array of strings"() {
    const stringArray = Mold.array(Mold.string)
    const result: Cast<Array<string>> = stringArray(
      ["one", "two"],
      [],
    )
    expect(result, equals, success(["one", "two"]))
  },

  "fails on an array of mismatched values"() {
    const stringArray = Mold.array(Mold.string)
    const result: Cast<Array<string>> = stringArray(["one", 99], [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 99},
          expected: "string",
          path: [1],
        },
      ] as CastFailure),
    )
  },

  "reports multiple mismatched values"() {
    const stringArray = Mold.array(Mold.string)
    const result: Cast<Array<string>> = stringArray(
      ["one", 99, "two", 299],
      [],
    )
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 99},
          expected: "string",
          path: [1],
        },
        {
          actual: {type: "atom", value: 299},
          expected: "string",
          path: [3],
        },
      ] as CastFailure),
    )
  },

  "fails on a non-array"() {
    const stringArray = Mold.array(Mold.string)
    const result: Cast<Array<string>> = stringArray({}, [])
    expect(
      result,
      equals,
      failure([
        {actual: {type: "object"}, expected: "array", path: []},
      ]),
    )
  },

  "works on arrays of arrays"() {
    const arrayOfArraysOfStrings = Mold.array(Mold.array(Mold.string))
    const result: Cast<Array<Array<string>>> = arrayOfArraysOfStrings(
      [["one"], ["two", "three"]],
      [],
    )
    expect(result, equals, success([["one"], ["two", "three"]]))
  },

  "fails on an arrays of arrays with mismatched values"() {
    const arrayOfArraysOfStrings = Mold.array(Mold.array(Mold.string))
    const result: Cast<Array<Array<string>>> = arrayOfArraysOfStrings(
      [["one"], [99, "three", 199], 299],
      [],
    )
    expect(
      result,
      equals,
      failure([
        {
          expected: "string",
          actual: {type: "atom", value: 99},
          path: [1, 0],
        },
        {
          expected: "string",
          actual: {type: "atom", value: 199},
          path: [1, 2],
        },
        {
          expected: "array",
          actual: {type: "atom", value: 299},
          path: [2],
        },
      ]),
    )
  },
})

test("Mold.struct", {
  "casts an object with the specified properties"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Cast<{foo: string; bar: string}> = structMold(
      {
        foo: "a",
        bar: "b",
      },
      [],
    )
    expect(result, equals, success({foo: "a", bar: "b"}))
  },

  "fails on an object with a missing property"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Cast<{foo: string; bar: string}> = structMold(
      {
        foo: "a",
      },
      [],
    )
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: undefined},
          expected: "string",
          path: ["bar"],
        },
      ]),
    )
  },

  "fails on an object with a property that has the wrong type"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Cast<{foo: string; bar: string}> = structMold(
      {
        foo: "a",
        bar: 99,
      },
      [],
    )
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 99},
          expected: "string",
          path: ["bar"],
        },
      ]),
    )
  },

  "succeeds on an object with an extra property"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Cast<{foo: string; bar: string}> = structMold(
      {
        foo: "a",
        bar: "b",
        baz: "c",
      },
      [],
    )
    expect(result, equals, success({foo: "a", bar: "b", baz: "c"}))
  },

  "fails on null"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Cast<{foo: string; bar: string}> = structMold(
      null,
      [],
    )
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: null},
          expected: "struct",
          path: [],
        },
      ]),
    )
  },

  "fails on an array"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Cast<{foo: string; bar: string}> = structMold(
      [],
      [],
    )
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "array"},
          expected: "struct",
          path: [],
        },
      ]),
    )
  },

  "fails on a non-object"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result: Cast<{foo: string; bar: string}> = structMold(
      "bork",
      [],
    )
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "string", value: "bork"},
          expected: "struct",
          path: [],
        },
      ]),
    )
  },

  "succeeds recursively"() {
    const structMold = Mold.struct({
      foo: Mold.struct({bar: Mold.string}),
    })
    const result: Cast<{foo: {bar: string}}> = structMold(
      {
        foo: {bar: "a"},
      },
      [],
    )
    expect(result, equals, success({foo: {bar: "a"}}))
  },

  "fails recursively"() {
    const structMold = Mold.struct({
      foo: Mold.struct({bar: Mold.string}),
    })
    const result: Cast<{foo: {bar: string}}> = structMold(
      {
        foo: {bar: null},
      },
      [],
    )
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: null},
          expected: "string",
          path: ["foo", "bar"],
        },
      ]),
    )
  },
})

test("Mold.optional", {
  "succeeds on null"() {
    const result = Mold.optional(Mold.string)(null, [])
    expect(result, equals, success(null))
  },

  "succeeds on undefined"() {
    const result = Mold.optional(Mold.string)(undefined, [])
    expect(result, equals, success(undefined))
  },

  "succeeds on a value matching the type"() {
    const result = Mold.optional(Mold.string)("foo", [])
    expect(result, equals, success("foo"))
  },

  "fails on a value that doesn't match the type"() {
    const result = Mold.optional(Mold.string)(99, [])
    expect(
      result,
      equals,
      failure([
        {
          expected: "string",
          actual: {type: "atom", value: 99},
          path: [],
        },
      ]),
    )
  },

  "can be used to make struct properties optional"() {
    const structMold = Mold.struct({foo: Mold.optional(Mold.string)})
    const result = structMold({}, [])
    expect(result, equals, success({}))
  },

  "reflects the path in failures"() {
    const structMold = Mold.struct({foo: Mold.optional(Mold.string)})
    const result = structMold({foo: 99}, [])
    expect(
      result,
      equals,
      failure([
        {
          expected: "string",
          actual: {type: "atom", value: 99},
          path: ["foo"],
        },
      ]),
    )
  },
})

export namespace Mold {
  export const string: Mold<string> = (value: unknown, path: Path) =>
    typeof value === "string"
      ? success(value)
      : failure([{expected: "string", actual: diagnose(value), path}])

  export function array<T>(elementMold: Mold<T>): Mold<Array<T>> {
    return (value, path) => {
      if (!Array.isArray(value)) {
        return failedToCast(value, "array", path)
      }
      const mismatches = value
        .map((elem, i) => elementMold(elem, [...path, i]))
        .flatMap(getMismatches)
      return empty(mismatches) ? success(value) : failure(mismatches)
    }
  }

  export function struct<T extends {}>(shape: {
    [P in keyof T]: Mold<T[P]>
  }): Mold<T> {
    return (value, path): Cast<T> => {
      if (!isObjectObject(value)) {
        return failedToCast(value, "struct", path)
      }
      const mismatches = Object.entries(shape)
        // @ts-ignore-error
        .map(([k, valueMold]) => valueMold(value[k], [...path, k]))
        .flatMap(getMismatches)
      // @ts-ignore-error
      return empty(mismatches) ? success(value) : failure(mismatches)
    }
  }

  export function optional<T>(shape: Mold<T>): Mold<M<T>> {
    return (value, path) => {
      if (value == null) {
        return success(value)
      }
      return shape(value, path)
    }
  }
}

function failedToCast(
  value: unknown,
  expected: Mismatch["expected"],
  path: Path,
): FailureResult<CastFailure> {
  return failure([{expected, actual: diagnose(value), path}])
}

function prefixError(
  e: FailureResult<string>,
  prefix: string,
): FailureResult<string> {
  return failure(prefix + " " + e.detail)
}

function diagnose(value: unknown): Mismatch["actual"] {
  switch (typeof value) {
    case "string":
      return {type: "string", value}
    case "object":
      if (value === null) {
        return {type: "atom", value}
      } else if (Array.isArray(value)) {
        return {type: "array"}
      } else {
        return {type: "object"}
      }
    default:
      return {type: "atom", value}
  }
}

const getMismatches = <T>(result: Cast<T>) => {
  if (result.type === "failure") {
    return result.detail
  } else {
    return []
  }
}

function isObjectObject(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value != null &&
    !Array.isArray(value)
  )
}
