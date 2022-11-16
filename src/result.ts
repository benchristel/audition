export type Result<T> =
  | SuccessResult<T>
  | ErrorResult

export type SuccessResult<T> = {type: "success", value: T}
export type ErrorResult = {type: "error", message: string}

export function success<T>(value: T): SuccessResult<T> {
  return {type: "success", value}
}

export function error(message: string): ErrorResult {
  return {type: "error", message}
}