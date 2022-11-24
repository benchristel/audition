import {test, expect, equals, not, which} from "@benchristel/taste"
import {failure, success, Result} from "./lib/result"
import {parseCsv} from "./lib/csv"
import {empty, setDiff} from "./lib/indexables"
import {matches, trimMargin} from "./lib/strings"
import "./lib/functions"
import {_} from "./lib/functions"
import {Gloss, literal, parseGloss} from "./gloss"
import {fill} from "./lib/arrays"

const REQUIRED_COLUMNS = ["id", "translation", "generator"]

export type Lexicon = {
  columnOrder: Array<string>
  lexemes: Array<Lexeme>
}

export type Lexeme = {
  id: string
  translation: Gloss
  generator: string
  userColumns: Array<string>
}

export type LexiconIndex = {
  [id: string]: Gloss
}

export type ParseLexiconResult = Result<Lexicon, string>
;() => parseLexicon as (csv: string) => ParseLexiconResult

test("parseLexicon", {
  "fails given an empty string"() {
    expect(parseLexicon(""), equals, failure("missing header row"))
  },

  "fails given a blank string"() {
    expect(parseLexicon("   "), equals, failure("missing header row"))
  },

  "fails given empty lines"() {
    expect(
      parseLexicon("\n\n"),
      equals,
      failure("missing header row"),
    )
  },

  "fails given a header that's missing all required columns"() {
    expect(
      parseLexicon("invalid"),
      equals(
        failure("missing header columns: id, translation, generator"),
      ),
    )
  },

  "fails given a header that's missing one required column"() {
    expect(
      parseLexicon("id,generator"),
      equals(failure("missing header columns: translation")),
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
        translation: literal("bar"),
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
            translation: literal("foo"),
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
            translation: literal("foo"),
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
          translation: literal("bar"),
          generator: "",
          userColumns: [""],
        },
      ]),
    )
  },

  "fails if a translation can't be parsed"() {
    const csvContent = trimMargin`
      id,translation,generator,my-column
      foo,spaces aren't allowed,bar`
    const lexemes = _(
      csvContent,
      parseLexicon,
      Result.map((l) => l.lexemes),
    )
    expect(
      lexemes,
      equals,
      failure(
        which(matches(/Failed to parse "spaces aren't allowed"/)),
      ),
    )
  },
})

export function parseLexicon(raw: string): ParseLexiconResult {
  return _(
    parseCsv(raw),
    Result.flatMap(
      (rows: Array<Array<string>>): ParseLexiconResult => {
        const [headerRow, ...dataRows] = rows.filter(not(emptyRow))
        if (headerRow == null) {
          return failure("missing header row")
        }

        const missingHeaders = setDiff(REQUIRED_COLUMNS, headerRow)
        if (!empty(missingHeaders)) {
          return failure(
            `missing header columns: ${missingHeaders.join(", ")}`,
          )
        }

        const idColumnIndex = headerRow.indexOf("id")
        const translationColumnIndex =
          headerRow.indexOf("translation")
        const generatorColumnIndex = headerRow.indexOf("generator")
        const appColumnIndices = [
          idColumnIndex,
          translationColumnIndex,
          generatorColumnIndex,
        ]
        type Cells = Array<string>
        const id = (cells: Cells) => cells[idColumnIndex]
        const translation = (cells: Cells) =>
          cells[translationColumnIndex]
        const generator = (cells: Cells) =>
          cells[generatorColumnIndex]
        const userColumns = (cells: Cells) =>
          cells.filter((_, i) => !appColumnIndices.includes(i))

        return Result.objAll({
          columnOrder: success(headerRow),
          lexemes: Result.all(
            dataRows.map(fill("", headerRow.length)).map(
              (cells) =>
                Result.objAll({
                  id: success(id(cells)),
                  translation: parseLexicalGloss(translation(cells)),
                  generator: success(generator(cells)),
                  userColumns: success(userColumns(cells)),
                }) as Result<Lexeme, string>,
            ),
          ),
        })
      },
    ),
  )
}

export function indexEntry(lexeme: Lexeme): [string, Gloss] {
  return [lexeme.id, lexeme.translation]
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

function parseLexicalGloss(raw: string): Result<Gloss, string> {
  return parseGloss("implicit-literals", raw)
}
