# audition (aspirational README)

Audition is a program for conlangers. It lets you easily try out different words, morphology, and syntax, and quickly see how sentences in the language will look.

## Usage

```
cd /path/to/my/project/dir
au
```

```
au -f # orders lexicon by frequency
```

## Input Format

An Audition project has the following structure:

```
lexicon.txt
sample.txt
generate
morphology/
  PL
  INF
  PRES
  3PL
  ...
```

`lexicon.txt` looks like this:

```
at          - ubu
away        - grom
bear_animal X morg
car         X gilm
drive       X dyhrem
like        X peth
```

The first column contains glosses; these must not have spaces but can contain any other characters.

The second column contains a `-` to indicate that the row is "unlocked", or `X` to indicate that it is "locked". Words in unlocked rows are regenerated randomly when you run `au`, while words in locked rows are preserved. The second column is optional; if not specified, the default is "locked".

The `morphology` directory contains scripts, each of which performs a morphological operation on a word. The scripts are invoked with the input word as an argument and are expected to output the inflected form on standard output.

The `generate` file is a program that generates a word at random.

`sample.txt` should contain sentences built from glosses in `lexicon.txt` and inflections in `morphology`. These will be translated when `au` runs. Lines beginning with `>` are simply copied into the output. E.g.

```
> Bears like to drive cars.
bear_animal.PL like_v.PRES.3PL drive_v.INF car.PL
```

Might output (given appropriate lexicon and morphology files):

```
> Bears like to drive cars.
morgu pethain dyhremi gilmu
```
