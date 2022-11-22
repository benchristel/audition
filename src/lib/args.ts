import {equals, expect, test} from "@benchristel/taste"

export type Args = {
  positionalArgs: Array<string>
  options: {[flag: string]: string | true}
}

test("parseArgs", {
  "accepts an empty list of arguments"() {
    expect(parseArgs([]), equals, {positionalArgs: [], options: {}})
  },

  "accepts a single positional argumment"() {
    expect(parseArgs(["one"]), equals, {
      positionalArgs: ["one"],
      options: {},
    })
  },

  "parses a flag with no argument"() {
    expect(parseArgs(["-a"]), equals, {
      positionalArgs: [],
      options: {a: true},
    })
  },

  "parses multiple flags with no arguments"() {
    expect(parseArgs(["-a", "-b"]), equals, {
      positionalArgs: [],
      options: {a: true, b: true},
    })
  },

  "parses a flag with an argument"() {
    expect(parseArgs(["-a", "foo"]), equals, {
      positionalArgs: [],
      options: {a: "foo"},
    })
  },

  "parses positional args and flags"() {
    expect(
      parseArgs(["one", "two", "-a", "arg", "three", "-b"]),
      equals,
      {
        positionalArgs: ["one", "two", "three"],
        options: {a: "arg", b: true},
      },
    )
  },
})

export function parseArgs(raw: Array<string>): Args {
  const ret: Args = {positionalArgs: [], options: {}}
  while (true) {
    const arg = raw.shift()
    if (!arg) break
    const next = raw[0] as string | undefined
    if (arg[0] === "-") {
      const flag = arg.slice(1)
      if (next && next[0] !== "-") {
        ret.options[flag] = next
        raw.shift()
      } else {
        ret.options[flag] = true
      }
    } else {
      ret.positionalArgs.push(arg)
    }
  }
  return ret
}
