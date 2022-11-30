import {expect, test, equals, which, is} from "@benchristel/taste"
import {success, failure, Result} from "./result"
// @ts-ignore
import Parser from "./generated/csv-parser"
import {matches} from "./strings"

const parser = Parser()

test("parseCsv", {
  "given an empty string"() {
    expect(parseCsv(""), equals, success([[""]]))
  },

  "given two empty cells"() {
    expect(parseCsv(","), equals, success([["", ""]]))
  },

  "given a single cell"() {
    expect(parseCsv("foo"), equals, success([["foo"]]))
  },

  "given a row with multiple cells"() {
    expect(
      parseCsv("foo,bar,baz"),
      equals(success([["foo", "bar", "baz"]])),
    )
  },

  "leaves spaces around data"() {
    expect(
      parseCsv("foo, bar, baz"),
      equals(success([["foo", " bar", " baz"]])),
    )
  },

  "given quoted data"() {
    expect(parseCsv('"foo"'), equals, success([["foo"]]))
  },

  "escapes quotes"() {
    expect(
      parseCsv('"a program that prints ""hello, world"""'),
      equals(success([['a program that prints "hello, world"']])),
    )
  },

  "does not allow spaces before quoted data"() {
    expect(
      parseCsv(' ""'),
      equals(failure(which(contains('Expected ","')))),
    )
  },

  "does not allow quotes in unquoted data"() {
    expect(
      parseCsv('say "hello"'),
      equals(failure(which(contains('Expected ","')))),
    )
  },

  "allows newlines in quoted data"() {
    expect(
      parseCsv('"line 1\nline2\r\n"'),
      equals(success([["line 1\nline2\r\n"]])),
    )
  },

  "allows commas in quoted data"() {
    expect(parseCsv('"a,b"'), equals(success([["a,b"]])))
  },

  "parses multiple lines"() {
    expect(
      parseCsv("foo,bar\n123,456"),
      equals(
        success([
          ["foo", "bar"],
          ["123", "456"],
        ]),
      ),
    )
  },

  "allows Windows line endings"() {
    expect(
      parseCsv("foo,bar\r\n123,456"),
      equals(
        success([
          ["foo", "bar"],
          ["123", "456"],
        ]),
      ),
    )
  },
})

export function parseCsv(
  s: string,
): Result<Array<Array<string>>, string> {
  try {
    return success(parser.parse(s))
  } catch (e: any) {
    return failure(e.message)
  }
}

test("serializeCsv", {
  "serializes an empty array of rows"() {
    expect(serializeCsv([]), is, "")
  },

  "serializes a row with no cells"() {
    expect(serializeCsv([[]]), is, "")
  },

  "serializes a row with one empty cell"() {
    expect(serializeCsv([[""]]), is, "")
  },

  "serializes a row with two empty cells"() {
    expect(serializeCsv([["", ""]]), is, ",")
  },

  "serializes a row with non-empty cells"() {
    expect(serializeCsv([["foo", "bar"]]), is, "foo,bar")
  },

  "serializes multiple rows"() {
    expect(
      serializeCsv([
        ["foo", "bar"],
        ["baz", "kludge"],
      ]),
      is,
      "foo,bar\nbaz,kludge",
    )
  },

  "quotes a cell containing a comma"() {
    expect(serializeCsv([["a,b"]]), is, `"a,b"`)
  },

  "quotes a cell containing a newline"() {
    expect(serializeCsv([["a\nb"]]), is, `"a\nb"`)
  },

  "quotes a cell containing a carriage return"() {
    expect(serializeCsv([["a\rb"]]), is, `"a\rb"`)
  },

  "escapes quotes in data"() {
    expect(serializeCsv([[`a"b"`]]), is, `"a""b"""`)
  },
})

export function serializeCsv(rows: Array<Array<string>>): string {
  return rows.map(serializeRow).join("\n")
}

function serializeRow(row: Array<string>): string {
  return row.map(serializeCell).join(",")
}

function serializeCell(cell: string): string {
  if (needsQuotes(cell)) {
    return `"${escapeQuotes(cell)}"`
  }
  return cell
}

const needsQuotes = matches(/[,\n\r"]/)
const escapeQuotes = (s: string) => s.replace(/"/g, '""')

const contains = (needle: string) => (haystack: string) =>
  haystack.indexOf(needle) >= 0
