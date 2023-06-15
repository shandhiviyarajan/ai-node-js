// Required dependencies.
const express = require("express")
const router = express.Router()

router.post("/", (req, res) => {
  let body = req.body
  let job_role = body.jobRole
  let job_type = body.jobType
  let prompt = `give me some terms to exclude as a role level from the boolean search query to refine candidates for "${job_role}", Repond in a list  comma-separated formating`

  const API_KEY = "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"
  const textURL = "https://api.openai.com/v1/completions"

  async function initialize(requestType = "text") {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      }
    }

    if (requestType === "text") {
      options.url = textURL
    }

    return options
  }

  async function createTextRequest(
    model = "text-davinci-003",
    temperature = 0.5,
    maxTokens = 1000
  ) {
    const options = await initialize("text")

    const data = {
      model,
      prompt,
      temperature,
      max_tokens: maxTokens
    }

    let str = "CEO, president, founder, student, intership"
    if (job_type) {
      str =
        "CEO, president, founder, freelancer, consultant, student, intership"
    }

    options.body = JSON.stringify(data)

    const response = await fetch(options.url, options)
    const result = await response.json()
    const typeArr = str.split(",")
    const textArray = result.choices[0].text.split(",")

    textArray.concat(typeArr)

    const results = {
      exclude: textArray.map((job) => {
        return job.replace(/\n\n/g, "").trimLeft()
      })
    }
    res.send(textArray)
  }
  //res.send(typeArr.concat(typeArr))
  createTextRequest()
})
module.exports = router
