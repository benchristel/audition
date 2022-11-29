Rule = name:RuleName ":" expansions:(_ Expansion)* {
  return {name, expansions: expansions.map(([_, e]) => e)}
}

Expansion = weight:(Number "*")? pattern:Pattern {
  return {weight: weight?.[0] ?? 1, pattern}
}

Pattern = segments:(Pointer / Literal)+ {
  return segments
}

Pointer = "[" ruleName:RuleName "]" {
  return {type: "pointer", ruleName}
}

Literal = ConlangText {
  return {type: "literal", text: text()}
}

ConlangText "text" = [^ \t\n\r\*\[\]]+

RuleName "a rule name" = [A-Za-z0-9_\-]+ { return text() }

Number "a number" = ([1-9][0-9]* ("." [0-9]+)? / "0"? "." [0-9]+) { return +text() }

_ "whitespace" = [ \t\n\r]+