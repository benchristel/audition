export const matches = (regex: RegExp) =>
  (s: string): boolean =>
    regex.test(s)