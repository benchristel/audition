import {expect, equals, test, which, is} from "@benchristel/taste"
// @ts-ignore
import GlossParser from "./generated/gloss-parser"
import {exhausted} from "./lib/exhaust"
import {failure, Result, success} from "./lib/result"
import {matches} from "./lib/strings"

const glossParser = GlossParser()

export type Gloss = Literal | Pointer | Inflection | Compound

export type Literal = {type: "literal"; string: string}
export type Pointer = {type: "pointer"; lexeme: string}
export type Inflection = {
  type: "inflection"
  stem: Gloss
  inflections: Array<string>
}
export type Compound = {type: "compound"; elements: Array<Gloss>}
;() => {
  parseGloss as (
    mode: "implicit-pointers" | "implicit-literals",
    raw: string,
  ) => Result<Gloss, string>
  serializeGloss as (
    mode: "implicit-pointers" | "implicit-literals",
    gloss: Gloss,
  ) => string
  literal as (s: string) => Literal
  pointer as (lexeme: string) => Pointer
  inflection as (
    stem: Gloss,
    inflections: Array<string>,
  ) => Inflection
  compound as (elements: Array<Gloss>) => Gloss
}

test("parseGloss", {
  "parses a word"() {
    expect(
      parseGloss("implicit-literals", "foo"),
      equals,
      success(literal("foo")),
    )
  },

  "parses an implicit pointer"() {
    expect(
      parseGloss("implicit-pointers", "foo"),
      equals,
      success(pointer("foo")),
    )
  },

  "accepts the empty string"() {
    expect(
      parseGloss("implicit-literals", ""),
      equals,
      success(literal("")),
    )
  },

  "parses an explicit pointer"() {
    expect(
      parseGloss("implicit-literals", "*foo"),
      equals,
      success(pointer("foo")),
    )
  },

  "parses an explicit literal"() {
    expect(
      parseGloss("implicit-pointers", "^foo"),
      equals,
      success(literal("foo")),
    )
  },

  "inflects"() {
    expect(
      parseGloss("implicit-pointers", "see#PAST"),
      equals,
      success(inflection(pointer("see"), ["PAST"])),
    )
  },

  "applies multiple inflections"() {
    expect(
      parseGloss("implicit-pointers", "see#PAST#1SG"),
      equals,
      success(inflection(pointer("see"), ["PAST", "1SG"])),
    )
  },

  "compounds with implicit literals"() {
    expect(
      parseGloss("implicit-literals", "[pre+*see]"),
      equals,
      success(compound([literal("pre"), pointer("see")])),
    )
  },

  "compounds with implicit pointers"() {
    expect(
      parseGloss("implicit-pointers", "[^pre+see]"),
      equals,
      success(compound([literal("pre"), pointer("see")])),
    )
  },

  "combines compounding with inflection"() {
    expect(
      parseGloss("implicit-pointers", "[^pre+^hyen#INC+AGT]#PL"),
      equals,
      success(
        inflection(
          compound([
            literal("pre"),
            inflection(literal("hyen"), ["INC"]),
            pointer("AGT"),
          ]),
          ["PL"],
        ),
      ),
    )
  },

  "fails if there's a syntax error"() {
    expect(
      parseGloss("implicit-pointers", "[blah"),
      equals,
      failure(which(matches(/Failed to parse "\[blah"/))),
    )
  },

  "accepts accented characters"() {
    expect(
      parseGloss("implicit-literals", "áèöŷś"),
      equals,
      success(literal("áèöŷś")),
    )
  },

  "ignores a leading ?"() {
    // Language authors can use ? to mark generated words, to
    // distinguish them from handcrafted ones.
    expect(
      parseGloss("implicit-literals", "?quack"),
      equals,
      success(literal("quack")),
    )
  },
})

export function parseGloss(
  mode: "implicit-pointers" | "implicit-literals",
  s: string,
): Result<Gloss, string> {
  const startRule =
    mode === "implicit-pointers"
      ? "GlossWithImplicitPointers"
      : "GlossWithImplicitLiterals"
  try {
    return success(glossParser.parse(s, {startRule}))
  } catch (e: any) {
    return failure(`Failed to parse "${s}": ` + e.message)
  }
}

test("serializeGloss", {
  "round-trips an implicit literal"() {
    roundTrip("implicit-literals", "foo")
  },

  "round-trips an explicit literal"() {
    roundTrip("implicit-pointers", "^foo")
  },

  "round-trips an implicit pointer"() {
    roundTrip("implicit-pointers", "foo")
  },

  "round-trips an explicit pointer"() {
    roundTrip("implicit-literals", "*foo")
  },

  "round-trips an inflected word"() {
    roundTrip("implicit-literals", "foo#bar#baz")
  },

  "round-trips a compound"() {
    roundTrip("implicit-literals", "[foo+bar+baz]")
  },
})

export function serializeGloss(
  mode: "implicit-pointers" | "implicit-literals",
  gloss: Gloss,
): string {
  switch (gloss.type) {
    case "literal":
      switch (mode) {
        case "implicit-literals":
          return gloss.string
        case "implicit-pointers":
          return `^${gloss.string}`
        default:
          throw exhausted(mode)
      }
    case "pointer":
      switch (mode) {
        case "implicit-literals":
          return `*${gloss.lexeme}`
        case "implicit-pointers":
          return gloss.lexeme
        default:
          throw exhausted(mode)
      }
    case "inflection": {
      const stem = serializeGloss(mode, gloss.stem)
      return `${stem}#${gloss.inflections.join("#")}`
    }
    case "compound": {
      const elements = gloss.elements
        .map((el) => serializeGloss(mode, el))
        .join("+")
      return `[${elements}]`
    }
    default:
      throw exhausted(gloss)
  }
}

export function literal(string: string): Literal {
  return {type: "literal", string}
}

export function pointer(lexeme: string): Pointer {
  return {type: "pointer", lexeme}
}

export function inflection(
  stem: Gloss,
  inflections: Array<string>,
): Inflection {
  return {type: "inflection", stem, inflections}
}

export function compound(elements: Array<Gloss>): Gloss {
  return {type: "compound", elements}
}

function roundTrip(
  mode: "implicit-pointers" | "implicit-literals",
  raw: string,
) {
  const result = serializeGloss(
    mode,
    Result.assert(parseGloss(mode, raw)),
  )
  expect(result, is, raw)
}
