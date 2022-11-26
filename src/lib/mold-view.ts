import {expect, test, is} from "@benchristel/taste"
import {exhausted} from "./exhaust"
import {CastFailure, Mismatch, Path} from "./mold"
import {FailureResult} from "./result"

export function viewCastFailure(failure: CastFailure): string {
  return failure.map(viewMismatch).join("\n")
}

test("viewMismatch", {
  renders() {
    const mismatch: Mismatch = {
      actual: {type: "atom", value: 99},
      expected: {type: "string"},
      path: ["foo", 42, "bar"],
    }
    expect(
      viewMismatch(mismatch),
      is(`expected $.foo[42].bar to be a string, but got 99`),
    )
  },
})

function viewMismatch(mismatch: Mismatch): string {
  return `expected $${renderPath(mismatch.path)} to be ${viewExpected(
    mismatch.expected,
  )}, but got ${viewActual(mismatch.actual)}`
}

test("viewActual", {
  "renders a number"() {
    expect(viewActual({type: "atom", value: 99}), is, "99")
  },

  "renders null"() {
    expect(viewActual({type: "atom", value: null}), is, "null")
  },

  "renders undefined"() {
    expect(
      viewActual({type: "atom", value: undefined}),
      is("undefined"),
    )
  },

  "renders a boolean"() {
    expect(viewActual({type: "atom", value: false}), is, "false")
  },

  "renders a string"() {
    expect(viewActual({type: "string", value: "yo"}), is, `"yo"`)
  },

  "renders a string with internal quotes"() {
    expect(viewActual({type: "string", value: '"'}), is, '"\\""')
  },

  "renders 'an array' for an array"() {
    expect(viewActual({type: "array"}), is, "an array")
  },

  "renders 'an object' for an object"() {
    expect(viewActual({type: "object"}), is, "an object")
  },
})

function viewActual(actual: Mismatch["actual"]): string {
  switch (actual.type) {
    case "atom":
      return String(actual.value)
    case "string":
      return JSON.stringify(actual.value)
    case "array":
      return "an array"
    case "object":
      return "an object"
    default:
      throw exhausted(actual)
  }
}

test("viewPath", {
  "renders an array index in brackets"() {
    expect(renderPath([123]), is, "[123]")
  },

  "renders an object property with a dot"() {
    expect(renderPath(["foo"]), is, ".foo")
  },

  "renders a path with multiple segments"() {
    expect(renderPath(["foo", 42, "bar"]), is, ".foo[42].bar")
  },
})

function renderPath(path: Path): string {
  return path
    .map((segment) => {
      switch (typeof segment) {
        case "number":
          return `[${segment}]`
        case "string":
          return `.${segment}`
      }
    })
    .join("")
}

test("viewExpected", {
  "when a string was expected"() {
    expect(viewExpected({type: "string"}), is, "a string")
  },

  "when an array was expected"() {
    expect(viewExpected({type: "array"}), is, "an array")
  },

  "when a struct object was expected"() {
    expect(viewExpected({type: "struct"}), is, "an object")
  },

  "when a tuple was expected"() {
    expect(
      viewExpected({type: "tuple", elements: 3}),
      is,
      "an array with 3 elements",
    )
  },

  "when a map was expected"() {
    expect(viewExpected({type: "map"}), is, "an object")
  },

  "when one of a set of alternatives was expected"() {
    expect(
      viewExpected({
        type: "either",
        options: [
          {type: "string"},
          {type: "array"},
          {type: "struct"},
        ],
      }),
      is,
      "a string, an array, or an object",
    )
  },
})

function viewExpected(expected: Mismatch["expected"]): string {
  switch (expected.type) {
    case "string":
      return "a string"
    case "array":
      return "an array"
    case "map":
    case "struct":
      return "an object"
    case "tuple":
      return `an array with ${expected.elements} elements`
    case "either":
      return conjoin("or", expected.options.map(viewExpected))
    default:
      throw exhausted(expected)
  }
}

test("conjoin", {
  "returns empty when no conjoints"() {
    expect(conjoin("&", []), is, "")
  },

  "returns a single conjoint"() {
    expect(conjoin("&", ["frog"]), is, "frog")
  },

  "conjoins"() {
    expect(conjoin("&", ["frog", "suit"]), is, "frog & suit")
  },

  "commatizes"() {
    expect(
      conjoin("&", ["frog", "suit", "violin"]),
      is,
      "frog, suit, & violin",
    )
    expect(
      conjoin("&", ["bear", "frog", "suit", "violin"]),
      is,
      "bear, frog, suit, & violin",
    )
  },
})

function conjoin(
  conjunction: string,
  args: Array<string>,
  oxfordComma: string = "",
): string {
  switch (args.length) {
    case 0:
      return ""
    case 1:
      return args[0]
    case 2:
      return `${args[0]}${oxfordComma} ${conjunction} ${args[1]}`
    default: {
      const [first, ...rest] = args
      return first + ", " + conjoin(conjunction, rest, ",")
    }
  }
}
