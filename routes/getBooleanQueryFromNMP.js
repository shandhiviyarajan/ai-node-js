// Required dependencies.
const express = require("express")
const router = express.Router()
const API_KEY = "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"
const textURL = "https://api.openai.com/v1/completions"
router.post("/", (req, res) => {
  let { searchterm } = req.body
  function initialize(requestType = "text") {
    let url = textURL

    if (requestType === "image") {
      url = imageURL
    }

    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      }
    })
  }

  // Returns text
  async function createTextRequest(
    prompt,
    model = "text-davinci-003",
    temperature = 0.5,
    maxTokens = 1000
  ) {
    let options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      },
      body: prompt
    }
    const response = await fetch(textURL, options)
    const responseData = await response.json()
    res.send(responseData)
    return responseData.choices[0].text || ""
  }

  function polishString(data) {
    const chatGPTchoices = data
    const chatGPTResultsFormat = chatGPTchoices.split("\n").map((v) => {
      if (v !== "" || v !== undefined) {
        const split = v.split(":")
        return {
          type: split[0],
          content: split[1] || ""
        }
      }
    })

    let role = ""
    let keywords = ""
    let excludes = ""
    let locationCity = ""
    let locationCountry = ""

    chatGPTResultsFormat.forEach((item) => {
      const type = item.type

      if (type.includes("ole")) {
        role = item.content.trim()
      } else if (type.includes("eywor")) {
        keywords = item.content.trim()
      } else if (type.includes("xcl")) {
        excludes = item.content.trim()
      } else if (type.includes("ity")) {
        locationCity = item.content.trim()
      } else if (type.includes("ountry")) {
        locationCountry = item.content.trim()
      }
    })

    const combination = role.split(",").map((roleParsed) => {
      let searchQuery = "site:linkedin.com/in "
      searchQuery += `intitle:"${roleParsed}" `

      if (keywords !== "") {
        const keywords_ = keywords.split(",").map((k) => k.trim().toLowerCase())
        searchQuery += `intext:{"${keywords_.join('" OR "')}"} `
      }

      searchQuery += `("${locationCity}" AND "${locationCountry}") `

      if (excludes !== "") {
        const excludes_ = excludes.split(",").map((e) => e.trim().toLowerCase())
        searchQuery += excludes_.map((exclude) => `-"${exclude}"`).join(" ")
      }

      return searchQuery
    })

    return combination
  }

  async function handlePostRequest() {
    const prompt = `act as expert hiring talent and NLP expert, extract the informations from this query :"${searchterm}", give me the key keywords to find that role and give me a list of similar or related job role.
  instruction to parse the query:
  count years if you get years otherwise experience=0
  term starts with Hyphen, it means exclude term exclude c-level or clevel means exclude_role=CEO, Director, president, founder,freelancer, freelance, independant

  output :
  Role: "", 
  key: "", "", "", 
  related: "", "", "", 
  experience: "", 
  location_city: "", 
  location_country: "", 
  extra: "", "", "", 
  exclude": "", "", "", 

  format: flattern text`

    const result = await createTextRequest(prompt)
    const formattedResult = polishString(result)

    res.send(formattedResult)
  }

  ;(async () => {
    await handlePostRequest()
  })()
})

module.exports = router
