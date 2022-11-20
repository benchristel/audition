Gloss
  = stem:(Literal / CompoundWithImplicitPointers / PointerWord) inflections:InflectionList {
    if (inflections.length === 0) return stem
    return {type: "inflection", stem, inflections}
  }
Translation
  = stem:(Pointer / CompoundWithImplicitLiterals / LiteralWord) inflections:InflectionList {
    if (inflections.length === 0) return stem
    return {type: "inflection", stem, inflections}
  }
Literal
  = "^" string:Word {
    return {type: "literal", string}
  }
Pointer
  = "*" lexeme:Word {
    return {type: "pointer", lexeme}
  }
InflectionList
  = inflections:("#" Word)* {
    return inflections.map(([_, name]) => name)
  }
LiteralWord
  = string:Word {
    return {type: "literal", string}
  }
PointerWord
  = lexeme:Word {
    return {type: "pointer", lexeme}
  }
Word = chars:[A-Za-z0-9_]* { return text() }
CompoundWithImplicitLiterals
  = "[" head:Translation tail:("+" Translation)* "]" {
    return {type: "compound", elements: [head, ...tail.map(([_, tr]) => tr)]}
  }
CompoundWithImplicitPointers
  = "[" head:Gloss tail:("+" Gloss)* "]" {
    return {type: "compound", elements: [head, ...tail.map(([_, g]) => g)]}
  }