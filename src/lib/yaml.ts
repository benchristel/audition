import {parse as _parse} from "yaml"
import {failure, Result, success} from "./result"

export function parse(yaml: string): Result<unknown, string> {
  try {
    return success(_parse(yaml))
  } catch (e: any) {
    return failure(e.message)
  }
}
