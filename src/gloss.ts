import {expect, equals, test, which} from "@benchristel/taste"
// @ts-ignore
import GlossParser from "./generated/gloss-parser.js"
import {error, Result, success} from "./lib/result.js"
import {matches} from "./lib/strings"

const glossParser = GlossParser()

type Gloss =
  | {type: "literal"; string: string}
  | {type: "pointer"; lexeme: string}
  | {type: "inflection"; stem: Gloss; inflections: Array<string>}
  | {type: "compound"; elements: Array<Gloss>}
;() =>
  parseGloss as (
    mode: "implicit-pointers" | "implicit-literals",
    raw: string,
  ) => Result<Gloss>

test("parseGloss", {
  "parses a word"() {
    expect(
      parseGloss("implicit-literals", "foo"),
      equals,
      success({type: "literal", string: "foo"} as Gloss),
    )
  },

  "parses an implicit pointer"() {
    expect(
      parseGloss("implicit-pointers", "foo"),
      equals,
      success({type: "pointer", lexeme: "foo"} as Gloss),
    )
  },

  "accepts the empty string"() {
    expect(
      parseGloss("implicit-literals", ""),
      equals,
      success({type: "literal", string: ""} as Gloss),
    )
  },

  "parses an explicit pointer"() {
    expect(
      parseGloss("implicit-literals", "*foo"),
      equals,
      success({type: "pointer", lexeme: "foo"} as Gloss),
    )
  },

  "parses an explicit literal"() {
    expect(
      parseGloss("implicit-pointers", "^foo"),
      equals,
      success({type: "literal", string: "foo"} as Gloss),
    )
  },

  "inflects"() {
    expect(
      parseGloss("implicit-pointers", "see#PAST"),
      equals,
      success({
        type: "inflection",
        stem: {type: "pointer", lexeme: "see"},
        inflections: ["PAST"],
      } as Gloss),
    )
  },

  "applies multiple inflections"() {
    expect(
      parseGloss("implicit-pointers", "see#PAST#1SG"),
      equals,
      success({
        type: "inflection",
        stem: {type: "pointer", lexeme: "see"},
        inflections: ["PAST", "1SG"],
      } as Gloss),
    )
  },

  "compounds with implicit literals"() {
    expect(
      parseGloss("implicit-literals", "[pre+*see]"),
      equals,
      success({
        type: "compound",
        elements: [
          {type: "literal", string: "pre"},
          {type: "pointer", lexeme: "see"},
        ],
      } as Gloss),
    )
  },

  "compounds with implicit pointers"() {
    expect(
      parseGloss("implicit-pointers", "[^pre+see]"),
      equals,
      success({
        type: "compound",
        elements: [
          {type: "literal", string: "pre"},
          {type: "pointer", lexeme: "see"},
        ],
      } as Gloss),
    )
  },

  "combines compounding with inflection"() {
    expect(
      parseGloss("implicit-pointers", "[^pre+^hyen#INC+AGT]#PL"),
      equals,
      success({
        type: "inflection",
        stem: {
          type: "compound",
          elements: [
            {type: "literal", string: "pre"},
            {
              type: "inflection",
              stem: {type: "literal", string: "hyen"},
              inflections: ["INC"],
            },
            {type: "pointer", lexeme: "AGT"},
          ],
        },
        inflections: ["PL"],
      } as Gloss),
    )
  },

  "fails if there's a syntax error"() {
    expect(
      parseGloss("implicit-pointers", "[blah"),
      equals,
      error(which(matches(/Failed to parse "\[blah"/))),
    )
  },
})

function parseGloss(
  mode: "implicit-pointers" | "implicit-literals",
  s: string,
): Result<Gloss> {
  const startRule =
    mode === "implicit-pointers" ? "Gloss" : "Translation"
  try {
    return success(glossParser.parse(s, {startRule}))
  } catch (e: any) {
    return error(`Failed to parse "${s}": ` + e.message)
  }
}
