// Required dependencies.
const express = require("express")
const router = express.Router()

router.post("/", (req, res) => {
  let data = req.body
  let job_role = data.jobRole
  let prompt = `Can you provide me with different job titles and roles that are related to the skills and experience needed for a '${job_role}' ,respond a list in comma-separated formating`

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

    options.body = JSON.stringify(data)

    const response = await fetch(options.url, options)
    const result = await response.json()

    const results = {
      similar: result.choices[0].text.split(",").map((job) => {
        job.replace(/\n\n/g, "").trimLeft()
      })
    }
    res.send(results)
  }

  let returnText = createTextRequest()
})
module.exports = router
