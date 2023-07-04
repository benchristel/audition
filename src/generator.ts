import {curry, equals, expect, not, test} from "@benchristel/taste"
import {failure, Result, success} from "./lib/result"
// @ts-ignore-error
import ruleParser from "./generated/generator-rule-parser"
import {empty} from "./lib/indexables"
import {trimMargin} from "./lib/strings"
import {prop} from "./lib/objects"
import {WeightedRandomVariable} from "./lib/weighted-random-variable"
import {exhausted} from "./lib/exhaust"
import {debug} from "@benchristel/taste"
import {_} from "./lib/functions"
import {mulberry32} from "./lib/random"

export type WordGenerator = {
  [name: string]: Rule
}

type Rule = Array<Expansion>

type Expansion = {
  weight: number
  pattern: Array<Pointer | Literal>
}

type Pointer = {type: "pointer"; ruleName: string}
type Literal = {type: "literal"; text: string}

test("word generation", {
  works() {
    const src = trimMargin`
    default:
      [c][v]
      [v][c][v]
      [c][v][c]
      [v][c][v][c]
      [c][v][c][c][v]
      [c][v][c][v][c]
    
    c:
      m    n     ñ
      p b  t d   k g
      f v  s  sh     h
      w    r
    
    v:
      i   u
       e  o
         a
    `
    const generator = _(
      parseGenerator(src),
      Result.flatMap(compileGenerator(mulberry32(0xc0ffee))),
      Result.assert,
    )
    const words = []
    for (let i = 0; i < 4; i++) {
      words.push(generator())
    }
    expect(words, equals, ["vo", "neñto", "uma", "utesh"])
  },
})

test("parseGenerator", {
  "accepts an empty document"() {
    expect(parseGenerator(""), equals, success({} as WordGenerator))
  },

  "accepts a document with only whitespace"() {
    expect(
      parseGenerator("    \t\n\n\n\n"),
      equals,
      success({} as WordGenerator),
    )
  },

  "parses a single rule"() {
    expect(
      parseGenerator("word: blah"),
      equals,
      success({
        word: [expansion(1, [literal("blah")])],
      } as WordGenerator),
    )
  },

  "ignores surrounding whitespace"() {
    expect(
      parseGenerator(" \n\n\tword: blah    \n\n"),
      equals,
      success({
        word: [expansion(1, [literal("blah")])],
      } as WordGenerator),
    )
  },

  "parses multiple rules"() {
    expect(
      parseGenerator(trimMargin`
        consonant: t

        vowel: o
      `),
      equals,
      success({
        consonant: [expansion(1, [literal("t")])],
        vowel: [expansion(1, [literal("o")])],
      } as WordGenerator),
    )
  },

  "allows whitespace between the rule name and expansions"() {
    expect(
      parseGenerator(trimMargin`
        consonant:
          t

        vowel:
          o
      `),
      equals,
      success({
        consonant: [expansion(1, [literal("t")])],
        vowel: [expansion(1, [literal("o")])],
      } as WordGenerator),
    )
  },

  "allows EOL whitespace between rules"() {
    expect(
      parseGenerator(`a: a\n    \nb: b`),
      equals,
      success({
        a: [expansion(1, [literal("a")])],
        b: [expansion(1, [literal("b")])],
      } as WordGenerator),
    )
  },

  "allows many newlines between rules"() {
    expect(
      parseGenerator(`a: a\n\n\n\nb: b`),
      equals,
      success({
        a: [expansion(1, [literal("a")])],
        b: [expansion(1, [literal("b")])],
      } as WordGenerator),
    )
  },

  "parses a rule with multiple expansions"() {
    expect(
      parseGenerator(`a: foo bar baz`),
      equals,
      success({
        a: [
          expansion(1, [literal("foo")]),
          expansion(1, [literal("bar")]),
          expansion(1, [literal("baz")]),
        ],
      } as WordGenerator),
    )
  },

  "parses integer expansion weights"() {
    expect(
      parseGenerator(`a: 1*foo 2*bar 3*baz`),
      equals,
      success({
        a: [
          expansion(1, [literal("foo")]),
          expansion(2, [literal("bar")]),
          expansion(3, [literal("baz")]),
        ],
      } as WordGenerator),
    )
  },

  "parses decimal expansion weights"() {
    expect(
      parseGenerator(`a: 10.25*foo 2.5*bar 0.75*baz`),
      equals,
      success({
        a: [
          expansion(10.25, [literal("foo")]),
          expansion(2.5, [literal("bar")]),
          expansion(0.75, [literal("baz")]),
        ],
      } as WordGenerator),
    )
  },

  "parses expansions with multiple segments"() {
    expect(
      parseGenerator(`a: 3*[b][c]foo`),
      equals,
      success({
        a: [
          expansion(3, [pointer("b"), pointer("c"), literal("foo")]),
        ],
      } as WordGenerator),
    )
  },

  "fails with a parse error"() {
    expect(
      parseGenerator(`]]]`),
      equals,
      failure(`Expected a rule name but "]" found.`),
    )
  },
})

