export function empty(a: Array<unknown> | string): boolean {
  return a.length === 0
}

export function setDiff<T>(a: Array<T>, b: Array<T>): Array<T> {
  return a.filter(item => !b.includes(item))
}
