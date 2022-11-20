import {expect, is, test} from "@benchristel/taste"
import {indexEntry, Lexeme, LexiconIndex} from "./lexicon"
import {_} from "./lib/functions"
import {M, Maybe} from "./lib/maybe"
import {Gloss, literal, pointer} from "./gloss"
import {prop} from "./lib/objects"

type TranslateFn = (gloss: Gloss) => string
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
})

function Translator(lexiconIndex: LexiconIndex): TranslateFn {
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
      default:
        return "FIXME"
    }
  }

  function untranslatable(s: string): string {
    return `(${s}??)`
  }
}

const get =
  (key: string) =>
  <V>(obj: {[key: string]: V}): M<V> => {
    return obj[key]
  }
