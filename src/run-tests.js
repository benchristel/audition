import {
  getAllTests,
  runTests,
  formatTestResultsAsText,
} from "@benchristel/taste"
import "./lexicon"
import "./translator"
import "./args"
import "./text"
import "./generator"

runTests(getAllTests())
  .then(formatTestResultsAsText)
  .then(console.log)
