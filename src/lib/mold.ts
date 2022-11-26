import {expect, equals, test} from "@benchristel/taste"
import {prop} from "./objects"
import {empty} from "./indexables"
import {M} from "./maybe"
import {failure, FailureResult, Result, success} from "./result"

export type Mold<T> = (value: unknown, path: Path) => Cast<T>
export type Cast<T> = Result<T, CastFailure>
export type CastFailure = Array<Mismatch>
export type Mismatch = {
  actual:
    | {type: "string"; value: string}
    | {type: "array"}
    | {type: "object"}
    | {type: "atom"; value: unknown}
  expected: MoldType
  path: Path
}
export type Path = Array<string | number>
export type MoldType =
  | {type: "string"}
  | {type: "array"}
  | {type: "struct"}
  | {type: "either"; options: Array<MoldType>}
  | {type: "tuple"; elements: number}
  | {type: "map"}

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

test("Mold.tuple", {
  "accepts an empty array when the tuple type has no elements"() {
    const emptyTupleMold = Mold.tuple()
    const result = emptyTupleMold([], [])
    expect(result, equals, success([]))
  },

  "accepts values matching the tuple elements"() {
    const stringPairMold = Mold.tuple(Mold.string, Mold.string)
    const result = stringPairMold(["one", "two"], [])
    expect(result, equals, success(["one", "two"]))
  },

  "rejects a non-array"() {
    const tupleMold = Mold.tuple()
    const result = tupleMold({}, [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "object"},
          expected: {type: "tuple", elements: 0},
          path: [],
        },
      ]),
    )
  },

  "rejects a tuple with too few elements"() {
    const stringPairMold = Mold.tuple(Mold.string, Mold.string)
    const result = stringPairMold(["one"], [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "array"},
          expected: {type: "tuple", elements: 2},
          path: [],
        } as Mismatch,
      ]),
    )
  },

  "rejects a tuple with too many elements"() {
    const stringPairMold = Mold.tuple(Mold.string, Mold.string)
    const result = stringPairMold(["one", "two", "too many"], [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "array"},
          expected: {type: "tuple", elements: 2},
          path: [],
        } as Mismatch,
      ]),
    )
  },

  "rejects a tuple with the wrong elements"() {
    const stringPairMold = Mold.tuple(Mold.string, Mold.string)
    const result = stringPairMold(["one", 99], [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 99},
          expected: {type: "string"},
          path: [1],
        } as Mismatch,
      ]),
    )
  },

  "lists all mismatches"() {
    const stringPairMold = Mold.tuple(Mold.string, Mold.string)
    const result = stringPairMold([99, 199], [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 99},
          expected: {type: "string"},
          path: [0],
        } as Mismatch,
        {
          actual: {type: "atom", value: 199},
          expected: {type: "string"},
          path: [1],
        } as Mismatch,
      ]),
    )
  },

  "succeeds recursively"() {
    const mold = Mold.tuple(Mold.string, Mold.tuple(Mold.string))
    const result = mold(["one", ["two"]], [])
    expect(result, equals, success(["one", ["two"]]))
  },

  "fails recursively"() {
    const mold = Mold.tuple(Mold.string, Mold.tuple(Mold.string))
    const result = mold(["one", [99]], [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 99},
          expected: {type: "string"},
          path: [1, 0],
        } as Mismatch,
      ]),
    )
  },
})

test("Mold.map", {
  "accepts an empty object"() {
    const mapMold = Mold.map(Mold.string)
    const result = mapMold({}, [])
    expect(result, equals, success({}))
  },

  "rejects a non-object"() {
    const mapMold = Mold.map(Mold.string)
    const result = mapMold([], [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "array"},
          expected: {type: "map"},
          path: [],
        } as Mismatch,
      ]),
    )
  },

  "accepts an object with the right value type"() {
    const mapMold = Mold.map(Mold.string)
    const result = mapMold({foo: "one"}, [])
    expect(result, equals, success({foo: "one"}))
  },

  "rejects an object with the wrong value type"() {
    const mapMold = Mold.map(Mold.string)
    const result = mapMold({foo: 99}, [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 99},
          expected: {type: "string"},
          path: ["foo"],
        } as Mismatch,
      ]),
    )
  },

  "fails recursively"() {
    const mapMold = Mold.map(Mold.map(Mold.string))
    const result = mapMold({foo: {bar: 99}}, [])
    expect(
      result,
      equals,
      failure([
        {
          actual: {type: "atom", value: 99},
          expected: {type: "string"},
          path: ["foo", "bar"],
        } as Mismatch,
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

  export function tuple(): Mold<[]>
  export function tuple<A>(...elementMolds: [Mold<A>]): Mold<[A]>
  export function tuple<A, B>(
    ...elementMolds: [Mold<A>, Mold<B>]
  ): Mold<[A, B]>
  export function tuple<A, B, C>(
    ...elementMolds: [Mold<A>, Mold<B>, Mold<C>]
  ): Mold<[A, B, C]>
  export function tuple<A, B, C, D>(
    ...elementMolds: [Mold<A>, Mold<B>, Mold<C>, Mold<D>]
  ): Mold<[A, B, C, D]>
  export function tuple(...elementMolds: Array<any>) {
    return (value: unknown, path: Path) => {
      if (
        !Array.isArray(value) ||
        value.length !== elementMolds.length
      ) {
        return failedToCast(
          value,
          {type: "tuple", elements: elementMolds.length},
          path,
        )
      }
      const mismatches = elementMolds
        .map((mold, i) => mold(value[i], [...path, i]))
        .flatMap(getMismatches)
      return empty(mismatches) ? success(value) : failure(mismatches)
    }
  }

  export function map<T>(
    valueMold: Mold<T>,
  ): Mold<{[key: string]: T}> {
    return (value, path) => {
      if (!isObjectObject(value)) {
        return failedToCast(value, {type: "map"}, path)
      }
      const mismatches = Object.entries(value as {})
        .map(([k, v]) => valueMold(v, [...path, k]))
        .flatMap(getMismatches)
      return empty(mismatches)
        ? success(value as {})
        : failure(mismatches)
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
