import {curry, equals, expect, test, which} from "@benchristel/taste"
import {Mold} from "./lib/mold"
import {viewCastFailure} from "./lib/mold-view"
import {failure, Result, success} from "./lib/result"
import {matches, trimMargin} from "./lib/strings"
import {parse} from "./lib/yaml"
import {_} from "./lib/functions"

export type Morphology = {
  inflections: {
    [id: string]: Inflector
  }
}

type MorphologyYaml = {
  inflections: {
    [id: string]: Array<[string, string]>
  }
}

const mold: Mold<MorphologyYaml> = Mold.struct({
  inflections: Mold.map(
    Mold.array(Mold.tuple(Mold.string, Mold.string)),
  ),
})

export type Inflector = (
  s: string,
) => [string, "applied" | "does-not-match"]
;() => replace as (pattern: RegExp, replacement: string) => Inflector
;() => firstThatApplies as (inflectors: Array<Inflector>) => Inflector

export const replace = curry(
  (pattern: RegExp, replacement: string, s: string) => {
    return [
      s.replace(pattern, replacement),
      pattern.test(s) ? "applied" : "does-not-match",
    ]
  },
  "replace",
)

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

export const firstThatApplies = curry(
  (
    inflectors: Array<Inflector>,
    s: string,
  ): [string, "applied" | "does-not-match"] => {
    for (let inflector of inflectors) {
      const result = inflector(s)
      if (result[1] === "applied") {
        return result
      }
    }
    return [s, "does-not-match"]
  },
  "firstThatApplies",
)

export function capitalize(
  s: string,
): [string, "applied" | "does-not-match"] {
  return [s[0].toUpperCase() + s.slice(1), "applied"]
}

test("parseMorphology", {
  "fails given malformed YAML"() {
    const result = parseMorphology("}")
    expect(result, equals, failure(which(matches(/YAML.*"}"/))))
  },

  "succeeds given YAML config with an empty inflections map"() {
    const result = parseMorphology("inflections: {}")
    expect(result, equals, success({inflections: {CAP: capitalize}}))
  },

  "fails given YAML config where inflections is the wrong type"() {
    const result = parseMorphology("inflections: foobar")
    expect(
      result,
      equals,
      failure(
        `expected $.inflections to be an object, but got "foobar"`,
      ),
    )
  },

  "hydrates inflection rules"() {
    const result = parseMorphology(trimMargin`
      inflections:
        PL:
          - ["[aeo]$", "i"]
    `)
    expect(
      result,
      equals,
      success({
        inflections: {
          CAP: capitalize,
          PL: firstThatApplies([replace(/[aeo]$/, "i")]),
        },
      }),
    )
  },
})

export function parseMorphology(
  yaml: string,
): Result<Morphology, string> {
  return _(
    parse(yaml),
    Result.flatMap(castAsMorphology),
    Result.map(enliven),
  )

  function enliven(husk: MorphologyYaml): Morphology {
    return {
      inflections: {
        CAP: capitalize,
        ...mapObject((rules: Array<[string, string]>) =>
          firstThatApplies(rules.map(enlivenRule)),
        )(husk.inflections),
      },
    }
  }

  function enlivenRule([pattern, replacement]: [
    string,
    string,
  ]): Inflector {
    return replace(new RegExp(pattern), replacement)
  }
}

function castAsMorphology(
  obj: unknown,
): Result<MorphologyYaml, string> {
  return _(mold(obj, []), Result.mapFailure(viewCastFailure))
}

function mapObject<T, U>(
  fn: (value: T) => U,
): (obj: {[key: string]: T}) => {[key: string]: U} {
  return (obj) => {
    const ret: {[key: string]: U} = {}
    for (const [k, v] of Object.entries(obj)) {
      ret[k] = fn(v)
    }
    return ret
  }
}
