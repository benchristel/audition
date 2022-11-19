import {
  curry,
  test,
  expect,
  is,
  equals,
  not,
} from "@benchristel/taste"
import {firstOf, lastOf} from "./indexables"
import {Maybe} from "./maybe"

export type Stringish = string | TemplateStringsArray
;() => isBlank as (s: string) => boolean
;() => lines as (s: Stringish) => Array<string>
;() =>
  matches as ((r: RegExp, s: string) => boolean) &
    ((r: RegExp) => (s: string) => boolean)
;() =>
  removePrefix as ((prefix: string, s: string) => string) &
    ((prefix: string) => (s: string) => string)
;() => trimMargin as (s: Stringish) => string

test("isBlank", {
  "checks whether a string is all whitespace"() {
    expect("   ", isBlank)
    expect("foo", not(isBlank))
  },

  "is true for the empty string"() {
    expect("", isBlank)
  },

  "is false for a string with both space and non-space characters"() {
    expect(" a ", not(isBlank))
  },

  "treats all whitespace characters as blank"() {
    expect(" \t\n\r", isBlank)
  },
})

export function isBlank(s: string): boolean {
  return /^\s*$/.test(s)
}

test("lines", {
  "splits a string into an array of lines"() {
    expect(lines("a\nb\nc"), equals, ["a", "b", "c"])
  },

  "leaves blank lines intact"() {
    expect(lines("\n\n"), equals, ["", "", ""])
  },

  "treats the empty string as containing a single blank line"() {
    expect(lines(""), equals, [""])
  },

  "knows about Windows"() {
    expect(lines("one\r\ntwo"), equals, ["one", "two"])
  },
})

export function lines(s: Stringish): Array<string> {
  return String(s).split(/\r?\n/)
}

test("matches", {
  "checks whether a string matches a regex"() {
    expect("foo", matches, /^f/)
    expect("foo", not(matches), /bar/)
  },

  "is curried"() {
    expect("a", matches(/a/))
  },
})

export const matches = curry(
  (regex: RegExp, s: string): boolean => regex.test(s),
  "matches",
)

test("trimMargin", {
  "trims multiline strings that are indented to align with surrounding code"() {
    const trimmed = trimMargin`
      def hello_from_python():
        print("Hello, world!")
    `
    expect(
      trimmed,
      is,
      'def hello_from_python():\n  print("Hello, world!")',
    )
  },

  "given an empty string"() {
    expect(trimMargin``, is, "")
  },

  "given a string with one line break and space"() {
    expect(
      trimMargin`
    `,
      is,
      "",
    )
  },

  "given a string with no margin"() {
    expect(trimMargin`hi`, is, "hi")
  },

  "removes an initial newline"() {
    const trimmed = trimMargin("\nhi")
    expect(trimmed, is, "hi")
  },

  "removes a final newline followed by spaces"() {
    const trimmed = trimMargin`hi
    `
    expect(trimmed, is, "hi")
  },

  "removes an initial windows line ending"() {
    const trimmed = trimMargin("\r\nfoo")
    expect(trimmed, is, "foo")
  },

  "removes spaces from the beginning of a one-line string"() {
    const trimmed = trimMargin("     foo")
    expect(trimmed, is, "foo")
  },

  "removes mixed tabs and spaces"() {
    const trimmed = trimMargin("\t foo\n\t bar")
    expect(trimmed, is, "foo\nbar")
  },

  "does not remove mismatched tabs and spaces"() {
    const trimmed = trimMargin("\t foo\n \tbar")
    expect(trimmed, is, "foo\n \tbar")
  },

  "converts windows line endings to unix ones"() {
    const trimmed = trimMargin("foo\r\nbar")
    expect(trimmed, is, "foo\nbar")
  },

  "removes the same number of spaces from all lines"() {
    const trimmed = trimMargin`
      foo
        bar
          baz
    `
    expect(trimmed, is, "foo\n  bar\n    baz")
  },
})

export function trimMargin(s: Stringish): string {
  const lns = lines(s)
  const mIsBlank = Maybe.map(isBlank)
  if (mIsBlank(firstOf(lns))) lns.shift()
  if (mIsBlank(lastOf(lns))) lns.pop()
  const initialIndent = /^[ \t]*/.exec(firstOf(lns) ?? "")?.[0]
  const trimIndent = initialIndent
    ? removePrefix(initialIndent)
    : identity
  return lns.map(trimIndent).join("\n")
}

test("removePrefix", {
  "removes a prefix from a string"() {
    expect(removePrefix("re", "rehash"), is, "hash")
  },

  "does nothing if the prefix is not present"() {
    expect(removePrefix("blah", "foo"), is, "foo")
  },

  "only removes the prefix if it occurs at the beginning of the string"() {
    expect(removePrefix("bar", "foobar"), is, "foobar")
  },

  "is curried"() {
    expect(
      ["-a", "-b", "-c"].map(removePrefix("-")),
      equals(["a", "b", "c"]),
    )
  },
})

export const removePrefix = curry(
  (prefix: string, s: string): string => {
    const hasPrefix = s.slice(0, prefix.length) === prefix
    return hasPrefix ? s.slice(prefix.length) : s
  },
  "removePrefix",
)

function identity<T>(x: T): T {
  return x
}
