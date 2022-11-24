import {expect, test, equals, which} from "@benchristel/taste"
import {success, failure, Result} from "./result"
// @ts-ignore
import Parser from "./generated/csv-parser"

const parser = Parser()

export function parseCsv(
  s: string,
): Result<Array<Array<string>>, string> {
  try {
    return success(parser.parse(s))
  } catch (e: any) {
    return failure(e.message)
  }
}

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

const contains = (needle: string) => (haystack: string) =>
  haystack.indexOf(needle) >= 0
