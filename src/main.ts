import {fstat, readFileSync} from "fs"
import {AuArgs, parseAuArgs} from "./args"
import {Gloss, parseGloss} from "./gloss"
import {Lexicon, parseLexicon} from "./lexicon"
import {parseArgs} from "./lib/args"
import {parseCsv} from "./lib/csv"
import {exhausted} from "./lib/exhaust"
import {_} from "./lib/functions"
import {Result} from "./lib/result"
import {Morphology, parseMorphology} from "./morphology"
import {Translator} from "./translator"

export function main() {
  const args = _(
    process.argv.slice(2),
    parseArgs,
    parseAuArgs,
    Result.recover<AuArgs, string>((failure) => {
      console.error(failure.detail)
      process.exit(1)
    }),
  )

  process.chdir(args.workingDirectory)

  switch (args.subcommand) {
    case "":
      console.warn("not implemented")
      process.exit(1)
    case "tr":
      _(
        tr(args),
        Result.recover<void, string>((failure) => {
          console.error(failure.detail)
          process.exit(1)
        }),
      )
      return
    default:
      throw exhausted(args)
  }
}

function tr(
  args: Extract<AuArgs, {subcommand: "tr"}>,
): Result<void, string> {
  type CombinedResult = {
    lexicon: Result<Lexicon, string>
    morphology: Result<Morphology, string>
    glossesToTranslate: Result<Array<Gloss>, string>
  }
  return _(
    Result.objAll<CombinedResult, string>({
      lexicon: _(
        readFileSync("lexicon.csv").toString(),
        parseLexicon,
      ),
      morphology: _(
        readFileSync("morphology.yaml").toString(),
        parseMorphology,
      ),
      glossesToTranslate: Result.all(
        args.glossesToTranslate.map((g) =>
          parseGloss("implicit-pointers", g),
        ),
      ),
    }),
    Result.map(({lexicon, morphology, glossesToTranslate}) => {
      const lexiconIndex: {[id: string]: Gloss} = {}
      for (const lexeme of lexicon.lexemes) {
        lexiconIndex[lexeme.id] = lexeme.translation
      }
      const translate = Translator(lexiconIndex, morphology)
      console.log(glossesToTranslate.map(translate).join(" "))
    }),
  )
}
