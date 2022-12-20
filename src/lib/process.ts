import {Result} from "./result"

export const exitOnFailure = <T>() =>
  Result.recover<T, string>((failure) => {
    console.error(failure.detail)
    process.exit(1)
  })
