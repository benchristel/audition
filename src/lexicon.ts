import {test, expect, equals, not, which} from "@benchristel/taste"
import {error, success, Result} from "./lib/result"
import {parseCsv} from "./lib/csv"
import {empty, setDiff} from "./lib/indexables"
import {matches, trimMargin} from "./lib/strings"
import "./lib/functions"
import { _ } from "./lib/functions"

const REQUIRED_COLUMNS = ["id", "translation", "generator"]

export type Lexicon = {
  columnOrder: Array<string>,
  lexemes: Array<Lexeme>,
}

export type Lexeme = {
  id: string,
  translation: string,
  generator: string,
  userColumns: Array<string>,
}

;() => parseLexicon as (csv: string) => Result<Lexicon>

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

  "ignores blank lines"() {
    expect(
      parseLexicon(
        trimMargin`
          id,translation,generator


        `,
      ),
      equals(success({
        columnOrder: ["id", "translation", "generator"],
        lexemes: [],
      })),
    )
  },

  "parses a lexeme"() {
    const result = _(
      trimMargin`
        id,translation,generator
        foo,bar,baz`,
      parseLexicon,
      Result.map(l => l.lexemes)
    )

    const expected = success([{
      id: "foo",
      translation: "bar",
      generator: "baz",
      userColumns: [],
    }])

    expect(result, equals(expected))
  },

  "respects column order"() {
    // TODO: implement this
    const csvContent = trimMargin`
      translation,generator,id
      foo,bar,the-id`
    const result = _(
      csvContent,
      parseLexicon
    )
  }
})

function parseLexicon(raw: string): Result<Lexicon> {
  return _(
    parseCsv(raw),
    Result.flatMap((rows: Array<Array<string>>) => {
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
        lexemes: dataRows.map(([a, b, c]) => {
          return {
            id: a,
            translation: b,
            generator: c,
            userColumns: [],
          }
        }),
      })
    },
  ))
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
