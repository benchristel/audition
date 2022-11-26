import {readdirSync, readFileSync} from "fs"
import {AuArgs, parseAuArgs} from "./args"
import {Gloss, parseGloss} from "./gloss"
import {Lexicon, LexiconIndex, parseLexicon} from "./lexicon"
import {parseArgs} from "./lib/args"
import {exhausted} from "./lib/exhaust"
import {_} from "./lib/functions"
import {Result, success} from "./lib/result"
import {matches} from "./lib/strings"
import {Morphology, parseMorphology} from "./morphology"
import {parseText, Text, toString} from "./text"
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
      _(
        defaultSubcommand(),
        Result.recover<void, string>((failure) => {
          console.error(failure.detail)
          process.exit(1)
        }),
      )
      return
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
  type Inputs = {
    lexicon: Result<Lexicon, string>
    morphology: Result<Morphology, string>
    glossesToTranslate: Result<Array<Gloss>, string>
  }
  return _(
    Result.objAll<Inputs, string>({
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
      const translate = Translator(index(lexicon), morphology)
      console.log(glossesToTranslate.map(translate).join(" "))
    }),
  )
}

function defaultSubcommand() {
  type Inputs = {
    lexicon: Result<Lexicon, string>
    morphology: Result<Morphology, string>
    texts: Result<Array<[string, Text]>, string>
  }
  return _(
    Result.objAll<Inputs, string>({
      lexicon: _(
        readFileSync("lexicon.csv").toString(),
        parseLexicon,
      ),
      morphology: _(
        readFileSync("morphology.yaml").toString(),
        parseMorphology,
      ),
      texts: Result.all(
        readdirSync(".")
          .filter(matches(/.au$/))
          .map(
            (filename) =>
              _(
                [
                  success(filename),
                  parseText(readFileSync(filename).toString()),
                ] as [Result<string, string>, Result<Text, string>],
                Result.all,
              ) as Result<[string, Text], string>,
          ),
      ),
    }),
    Result.map(({lexicon, morphology, texts}) => {
      const translate = Translator(index(lexicon), morphology)
      return texts.map(second((text) => toString(translate, text)))
    }),
    Result.map((texts) => {
      texts.map(([filename, translated]) =>
        console.log(filename, translated),
      )
    }),
  )
}

function second<A, B, Out>(
  f: (arg: B) => Out,
): (arg: [A, B]) => [A, Out] {
  return ([a, b]) => [a, f(b)]
}

function index(lexicon: Lexicon): LexiconIndex {
  const lexiconIndex: {[id: string]: Gloss} = {}
  for (const lexeme of lexicon.lexemes) {
    lexiconIndex[lexeme.id] = lexeme.translation
  }
  return lexiconIndex
}
