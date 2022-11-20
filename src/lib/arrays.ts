import {test, expect, equals} from "@benchristel/taste"

test("fill", {
  "fills an array with a value, up to the specified length"() {
    const fillFoo3 = fill("foo", 3)
    expect(fillFoo3(["bar"]), equals, ["bar", "foo", "foo"])
  },

  "does not mutate the array"() {
    const array = ["bar"]
    fill("foo", 3)(array)
    expect(array, equals, ["bar"])
  },

  "does nothing if the requested length is 0"() {
    expect(fill("foo", 0)([]), equals, [])
  },

  "does nothing if the requested length is negative"() {
    expect(fill("foo", -99)([]), equals, [])
  },

  "does nothing if the array is already the desired length"() {
    expect(fill("foo", 1)(["bar"]), equals, ["bar"])
  },

  "does nothing if the array is longer than the desired length"() {
    expect(fill("foo", 1)(["bar", "baz"]), equals, ["bar", "baz"])
  },
})

export const fill =
  <T>(filler: T, length: number) =>
  (array: Array<T>): Array<T> => {
    const copy = [...array]
    for (let i = 0; i < length - array.length; i++) {
      copy.push(filler)
    }
    return copy
  }
