GlossWithImplicitPointers
  = stem:(Literal / CompoundWithImplicitPointers / ImplicitPointer) inflections:InflectionList {
    if (inflections.length === 0) return stem
    return {type: "inflection", stem, inflections}
  }
GlossWithImplicitLiterals
  = stem:(Pointer / CompoundWithImplicitLiterals / ImplicitLiteral) inflections:InflectionList {
    if (inflections.length === 0) return stem
    return {type: "inflection", stem, inflections}
  }
Literal
  = "^" string:Word {
    return {type: "literal", string, generated: false}
  }
Pointer
  = "*" lexeme:Word {
    return {type: "pointer", lexeme}
  }
InflectionList
  = inflections:("#" Word)* {
    return inflections.map(([_, name]) => name)
  }
ImplicitLiteral
  = GeneratedLiteral / HandcraftedLiteral
HandcraftedLiteral
  = string:Word {
    return {type: "literal", string, generated: false}
  }
GeneratedLiteral
  = "?" string:Word {
    return {type: "literal", string, generated: true}
  }
ImplicitPointer
  = lexeme:Word {
    return {type: "pointer", lexeme}
  }
Word = chars:WordChars { return chars }
WordChars = [^~`!@#\$%\^&\*\(\)\=\+\[\]\{\}\\\|;:'",<\.>/? \t\n\r]* { return text() }
CompoundWithImplicitLiterals
  = "[" head:GlossWithImplicitLiterals tail:("+" GlossWithImplicitLiterals)* "]" {
    return {type: "compound", elements: [head, ...tail.map(([_, tr]) => tr)]}
  }
CompoundWithImplicitPointers
  = "[" head:GlossWithImplicitPointers tail:("+" GlossWithImplicitPointers)* "]" {
    return {type: "compound", elements: [head, ...tail.map(([_, g]) => g)]}
  }