import {
  getAllTests,
  runTests,
  formatTestResultsAsText,
} from "@benchristel/taste"
import "./lexicon"
import "./translator"

runTests(getAllTests())
  .then(formatTestResultsAsText)
  .then(console.log)
