import {
  getAllTests,
  runTests,
  formatTestResultsAsText,
} from "@benchristel/taste"
import "./lexicon"
import "./translator"
import "./args"
import "./text"

runTests(getAllTests())
  .then(formatTestResultsAsText)
  .then(console.log)
