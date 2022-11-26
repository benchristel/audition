import {
  getAllTests,
  runTests,
  formatTestResultsAsText,
} from "@benchristel/taste"
import "./lexicon"
import "./translator"
import "./lib/mold"
import "./lib/mold-view"

runTests(getAllTests())
  .then(formatTestResultsAsText)
  .then(console.log)
