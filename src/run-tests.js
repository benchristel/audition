import {
  getAllTests,
  runTests,
  formatTestResultsAsText,
} from "@benchristel/taste"
import "./main"

runTests(getAllTests())
  .then(formatTestResultsAsText)
  .then(console.log)
