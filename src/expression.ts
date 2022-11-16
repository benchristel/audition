export type Expression =
  | Literal
  | Pointer
  | Compound
  | Inflection

type Literal = {type: "literal", string: string}
type Pointer = {type: "pointer", lexemeId: string}
type Compound = {type: "compound", parts: Array<Expression>}
type Inflection = {
  type: "inflection",
  stem: Expression,
  inflections: Array<string>,
}