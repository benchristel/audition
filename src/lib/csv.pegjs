CSV
  = first:Row rest:(Newline Row)* Newline? {
    return [first, ...rest.map(([_, row]) => row)]
  }

Row
  = first:Cell rest:("," Cell)* {
    return [first, ...rest.map(([_, cell]) => cell)]
  }

Cell
  = QuotedCell
  / UnquotedCell

QuotedCell
  = '"' chars:QuotedChar* '"' {
    return chars.join("")
  }

QuotedChar
  = LiteralChars
  / EscapedQuote

LiteralChars
  = [^"]+ {
    return text()
  }

EscapedQuote
  = '""' {
    return '"'
  }

UnquotedCell "text"
  = chars:[^",\r\n]* {
    return text()
  }

Newline "end of line"
  = "\r\n"
  / "\n"
