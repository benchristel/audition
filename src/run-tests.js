import {test, expect, is} from "@benchristel/taste"
import {
  getAllTests,
  runTests,
  formatTestResultsAsText,
} from "@benchristel/taste"
import "./lexicon"

test("the Taste suite", {
  runs() {
    expect(true, is, true)
  },
})

runTests(getAllTests())
  .then(formatTestResultsAsText)
  .then(console.log)
