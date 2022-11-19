import {
  test,
  expect,
  equals,
  not,
  which,
  curry,
} from "@benchristel/taste"
import {error, success, Result} from "./lib/result"
import {parseCsv} from "./lib/csv"
import {empty, setDiff} from "./lib/indexables"
import {matches, trimMargin} from "./lib/strings"
import "./lib/functions"
import {_} from "./lib/functions"

const REQUIRED_COLUMNS = ["id", "translation", "generator"]

export type Lexicon = {
  columnOrder: Array<string>
  lexemes: Array<Lexeme>
}

export type Lexeme = {
  id: string
  translation: string
  generator: string
  userColumns: Array<string>
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
      equals(
        error("missing header columns: id, translation, generator"),
      ),
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
      equals(
        success({
          columnOrder: ["id", "translation", "generator"],
          lexemes: [],
        }),
      ),
    )
  },

  "allows user-defined columns"() {
    expect(
      parseLexicon("foobar,id,translation,baz,generator,kludge"),
      equals(
        success({
          columnOrder: [
            "foobar",
            "id",
            "translation",
            "baz",
            "generator",
            "kludge",
          ],
          lexemes: [],
        }),
      ),
    )
  },

  "allows quoted column headers"() {
    expect(
      parseLexicon(`"id","translation","generator"`),
      equals(
        success({
          columnOrder: ["id", "translation", "generator"],
          lexemes: [],
        }),
      ),
    )
  },

  "ignores blank lines"() {
    expect(
      parseLexicon(
        trimMargin`
          id,translation,generator


        `,
      ),
      equals(
        success({
          columnOrder: ["id", "translation", "generator"],
          lexemes: [],
        }),
      ),
    )
  },

  "parses a lexeme"() {
    const result = _(
      trimMargin`
        id,translation,generator
        foo,bar,baz`,
      parseLexicon,
      Result.map((l) => l.lexemes),
    )

    const expected = success([
      {
        id: "foo",
        translation: "bar",
        generator: "baz",
        userColumns: [],
      },
    ])

    expect(result, equals(expected))
  },

  "respects column order"() {
    const csvContent = trimMargin`
      translation,generator,id
      foo,bar,the-id`
    const lexicon = _(csvContent, parseLexicon)
    expect(
      lexicon,
      equals,
      success({
        columnOrder: ["translation", "generator", "id"],
        lexemes: [
          {
            id: "the-id",
            translation: "foo",
            generator: "bar",
            userColumns: [],
          },
        ],
      }),
    )
  },

  "reflects data from user-defined columns"() {
    const csvContent = trimMargin`
      translation,generator,id,my-column
      foo,bar,the-id,my-data`
    const lexicon = _(csvContent, parseLexicon)
    expect(
      lexicon,
      equals,
      success({
        columnOrder: ["translation", "generator", "id", "my-column"],
        lexemes: [
          {
            id: "the-id",
            translation: "foo",
            generator: "bar",
            userColumns: ["my-data"],
          },
        ],
      }),
    )
  },

  "allows rows with too few columns"() {
    const csvContent = trimMargin`
      id,translation,generator,my-column
      foo,bar`
    const lexemes = _(
      csvContent,
      parseLexicon,
      Result.map((l) => l.lexemes),
    )
    expect(
      lexemes,
      equals,
      success([
        {
          id: "foo",
          translation: "bar",
          generator: "",
          userColumns: [""],
        },
      ]),
    )
  },
})

export function parseLexicon(raw: string): Result<Lexicon> {
  return _(
    parseCsv(raw),
    Result.flatMap((rows: Array<Array<string>>) => {
      const [headerRow, ...dataRows] = rows.filter(not(emptyRow))
      if (headerRow == null) {
        return error("missing header row")
      }

      const missingHeaders = setDiff(REQUIRED_COLUMNS, headerRow)
      if (!empty(missingHeaders)) {
        return error(
          `missing header columns: ${missingHeaders.join(", ")}`,
        )
      }

      const idColumnIndex = headerRow.indexOf("id")
      const translationColumnIndex = headerRow.indexOf("translation")
      const generatorColumnIndex = headerRow.indexOf("generator")
      const appColumnIndices = [
        idColumnIndex,
        translationColumnIndex,
        generatorColumnIndex,
      ]

      return success({
        columnOrder: headerRow,
        lexemes: dataRows
          .map(fill("", headerRow.length))
          .map((cells) => ({
            id: cells[idColumnIndex],
            translation: cells[translationColumnIndex],
            generator: cells[generatorColumnIndex],
            userColumns: cells.filter(
              (item, i) => !appColumnIndices.includes(i),
            ),
          })),
      })
    }),
  )
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

test("fill", {
  "fills an array with a value, up to the specified length"() {
    const fillFoo3 = fill("foo", 3)
    expect(fillFoo3(["bar"]), equals, ["bar", "foo", "foo"])
  },

  "does not mutate the array"() {
    const array = ["bar"]
    fill("foo", 3)(array)
    expect(array, equals, ["bar"])
  },

  "does nothing if the requested length is 0"() {
    expect(fill("foo", 0)([]), equals, [])
  },

  "does nothing if the requested length is negative"() {
    expect(fill("foo", -99)([]), equals, [])
  },

  "does nothing if the array is already the desired length"() {
    expect(fill("foo", 1)(["bar"]), equals, ["bar"])
  },

  "does nothing if the array is longer than the desired length"() {
    expect(fill("foo", 1)(["bar", "baz"]), equals, ["bar", "baz"])
  },
})

const fill =
  <T>(filler: T, length: number) =>
  (array: Array<T>): Array<T> => {
    const copy = [...array]
    for (let i = 0; i < length - array.length; i++) {
      copy.push(filler)
    }
    return copy
  }
