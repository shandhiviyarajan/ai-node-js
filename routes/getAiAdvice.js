// Required dependencies.
const express = require("express")
const router = express.Router()

router.post("/", (req, res) => {
  const data = req.body
  let linkedin_url = "https://www.linkedin.com/in/ghazimejaat/"
  let search_term = "Crypto Head of Marketing"
  let skills = "SEO, SEM, Crypto"

  const API_KEY = "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"
  const textURL = "https://api.openai.com/v1/completions"
  // const imageURL = "https://api.openai.com/v1/images/generations"

  // Create Chat GPT prompt
  async function createTextRequest(
    prompt,
    model = "text-davinci-003",
    temperature = 0.5,
    maxTokens = 1000
  ) {
    const requestData = {
      model,
      prompt,
      temperature,
      max_tokens: maxTokens
    }

    try {
      const response = await fetch(textURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestData)
      })
      const responseData = await response.json()
      return responseData.choices[0].text || false
    } catch (error) {
      console.log(error?.message)
      res.send(error?.message)
    }
  }

  //fetch candidate data from datagma
  async function fetchCandidateData(linkedinUrl) {
    const apiUrl = "https://gateway.datagma.net/api/ingress/v2/full"
    const apiId = "9d661a9a1f47"

    const url = `${apiUrl}?apiId=${apiId}&data=${encodeURIComponent(
      linkedinUrl
    )}&personFull=true`

    try {
      const response = await fetch(url)

      let personInfo = await response.json()

      return personInfo
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async function handlePostRequest() {
    const personData = await fetchCandidateData(linkedin_url)

    const prompt = `Analyse the profile data and give me the following information regarding the role ${search_term} and his skills ${skills}:
    - Give me a short summary according to the role of ${search_term}, no more than 20 words
    - Relevant Skills: his 5 key relevant skills for the role of ${search_term}
    - Relevant key traits: his 5 relevant key traits for this role
    - Role level: his actual role level
    - Experience: the number of years of experience
    - Good for role: tell me if it is a good fit or could be not
    - Score: give me a score from 1 to 10 according to his adaptability to do the job for this role
    - Classification: give me his role classification
    - Sentiment Analysis: sentiment between matching profile data and the role (positive, neutral, negative)
    - Ready to move: based on his only the latest active role, if he has more than 2 years it means that he is ready to move, then say yes otherwise no. Give me in a shortened way and keywords only.
    
    Profile data: ${personData}`

    // res.send(personData)

    const result = await createTextRequest(prompt)

    let finalAdvice =
      (result && result.split("\n").map((r) => r.split(":"))) || ""

    finalAdvice = finalAdvice.filter((fa) => fa.length > 1)

    let advice = {
      finalAdvice
    }
    res.send(advice)
  }

  ;(async () => {
    await handlePostRequest()
  })()
})

module.exports = router
