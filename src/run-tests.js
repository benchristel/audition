import {
  getAllTests,
  runTests,
  formatTestResultsAsText,
} from "@benchristel/taste"
import "./lexicon"
import "./translator"
import "./args"

runTests(getAllTests())
  .then(formatTestResultsAsText)
  .then(console.log)
