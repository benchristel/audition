export function exhausted(v: never): Error {
  return new Error(
    "unreachable code executed with supposedly impossible value " +
      JSON.stringify(v),
  )
}
