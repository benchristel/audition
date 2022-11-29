import {expect, is, test} from "@benchristel/taste"

test("WeightedRandomVariable", {
  "always picks a lone possibility"() {
    const v = WeightedRandomVariable(
      [1],
      () => 1,
      () => 0.5,
    )
    expect(v(), is, 1)
  },

  "picks the first of two possibilities when rng is low"() {
    const v = WeightedRandomVariable(
      [1, 2],
      () => 1,
      () => 0.49,
    )
    expect(v(), is, 1)
  },

  "picks the second of two possibilities when rng is high"() {
    const v = WeightedRandomVariable(
      [1, 2],
      () => 1,
      () => 0.51,
    )
    expect(v(), is, 2)
  },

  "weights"() {
    const v = WeightedRandomVariable(
      [99, 1],
      (x) => x,
      () => 0.9,
    )
    expect(v(), is, 99)
  },
})

export function WeightedRandomVariable<T>(
  possibilities: Array<T>,
  weigh: (x: T) => number,
  rng: () => number,
): () => T {
  let totalWeight = 0
  const weighted = possibilities.map((p) => {
    totalWeight += weigh(p)
    return [p, totalWeight] as [T, number]
  })
  return () => {
    const random = rng() * totalWeight
    for (const [p, w] of weighted) {
      if (w > random) return p
    }
    return weighted[0][0]
  }
}
