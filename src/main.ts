import {readdirSync, readFileSync, writeFileSync} from "fs"
import {AuArgs, parseAuArgs} from "./args"
import {compileGenerator, parseGenerator} from "./generator"
import {Gloss, parseGloss} from "./gloss"
import {Lexicon, LexiconIndex, parseLexicon} from "./lexicon"
import {parseArgs} from "./lib/args"
import {exhausted} from "./lib/exhaust"
import {_} from "./lib/functions"
import {exitOnFailure} from "./lib/process"
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
    exitOnFailure(),
  )

  process.chdir(args.workingDirectory)

  const result = (() => {
    switch (args.subcommand) {
      case "":
        return defaultSubcommand(args)
      case "tr":
        return tr(args)
      case "gen":
        return gen(args)
      default:
        throw exhausted(args)
    }
  })()

  _(result, exitOnFailure)
}

function defaultSubcommand(args: Extract<AuArgs, {subcommand: ""}>) {
  type Inputs = {
    lexicon: Result<Lexicon, string>
    morphology: Result<Morphology, string>
    texts: Result<Array<[string, Text]>, string>
  }
  return _(
    Result.objAll<Inputs, string>({
      lexicon: loadLexicon(),
      morphology: loadMorphology(),
      texts: loadTexts(),
    }),
    Result.map(({lexicon, morphology, texts}) => {
      const translate = Translator(index(lexicon), morphology)
      return texts.map(
        second(
          toString(translate, {includeSource: args.includeSources}),
        ),
      )
    }),
    Result.map((texts) => {
      texts
        .map(first(removeAuExtension))
        .map(([filename, translated]) =>
          writeFileSync(filename, translated),
        )
    }),
  )
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
      lexicon: loadLexicon(),
      morphology: loadMorphology(),
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

function gen(
  args: Extract<AuArgs, {subcommand: "gen"}>,
): Result<void, string> {
  type Inputs = {
    generator: Result<(ruleName?: string) => string, string>
  }
  return _(
    Result.objAll<Inputs, string>({
      generator: _(
        readFileSync("generator.txt").toString(),
        parseGenerator,
        Result.flatMap(compileGenerator(Math.random)),
      ),
    }),
    Result.map(({generator}) => {
      for (let i = 0; i < 30; i++) {
        console.log(generator(args.generator))
      }
    }),
  )
}

function loadLexicon(): Result<Lexicon, string> {
  return _(readFileSync("lexicon.csv").toString(), parseLexicon)
}

function loadMorphology(): Result<Morphology, string> {
  return _(
    readFileSync("morphology.yaml").toString(),
    parseMorphology,
  )
}

function loadTexts(): Result<Array<[string, Text]>, string> {
  return Result.all(
    readdirSync(".")
      .filter(matches(/\.au$/))
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
  )
}

function first<A, B, Out>(
  f: (arg: A) => Out,
): (arg: [A, B]) => [Out, B] {
  return ([a, b]) => [f(a), b]
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

function removeAuExtension(filename: string): string {
  return filename.replace(/\.au$/, "")
}
