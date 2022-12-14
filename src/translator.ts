import {expect, is, test} from "@benchristel/taste"
import {LexiconIndex} from "./lexicon"
import {_} from "./lib/functions"
import {Maybe} from "./lib/maybe"
import {compound, Gloss, inflection, literal, pointer} from "./gloss"
import {get} from "./lib/objects"
import {exhausted} from "./lib/exhaust"
import {
  Morphology,
  replace,
  compound as makeCompound,
} from "./morphology"

export type TranslateFn = (gloss: Gloss) => string
;() => Translator as (lexiconIndex: LexiconIndex) => TranslateFn

test("a Translator", {
  "translates literals to themselves"() {
    const translate = Translator({})
    expect(translate(literal("foo")), is, "foo")
  },

  "leaves unrecognized words untranslated, and marks them"() {
    const translate = Translator({})
    expect(translate(pointer("dog")), is, "(dog??)")
  },

  "translates a pointer into its referent"() {
    const translate = Translator({dog: literal("kanu")})
    expect(translate(pointer("dog")), is, "kanu")
  },

  "can translate from a lexicon with multiple words"() {
    const translate = Translator({
      dog: literal("kanu"),
      bird: literal("aiwe"),
      stone: literal("pedra"),
    })
    expect(translate(pointer("dog")), is, "kanu")
    expect(translate(pointer("bird")), is, "aiwe")
    expect(translate(pointer("stone")), is, "pedra")
  },

  "follows pointers in the lexicon"() {
    const translate = Translator({
      dog: literal("kanu"),
      hound: pointer("dog"),
    })
    expect(translate(pointer("hound")), is, "kanu")
  },

  "compounds"() {
    const translate = Translator({
      bear: literal("arth"),
      dog: literal("kanu"),
    })
    const bearDog = compound([pointer("bear"), pointer("dog")])
    expect(translate(bearDog), is, "arthkanu")
  },

  "inflects"() {
    const translate = Translator(
      {
        bear: literal("arth"),
      },
      {
        inflections: {
          PL: replace(/$/, "ec"),
        },
        compound: makeCompound([]),
      },
    )
    expect(
      translate(inflection(pointer("bear"), ["PL"])),
      is,
      "arthec",
    )
  },

  "leaves unrecognized inflections unapplied, and marks them"() {
    const translate = Translator({
      bear: literal("arth"),
    })
    expect(
      translate(inflection(pointer("bear"), ["PL"])),
      is,
      "(arth#PL??)",
    )
  },

  "applies multiple inflections"() {
    const translate = Translator(
      {
        bear: literal("arth"),
      },
      {
        inflections: {
          PL: replace(/$/, "s"),
          DIM: replace(/$/, "ling"),
        },
        compound: makeCompound([]),
      },
    )
    expect(
      translate(inflection(pointer("bear"), ["DIM", "PL"])),
      is,
      "arthlings",
    )
  },

  "applies compounding rules"() {
    const translate = Translator(
      {
        bear: compound([
          literal("bru"),
          literal("weth"),
          literal("ar"),
        ]),
      },
      {
        inflections: {},
        compound: makeCompound([[/(u)$/, /^(w)/, "$1", "ff"]]),
      },
    )
    expect(translate(pointer("bear")), is, "bruffethar")
  },
})

export function Translator(
  lexiconIndex: LexiconIndex,
  morphology: Morphology = {
    inflections: {},
    compound: (a, b) => a + b,
  },
): TranslateFn {
  return function translate(gloss: Gloss): string {
    switch (gloss.type) {
      case "literal":
        return gloss.string
      case "pointer":
        return _(
          lexiconIndex,
          get(gloss.lexeme),
          Maybe.map(translate),
          Maybe.recover(untranslatable(gloss.lexeme)),
        )
      case "inflection":
        return gloss.inflections.reduce(
          (stem, inflection) =>
            _(morphology.inflections, get(inflection))?.(stem)?.[0] ??
            untranslatable(`${stem}#${inflection}`),
          translate(gloss.stem),
        )
      case "compound":
        if (gloss.elements.length === 0) return ""
        return gloss.elements
          .map(translate)
          .reduce(morphology.compound)
      default:
        throw exhausted(gloss)
    }
  }

  function untranslatable(s: string): string {
    return `(${s}??)`
  }
}
