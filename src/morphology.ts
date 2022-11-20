import {equals, expect, test} from "@benchristel/taste"

export type Morphology = {
  [id: string]: Inflector
}

export type Inflector = (
  s: string,
) => [string, "applied" | "does-not-match"]

export function replace(
  pattern: RegExp,
  replacement: string,
): Inflector {
  return (s) => [
    s.replace(pattern, replacement),
    pattern.test(s) ? "applied" : "does-not-match",
  ]
}

test("firstThatApplies", {
  "does nothing given no inflectors"() {
    const inflect = firstThatApplies([])
    expect(inflect("foo"), equals, ["foo", "does-not-match"])
  },

  "applies a matching inflection"() {
    const inflect = firstThatApplies([replace(/o/g, "e")])
    expect(inflect("foo"), equals, ["fee", "applied"])
  },

  "does not apply a non-matching inflection"() {
    const inflect = firstThatApplies([replace(/o/g, "e")])
    expect(inflect("blah"), equals, ["blah", "does-not-match"])
  },

  "applies the first non-matching inflection"() {
    const inflect = firstThatApplies([
      replace(/x/g, "z"),
      replace(/f/g, "h"),
    ])
    expect(inflect("foo"), equals, ["hoo", "applied"])
  },

  "does not apply inflections after the first match"() {
    const inflect = firstThatApplies([
      replace(/o/g, "e"),
      replace(/f/g, "h"),
    ])
    expect(inflect("foo"), equals, ["fee", "applied"])
  },
})

export function firstThatApplies(
  inflectors: Array<Inflector>,
): Inflector {
  return (s) => {
    for (let inflector of inflectors) {
      const result = inflector(s)
      if (result[1] === "applied") {
        return result
      }
    }
    return [s, "does-not-match"]
  }
}
