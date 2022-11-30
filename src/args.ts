import {equals, expect, test} from "@benchristel/taste"
import {Args} from "./lib/args"
import {_} from "./lib/functions"
import {empty} from "./lib/indexables"
import {failure, Result, success} from "./lib/result"

type GlobalFlags = {workingDirectory: string}

export type AuArgs =
  | ({subcommand: ""} & GlobalFlags)
  | ({
      subcommand: "tr"
      glossesToTranslate: Array<string>
    } & GlobalFlags)
  | ({subcommand: "gen"} & GlobalFlags)

const blank: Args = {positionalArgs: [], options: {}}

const baseArgs: AuArgs = Object.freeze({
  subcommand: "",
  workingDirectory: ".",
})

test("parseAuArgs", {
  "defaults workingDirectory to ."() {
    const result = parseAuArgs(blank)
    expect(result, equals, success(baseArgs))
  },

  "takes workingDirectory from the -C argument"() {
    const result = parseAuArgs({...blank, options: {C: "foo"}})
    expect(
      result,
      equals,
      success({...baseArgs, workingDirectory: "foo"} as AuArgs),
    )
  },

  "defaults workingDirectory if -C is passed with no argument"() {
    const result = parseAuArgs({...blank, options: {C: true}})
    expect(result, equals, success(baseArgs))
  },

  "parses the `tr` subcommand"() {
    const result = parseAuArgs({
      ...blank,
      positionalArgs: ["tr", "gloss", "another-gloss"],
    })
    expect(
      result,
      equals,
      success({
        ...baseArgs,
        subcommand: "tr",
        glossesToTranslate: ["gloss", "another-gloss"],
      }),
    )
  },

  "parses the `gen` subcommand"() {
    const result = parseAuArgs({
      options: {C: "workdir"},
      positionalArgs: ["gen"],
    })
    expect(
      result,
      equals,
      success({
        workingDirectory: "workdir",
        subcommand: "gen",
      }),
    )
  },

  "fails to parse an unrecognized subcommand"() {
    const result = parseAuArgs({
      ...blank,
      positionalArgs: ["fsdfsaf"],
    })
    expect(result, equals, failure("Unrecognized subcommand fsdfsaf"))
  },
})

export function parseAuArgs(raw: Args): Result<AuArgs, string> {
  const workingDirectory =
    typeof raw.options.C === "string" ? raw.options.C : "."

  switch (raw.positionalArgs[0]) {
    case undefined:
      return success({subcommand: "", workingDirectory})
    case "tr":
      return _(
        parseTrSubcommand(raw),
        Result.map((args) => ({...args, workingDirectory})),
      )
    case "gen":
      return success({subcommand: "gen", workingDirectory})
    default:
      return failure(
        "Unrecognized subcommand " + raw.positionalArgs[0],
      )
  }
}

function parseTrSubcommand(
  raw: Args,
): Result<
  {subcommand: "tr"; glossesToTranslate: Array<string>},
  string
> {
  const [_, ...glossesToTranslate] = raw.positionalArgs
  return success({subcommand: "tr", glossesToTranslate})
}
