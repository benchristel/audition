# Audition

Audition generates conlangs and translates sample texts.

# Input Format

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

## Lexicon

The lexicon is formatted as a CSV file, which must have a header row and at least
three columns with the headers `gloss`, `translation`, and `generator`.
It can include whatever other columns you like.

The `gloss` column should contain a unique, mnemonic identifier for each word in the lexicon.
A gloss is usually an English word, perhaps with some modifications (like an `_n` suffix
to disambiguate a noun from a verb with the same spelling) or a linguistic
abbreviation, like `DEF` for "definite article". Glosses are used in `.au` files
to identify words to be translated. Glosses must contain only alphanumeric characters and `_` (underscore).

The `translation` column should contain a _translation_ for each gloss, which describes
how it should be translated into your conlang. The [PegJS](https://pegjs.org/online) syntax of a translation is:

```
Translation
  = stem:(Word / Dereference / Compound) inflections:InflectionList {
    return {type: "inflection", stem, inflections}
  }
Dereference
  = "*" gloss:Word {
    return {type: "dereference", gloss}
  }
Compound
  = "[" head:Translation tail:("+" Translation)* "]" {
    return {type: "compound", parts: [head, ...tail.map(([_, tr]) => tr)]}
  }
InflectionList
  = inflections:("#" Word)* {
    return inflections.map(([_, name]) => name)
  }
Word = chars:[A-Za-z0-9_]+ { return text() }
```

Examples of translations:

```
*read#AGT
[eyr+*lead]#PASS
[*full+*seek#LENIT]#HON
```

A translation may not contain whitespace.

A `GLOSS` node should be identical to some gloss in the lexicon. An `INFLECTION`
node should be the name of an inflection in the `morphology.yaml` file (discussed below).

The compounding operation is right-associative, so `[A+B+C]` is the same as `[A+[B+C]]`. The inflection operation is left-associative.

## Morphology

Example of a small `morphology.yaml` file:

```yaml
inflections:
  PAST:
    - ["(?<=[aeiou])$", "n"]
    - ["(?<=[^aeiou])$", "ion"]
```

This file describes one inflection, named `PAST`, with two *rules*. The first
rule adds a `n` suffix to words ending in a vowel. The second rule adds an `ion`
suffix to words ending in a non-vowel. The first item in each rule array is a
regular expression to be matched against the word being inflected. The second
item is the string with which the matching portion of the word will be replaced,
if a match is found.

The `au` program applies an inflection like `PAST` to a word by going down the
list of rules and attempting to do a regular expression replacement on the word
using each rule. If any rule matches, it stops without considering the rules
after it. If none of the rules match, the word is unchanged.

A `morphology.yaml` file can contain any number of inflections, and each inflection
can have any number of rules.

The `morphology.yaml` file can also have a `compound` key at the top level. The
value of this key describes how words should be compounded.

```yaml
compound:
  - ["[aeiou]", "p", "$1", "b"]
  - ["[aeiou]", "t", "$1", "d"]
  - ["[aeiou]", "k", "$1", "g"]
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

## Sample Files

`.au` files are processed line-by-line. Lines that don't start with `>` are untouched. Lines that do start with `>` are translated. To translate a line, `au` first splits it into _tokens_, which are runs of characters that are either all word characters or all non-word characters (for the purposes of this description, a word character matches `[A-Za-z0-9_\+#\[\]`).
Each token consisting of word characters is replaced by its _evaluation_ in the output file.

The _evaluation_ of a token is:

- if the token is a simple word matching `[A-Za-z0-9_]+`, the evaluation of the translation found by looking up that word in the `gloss` column of the lexicon.
- if the token is a `inflection` expression with `#`, the result of applying the inflection's rules from `morphology.yaml` to the evaluation of the expression to the left of the `#`.
- if the token is a `compound` expression, the concatenation of the evaluations of its subexpressions.


The syntax of a token is almost the same as the syntax of a _translation_, above. However,
there is no `dereference` node type; all stems are assumed to be glosses and implicitly dereferenced.

## Running `au`

Usage:

```
au DIRECTORY
```

If not specified, `DIRECTORY` defaults to the current working directory. `au` will
operate on the files in that directory.

`au` generates words for all rows in the `lexicon.csv` file whose `translation` columns
are blank, modifying `lexicon.csv` in place. It also translates any `.au` files in
the given `DIRECTORY` or subdirectories, overwriting the corresponding output files.