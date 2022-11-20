import {expect, is, test} from "@benchristel/taste"
import {Lexeme} from "./lexicon"
import {_} from "./lib/functions"
import {M, Maybe} from "./lib/maybe"
import {Gloss, literal, pointer} from "./gloss"
import {prop} from "./lib/objects"

type TranslateFn = (gloss: string) => string
;() => Translator as (l: Array<Lexeme>) => TranslateFn

test("a Translator", {
  "leaves unrecognized words untranslated"() {
    const translate = Translator([])
    expect(translate("dog"), is, "dog")
  },

  "translates a lexeme id into its translation"() {
    const translate = Translator([lexeme("dog", literal("kanu"))])
    expect(translate("dog"), is, "kanu")
  },

  "can translate from a lexicon with multiple words"() {
    const translate = Translator([
      lexeme("dog", literal("kanu")),
      lexeme("bird", literal("aiwe")),
      lexeme("stone", literal("pedra")),
    ])
    expect(translate("dog"), is, "kanu")
    expect(translate("bird"), is, "aiwe")
    expect(translate("stone"), is, "pedra")
  },

  "when lexemes have non-unique IDs"() {
    const translate = Translator([
      lexeme("dog", literal("kanu")),
      lexeme("dog", literal("aiwe")),
      lexeme("dog", literal("pedra")),
    ])
    expect(translate("dog"), isIn, ["kanu", "aiwe", "pedra"])
  },

  "follows pointers"() {
    const translate = Translator([
      lexeme("dog", literal("kanu")),
      lexeme("hound", pointer("dog")),
    ])
    expect(translate("hound"), is, "kanu")
  },
})

function Translator(lexemes: Array<Lexeme>): TranslateFn {
  return (gloss: string) => lookUp(gloss) ?? gloss

  function lookUp(gloss: string): M<string> {
    return _(
      lexemes.find((l) => l.id === gloss),
      Maybe.map(prop("translation")),
      Maybe.map(evaluate),
    )
  }

  function evaluate(gloss: Gloss): string {
    switch (gloss.type) {
      case "literal":
        return gloss.string
      case "pointer":
        return lookUp(gloss.lexeme) ?? "FIXME"
      default:
        return "FIXME"
    }
  }
}

function lexeme(id: string, translation: Gloss): Lexeme {
  return {
    id,
    translation,
    generator: "",
    userColumns: [],
  }
}

function isIn<T>(haystack: Array<T>, needle: T): boolean {
  return haystack.includes(needle)
}
