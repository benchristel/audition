import {test, expect, is} from "@benchristel/taste"
import { getAllTests, runTests, formatTestResultsAsText } from "@benchristel/taste"

test("the Taste suite", {
  "runs"() {
    expect(true, is, true)
  },
})

runTests(getAllTests())
  .then(formatTestResultsAsText)
  .then(console.log)