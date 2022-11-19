export function empty(a: Array<unknown> | string): boolean {
  return a.length === 0
}

export function setDiff<T>(a: Array<T>, b: Array<T>): Array<T> {
  return a.filter((item) => !b.includes(item))
}

export function lastOf(a: string): string
export function lastOf<T>(a: Array<T>): T | void
export function lastOf<T>(a: string | Array<T>): string | T | void {
  return a[a.length - 1]
}

export function firstOf(a: string): string
export function firstOf<T>(a: Array<T>): T | void
export function firstOf<T>(a: string | Array<T>): string | T | void {
  return a[0]
}
