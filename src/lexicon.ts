import {test, expect, equals, not} from "@benchristel/taste"
import {Expression} from "./expression"
import {error, success, Result} from "./result"

const REQUIRED_COLUMNS = ["id", "translation", "generator"]

export type Lexicon = {
  columnOrder: Array<string>,
  lexemes: Array<Lexeme>,
}

export type Lexeme = {
  id: string,
  translation: () => Expression,
  generator: string,
  userColumns: Array<string>,
}

test("parseLexicon", {
  "given an empty string"() {
    expect(parseLexicon(""), equals, error("missing header row"))
  },

  "given a blank string"() {
    expect(parseLexicon("   "), equals, error("missing header row"))
  },

  "given empty lines"() {
    expect(parseLexicon("\n\n"), equals, error("missing header row"))
  },

  "given a header that's missing all required columns"() {
    expect(
      parseLexicon("invalid"),
      equals(error("missing header columns: id, translation, generator")),
    )
  },

  "given a header that's missing one required column"() {
    expect(
      parseLexicon("id,generator"),
      equals(error("missing header columns: translation")),
    )
  },

  "given a header with all required columns"() {
    expect(
      parseLexicon("id,translation,generator"),
      equals(success({
        columnOrder: ["id", "translation", "generator"],
        lexemes: [],
      })),
    )
  },
})

function parseLexicon(raw: string): Result<Lexicon> {
  const lines = raw.split("\n")
    .map(trim)
    .filter(not(empty))

  if (empty(lines)) return error("missing header row")

  const [headerLine, ...dataLines] = lines
  // TODO: quoted headers
  const headerRow = headerLine.split(",")

  const missingHeaders = setDiff(REQUIRED_COLUMNS, headerRow)
  if (!empty(missingHeaders)) {
    return error(`missing header columns: ${missingHeaders.join(", ")}`)
  }
  
  return success({
    columnOrder: headerRow,
    lexemes: [],
  })
}

function trim(s: string): string {
  return s.trim()
}

function empty(s: string | Array<unknown>): boolean {
  return s.length === 0
}

function setDiff<T>(a: Array<T>, b: Array<T>): Array<T> {
  return a.filter(item => !b.includes(item))
}