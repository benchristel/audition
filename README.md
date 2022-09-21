# audition

Audition is a program for conlangers. It lets you easily try out different words, morphology, and syntax, and quickly see how sentences in the language will look.

## Usage

```bash
cd /path/to/my/project/dir
au # outputs translated sample.txt (see input format below)
```

```bash
au sort   # alphabetizes lexicon by the first column (english)
au sort 1 # alphabetizes lexicon by the second column (conlang)
```

## Input Format

An Audition project has the following structure:

```
lexicon.txt
sample.txt
morphology/
  PL
  INF
  PRES
  3PL
  ...
```

`lexicon.txt` looks like this:

```
at          ubu
away        grom
bear_animal morg
car         gilm
drive       dyhrem
like_v      peth
```

The first column contains glosses; these must not have spaces but can contain
any other characters.

The second column contains the translation in your conlang. It must not contain
spaces. Columns after the second one are ignored; you can put comments there if
you like, or leave old versions of words around for later reference/revival.

The `morphology` directory contains scripts, each of which performs a morphological operation on a word. The scripts are invoked with the input word as an argument and are expected to output the inflected form on standard output.

`sample.txt` should contain sentences built from glosses in `lexicon.txt` and inflections in `morphology`. Translations of these sentences will be printed to the terminal when you run `au`. Lines beginning with `>` are simply copied into the output. E.g.

```
> Bears like to drive cars.
bear_animal/PL like_v/PRES/3PL drive_v/INF car/PL.
```

Might output (given appropriate lexicon and morphology files):

```
> Bears like to drive cars.
morgu pethain dyhremi gilmu.
```

Punctuation, spaces, and words that aren't in `lexicon.txt` are passed through
unchanged. Note that the `/` character has a special meaning: it joins
inflections to their root. If you're trying to translate text that includes
literal slashes...  you're out of luck, at least for now.
