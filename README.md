# Audition

Audition is a build tool for conlang grammars and sample texts. You write the conlang snippets in your grammar/textbook in a weird "intermediate representation" language that looks like this:

```markdown
> __1SG#CAP ^Arwen. come#1SG 2ACC help#INF.__
> "I am Arwen. I've come to help you."
>
> —the _Fellowship of the Ring_ movie
```

Audition uses `lexicon.csv` and `morphology.yaml` files you provide to compile that input into something like this:

```markdown
> __Im Arwen. Telin le thaed.__
> "I am Arwen. I've come to help you."
>
> —the _Fellowship of the Ring_ movie
```

## Why

I often get halfway done with an ambitious grammar and then decide I don't like some preposition or verb inflection and would rather replace it with a different one. Of course, by that time, I've used it in dozens of examples which I then have to painstakingly find and replace. If the grammar involves processes like consonant mutations and umlaut, simple text search might not even find all the usages.

Audition makes conlang development more agile, by letting you get fast feedback on tweaks to the lexicon and morphology. You can freely try out different words and inflections and get immediate feedback on how they affect the feel of the language.

## Get started

1. [Install `bun`](https://bun.sh/) and [`yarn`](https://yarnpkg.com/getting-started/install).
2. Clone this repo and `cd` in.
3. `yarn install`
4. `./au -C test-language`
5. Mess with the files in `test-language/` and see what happens.

## Overview

Audition translates sample texts like this:

```
> 1SG Arwen. come#1SG 2OBJ help#INF.
```

Producing output like this:

```
> Im Arwen. Telin le thae.
```

Based on a lexicon file that looks like this:

```csv
id,translation,generator
1SG,im,
come,tol,
help,tha,
2OBJ,le,
```

...and a morphology file that looks like this:

```yaml
inflections:
  1SG:
    - ["o([^aeiouy])$", "e$1in"]
```

## Running `au`

Usage:

```
au [-C DIRECTORY]
au tr [strings to translate] [-C DIRECTORY]
```

`au` will operate on the files in the given `DIRECTORY`.
If not specified, `DIRECTORY` defaults to the current working directory.

`au` generates words for all rows in the `lexicon.csv` file whose `translation` columns
are blank, modifying `lexicon.csv` in place. It also translates any `.au` files in
the given `DIRECTORY` or subdirectories, overwriting the corresponding output files.

## Development

Run `yarn husky install` after cloning the repo, to set up git hooks. There's a pre-commit
hook that auto-formats changed files.

`yarn test` or `./test` runs the tests.

`yarn peg` generates parsers from `*.pegjs` sources.

## Input Format

An Audition project consists of a number of files:

- `lexicon.csv`
- `morphology.yaml`
- `generator.txt`

In addition, your project can include any number of `.au` files, like:

- `sample.md.au`

`.au` files contain untranslated glosses, which get translated into your conlang
when you run the `au` program. The output goes to a file with the
same name as the input file, but with the `.au` extension dropped. So translating
`sample.md.au` would generate `sample.md`.

## Morphology

Example of a small `morphology.yaml` file:

```yaml
inflections:
  PAST:
    - ["([aeiou])$", "$1n"]
    - ["$", "ion"]
```

This file describes one inflection, named `PAST`, with two _rules_. The first
rule adds a `n` suffix to words ending in a vowel. The second rule adds an `ion`
suffix to all other words. The first item in each rule array is a
regular expression to be matched against the word being inflected. The second
item is the string with which the matching portion of the word will be replaced,
if a match is found. The `$1` in the first replacement string is a _capture group reference_ that refers to the content between the parentheses in the regex `([aeiou])$`. The `$1` is necessary to preserve the vowel at the end of the word.

The `au` program applies an inflection like `PAST` to a word by going down the
list of rules and attempting to do a regular expression replacement on the word
using each rule. If any rule matches, `au` stops without considering the rules
after it. If none of the rules match, the word is unchanged.

A `morphology.yaml` file can contain any number of inflections, and each inflection
can have any number of rules.

The `morphology.yaml` file can also have a `compound` key at the top level. The
value of this key describes how words should be compounded.

```yaml
compound:
  - ["([aeiou])$", "^p", "$1", "b"]
  - ["([aeiou])$", "^t", "$1", "d"]
  - ["([aeiou])$", "^k", "$1", "g"]
```

The rules in the example above say to voice any stop that follows a vowel at a
morpheme boundary. The first two items in each rule array are used to
create regexes that are matched against the text on either side of the morpheme
boundary. The last two items in the rule array specify replacements for the matches.
`$1` is a capture group reference indicating that the vowel at the end of the
first morpheme should be preserved.

## Generator

The `generator.txt` file consists of _stanzas_ separated by blank lines. Each stanza
starts with a _generator name_ followed by a colon, and then a set of possible _expansions_
separated by spaces and/or single blank lines. Each expansion may be followed by a _weight_ indicating how
likely it is to appear. Expansions can contain any combination of literal text and
bracketed generator references.

An example:

```
root:
[syl]
[syl][syl]*2
[syl][syl][syl]

syl:
[C][V]*4
[C][V][C]
[V][C]*0.7
[V]*0.2

C: t*3 p k*2 n*3 l*2 r s*2 h

V: a*1.3 i u
```

The `lexicon.csv` file can specify the _generator name_ used to generate each word.
This lets you generate shorter words for prepositions, particles, and the like, and
longer words for technical terms.
If the `generator` column is blank for a word, the generator named `root` is used,
if it exists.
