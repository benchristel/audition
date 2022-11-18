import {test, expect, equals, not, which} from "@benchristel/taste"
import {Expression} from "./expression"
import {error, success, Result} from "./lib/result"
import {parseCsv} from "./lib/csv"
import {empty, setDiff} from "./lib/indexables"
import {matches} from "./lib/strings"

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
  "fails given an empty string"() {
    expect(parseLexicon(""), equals, error("missing header row"))
  },

  "fails given a blank string"() {
    expect(parseLexicon("   "), equals, error("missing header row"))
  },

  "fails given empty lines"() {
    expect(parseLexicon("\n\n"), equals, error("missing header row"))
  },

  "fails given a header that's missing all required columns"() {
    expect(
      parseLexicon("invalid"),
      equals(error("missing header columns: id, translation, generator")),
    )
  },

  "fails given a header that's missing one required column"() {
    expect(
      parseLexicon("id,generator"),
      equals(error("missing header columns: translation")),
    )
  },

  "succeeds given a header with all required columns"() {
    expect(
      parseLexicon("id,translation,generator"),
      equals(success({
        columnOrder: ["id", "translation", "generator"],
        lexemes: [],
      })),
    )
  },

  "allows user-defined columns"() {
    expect(
      parseLexicon("foobar,id,translation,baz,generator,kludge"),
      equals(success({
        columnOrder: ["foobar", "id", "translation", "baz", "generator", "kludge"],
        lexemes: [],
      })),
    )
  },

  "allows quoted column headers"() {
    expect(
      parseLexicon(`"id","translation","generator"`),
      equals(success({
        columnOrder: ["id", "translation", "generator"],
        lexemes: [],
      })),
    )
  },
})

function parseLexicon(raw: string): Result<Lexicon> {
  return Result.flatMap((rows: Array<Array<string>>) => {
    const [headerRow, ...dataRows] = rows.filter(not(emptyRow))
    if (headerRow == null) {
      return error("missing header row")
    }

    const missingHeaders = setDiff(REQUIRED_COLUMNS, headerRow)
    if (!empty(missingHeaders)) {
      return error(`missing header columns: ${missingHeaders.join(", ")}`)
    }
    
    return success({
      columnOrder: headerRow,
      lexemes: [],
    })
  })(parseCsv(raw))
}

test("emptyRow", {
  "is true for a row with one empty cell"() {
    expect([""], emptyRow)
  },

  "is false for a row with two empty cells"() {
    expect(["", ""], not(emptyRow))
  },

  "is true for a row with one blank cell"() {
    expect([" \t"], emptyRow)
  },

  "is false for a row with one non-blank cell"() {
    expect([" foo "], not(emptyRow))
  },
})

function emptyRow(row: Array<string>): boolean {
  return equals([which(matches(/^\s*$/))], row)
}
