import {expect, is, test} from "@benchristel/taste"
import {Lexeme} from "./lexicon"
import "./gloss"

type TranslateFn = (gloss: string) => string
;() => Translator as (l: Array<Lexeme>) => TranslateFn

test("a Translator", {
  "leaves unrecognized words untranslated"() {
    const translate = Translator([])
    expect(translate("dog"), is, "dog")
  },

  "translates a lexeme id into its translation"() {
    const translate = Translator([lexeme("dog", "kanu")])
    expect(translate("dog"), is, "kanu")
  },

  "can translate from a lexicon with multiple words"() {
    const translate = Translator([
      lexeme("dog", "kanu"),
      lexeme("bird", "aiwe"),
      lexeme("stone", "pedra"),
    ])
    expect(translate("dog"), is, "kanu")
    expect(translate("bird"), is, "aiwe")
    expect(translate("stone"), is, "pedra")
  },

  "when lexemes have non-unique IDs"() {
    const translate = Translator([
      lexeme("dog", "kanu"),
      lexeme("dog", "aiwe"),
      lexeme("dog", "pedra"),
    ])
    expect(translate("dog"), isIn, ["kanu", "aiwe", "pedra"])
  },

  "follows pointers"() {
    // TODO make this pass
    return
    const translate = Translator([
      lexeme("dog", "kanu"),
      lexeme("hound", "*dog"),
    ])
    expect(translate("hound"), is, "kanu")
  },
})

function Translator(lexemes: Array<Lexeme>): TranslateFn {
  return (gloss: string) =>
    lexemes.find((l) => l.id === gloss)?.translation ?? gloss
}

function lexeme(id: string, translation: string): Lexeme {
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
