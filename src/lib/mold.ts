import {expect, equals, test} from "@benchristel/taste"
import {prop} from "./objects"
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
  expected: MoldType
  path: Path
}
type Path = Array<string | number>
type MoldType =
  | {type: "string"}
  | {type: "array"}
  | {type: "struct"}
  | {type: "either"; options: Array<MoldType>}

test("Mold.string", {
  "casts a string"() {
    const result: Cast<string> = Mold.string("hello", [])
    expect(result, equals, success("hello"))
  },

  "fails to cast a number"() {
    const result = Mold.string(3, ["a-path-component"])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 3},
          expected: {type: "string"},
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
    const result = stringArray(["one", 99], [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 99},
          expected: {type: "string"},
          path: [1],
        },
      ] as CastFailure),
    )
  },

  "reports multiple mismatched values"() {
    const stringArray = Mold.array(Mold.string)
    const result = stringArray(["one", 99, "two", 299], [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 99},
          expected: {type: "string"},
          path: [1],
        },
        {
          actual: {type: "atom", value: 299},
          expected: {type: "string"},
          path: [3],
        },
      ] as CastFailure),
    )
  },

  "fails on a non-array"() {
    const stringArray = Mold.array(Mold.string)
    const result = stringArray({}, [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "object"},
          expected: {type: "array"},
          path: [],
        },
      ]),
    )
  },

  "works on arrays of arrays"() {
    const arrayOfArraysOfStrings = Mold.array(Mold.array(Mold.string))
    const result = arrayOfArraysOfStrings(
      [["one"], ["two", "three"]],
      [],
    )
    expect(result, equals, success([["one"], ["two", "three"]]))
  },

  "fails on an arrays of arrays with mismatched values"() {
    const arrayOfArraysOfStrings = Mold.array(Mold.array(Mold.string))
    const result = arrayOfArraysOfStrings(
      [["one"], [99, "three", 199], 299],
      [],
    )
    expect(
      result,
      equals,
      failure([
        {
          expected: {type: "string"},
          actual: {type: "atom", value: 99},
          path: [1, 0],
        },
        {
          expected: {type: "string"},
          actual: {type: "atom", value: 199},
          path: [1, 2],
        },
        {
          expected: {type: "array"},
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
    const result = structMold({foo: "a", bar: "b"}, [])
    expect(result, equals, success({foo: "a", bar: "b"}))
  },

  "fails on an object with a missing property"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result = structMold({foo: "a"}, [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: undefined},
          expected: {type: "string"},
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
    const result = structMold({foo: "a", bar: 99}, [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 99},
          expected: {type: "string"},
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
    const result = structMold({foo: "a", bar: "b", baz: "c"}, [])
    expect(result, equals, success({foo: "a", bar: "b", baz: "c"}))
  },

  "fails on null"() {
    const structMold = Mold.struct({
      foo: Mold.string,
      bar: Mold.string,
    })
    const result = structMold(null, [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: null},
          expected: {type: "struct"},
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
    const result = structMold([], [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "array"},
          expected: {type: "struct"},
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
    const result = structMold("bork", [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "string", value: "bork"},
          expected: {type: "struct"},
          path: [],
        },
      ]),
    )
  },

  "succeeds recursively"() {
    const structMold = Mold.struct({
      foo: Mold.struct({bar: Mold.string}),
    })
    const result = structMold({foo: {bar: "a"}}, [])
    expect(result, equals, success({foo: {bar: "a"}}))
  },

  "fails recursively"() {
    const structMold = Mold.struct({
      foo: Mold.struct({bar: Mold.string}),
    })
    const result = structMold({foo: {bar: null}}, [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: null},
          expected: {type: "string"},
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
          expected: {type: "string"},
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
          expected: {type: "string"},
          actual: {type: "atom", value: 99},
          path: ["foo"],
        },
      ]),
    )
  },
})

test("Mold.either", {
  "forbids any value when no options are given"() {
    const neverMold = Mold.either()
    const result = neverMold("something", [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "string", value: "something"},
          expected: {type: "either", options: []},
          path: [],
        },
      ]),
    )
  },

  "allows a value that matches the only option"() {
    const stringMold = Mold.either(Mold.string)
    const result = stringMold("something", [])
    expect(result, equals, success("something"))
  },

  "allows a value that matches the first option"() {
    const arrayOrStringMold = Mold.either(
      Mold.array(Mold.string),
      Mold.string,
    )
    const result = arrayOrStringMold(["one", "two"], [])
    expect(result, equals, success(["one", "two"]))
  },

  "allows a value that matches the second option"() {
    const arrayOrStringMold = Mold.either(
      Mold.array(Mold.string),
      Mold.string,
    )
    const result = arrayOrStringMold("something", [])
    expect(result, equals, success("something"))
  },

  "forbids a value that matches none of the options"() {
    const arrayOrStringMold = Mold.either(
      Mold.array(Mold.string),
      Mold.string,
    )
    const result = arrayOrStringMold(99, [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 99},
          expected: {
            type: "either",
            options: [{type: "array"}, {type: "string"}],
          },
          path: [],
        },
      ]),
    )
  },
})

export namespace Mold {
  export const string: Mold<string> = (value: unknown, path: Path) =>
    typeof value === "string"
      ? success(value)
      : failure([
          {expected: {type: "string"}, actual: diagnose(value), path},
        ])

  export function array<T>(elementMold: Mold<T>): Mold<Array<T>> {
    return (value, path) => {
      if (!Array.isArray(value)) {
        return failedToCast(value, {type: "array"}, path)
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
        return failedToCast(value, {type: "struct"}, path)
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

  export function either(): Mold<never>
  export function either<A>(a: Mold<A>): Mold<A>
  export function either<A, B>(a: Mold<A>, b: Mold<B>): Mold<A | B>
  export function either<A, B, C>(
    a: Mold<A>,
    b: Mold<B>,
    c: Mold<C>,
  ): Mold<A | B | C>
  export function either<T>(...options: Array<Mold<T>>): Mold<T> {
    return (value, path) => {
      const optionsConsidered: Array<MoldType> = []
      for (const option of options) {
        const attempt = option(value, path)
        switch (attempt.type) {
          case "success":
            return attempt
          case "failure":
            optionsConsidered.push(
              ...attempt.detail.map(prop("expected")),
            )
        }
      }
      return failure([
        {
          actual: diagnose(value),
          expected: {type: "either", options: optionsConsidered},
          path: path,
        } as Mismatch,
      ])
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