export function parseGenerator(
  raw: string,
): Result<WordGenerator, string> {
  const rules: {[name: string]: Rule} = {}
  try {
    raw
      .split(/([ \t\r]*\n){2,}/)
      .map((s) => s.trim())
      .filter(not(empty))
      .map((s) => ruleParser.parse(s))
      .forEach((rule) => (rules[rule.name] = rule.expansions))
  } catch (e: any) {
    return failure(e.message)
  }

  return success(rules)
}

test("compileGenerator", {
  "fails when a rule has no expansions"() {
    expect(
      compileGenerator(() => 0, {"the-rule": []}),
      equals,
      failure("Generator rule 'the-rule' lists no expansions"),
    )
  },
})

test("a compiled generator", {
  "generates text"() {
    const generator = Result.assert(
      compileGenerator(() => 0, {
        "the-rule": [expansion(1, [literal("foo")])],
      }),
    )
    expect(generator("the-rule"), equals, "foo")
  },

  "generates text from a pattern with multiple segments"() {
    const generator = Result.assert(
      compileGenerator(() => 0, {
        "rule-1": [expansion(1, [literal("foo"), pointer("rule-2")])],
        "rule-2": [expansion(1, [literal("bar")])],
      }),
    )
    expect(generator("rule-1"), equals, "foobar")
  },

  "uses the 'default' rule to generate if no rule name is specified"() {
    const generator = Result.assert(
      compileGenerator(() => 0, {
        "default": [expansion(1, [literal("foo")])],
        "not-default": [expansion(1, [literal("bar")])],
      }),
    )
    expect(generator(), equals, "foo")
  },

  "puts underscores around a missing rule name"() {
    const generator = Result.assert(
      compileGenerator(() => 0, {
        "the-rule": [expansion(1, [pointer("foo")])],
      }),
    )
    expect(generator("the-rule"), equals, "_foo_")
  },

  "generates words at random"() {
    let randomValue = 0
    const generator = Result.assert(
      compileGenerator(() => randomValue, {
        "the-rule": [
          expansion(1, [literal("foo")]),
          expansion(1, [literal("bar")]),
        ],
      }),
    )
    expect(generator("the-rule"), equals, "foo")
    randomValue = 0.999
    expect(generator("the-rule"), equals, "bar")
  },
})

export const compileGenerator = curry(
  (
    rng: () => number,
    data: WordGenerator,
  ): Result<(ruleName?: string) => string, string> => {
    const randomizers: {[ruleName: string]: () => Expansion} = {}
    for (const rule in data) {
      if (empty(data[rule])) {
        return failure(`Generator rule '${rule}' lists no expansions`)
      }
      randomizers[rule] = WeightedRandomVariable(
        data[rule],
        prop("weight"),
        rng,
      )
    }

    function generate(ruleName?: string): string {
      ruleName = ruleName || "default"
      const randomizer = randomizers[ruleName]
      if (randomizer == null) {
        return `_${ruleName}_`
      }
      return randomizer()
        .pattern.map((segment) => {
          switch (segment.type) {
            case "literal":
              return segment.text
            case "pointer":
              return generate(segment.ruleName)
            default:
              throw exhausted(segment)
          }
        })
        .join("")
    }

    return success(generate)
  },
  "compileGenerator",
)

function expansion(
  weight: number,
  pattern: Array<Pointer | Literal>,
): Expansion {
  return {weight, pattern}
}

function literal(text: string): Literal {
  return {type: "literal", text}
}

function pointer(ruleName: string): Pointer {
  return {type: "pointer", ruleName}
}
