// Required dependencies.
const express = require("express")
const router = express.Router()

// Post route
router.post("/", (req, res) => {
  // Extracting data from request body
  let data = req.body

  // Setting up headers for GPT API request
  const GPTheaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer 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`
  }
  let emailQuery,
    Role,
    Keywords,
    ExcludeWords,
    City,
    Country = ""

  // Setting up the input for GPT
  let chatGTPQuery = []
  let searchterm_soft_role = {
    value: data.jobRole
  }

  let location_soft_input = {
    value: data.jobLocation
  }

  let find_with_email = {
    value: data.is_email
  }

  let pagination_numbers = {
    value: data.patination
  }

  // Generating data for GPT prompt
  const propmptData = () => {
    return {
      prompt: `act as expert hiring talent and NLP expert, extract the informations from this query :"looking for ${searchterm_soft_role.value} in ${location_soft_input.value} exclude the not appropieted role", give me the key keywords to find that role and give me a list of similar or related job role.
      instruction to parse the query: 
      count years if you get years otherwise experience=0 term 
      starts with Hyphen, it means exclude term exclude c-level or clevel means excluderole=CEO, Director, president, founder 
      output :
      Role: "",
      key: "", "", "",
      related_job_roles: "", "", "",
      experience: "",
      city: "",
      country: "",
      extra: "", "", "",
      exclude": "", "", "",
      format: flattern text`,
      max_tokens: 1000,
      temperature: 0.7,
      n: 1,
      stop: null
    }
  }

  //send prompt to chat GPT
  const GPTPrompt = async () => {
    let fetchFromChatGPT = `https://api.openai.com/v1/engines/text-davinci-003/completions`
    //const enrichResponse =  await fetch(fetchURL, options).then(results=>results.text());
    const scoreResponse = await fetch(fetchFromChatGPT, {
      method: "POST",
      headers: GPTheaders,
      body: JSON.stringify(propmptData())
    }).then((results) => results.text())
    let prompt = JSON.parse(scoreResponse)
    let queryText = prompt.choices[0].text
    console.log("ChatGPT query", queryText)
    return queryText
  }

  // Function to format results from GPT
  // We split the result by newline and for each line we split by ':'
  const formatGPTQueryResults = (response) => {
    let chatGPTResultsFormat =
      response &&
      response.split("\n").map((v) => {
        if (v !== "" || v !== undefined) {
          return {
            type: v.split(":")[0],
            content: v.split(":")[1] || ""
          }
        }
      })

    let RelatedJobs = chatGPTResultsFormat.filter((v) =>
      v.type.includes("elated")
    )[0].content
    Role =
      chatGPTResultsFormat
        .filter((v) => v.type.includes("ole"))[0]
        .content.replace(",", "") || ""
    Keywords = chatGPTResultsFormat
      .filter((v) => v.type.includes("ey"))[0]
      .content.trim()
      .replace(/,+$/, "")
      .split(",")
      .map((r) => r.trimLeft())

    if (Keywords.length > 0) {
      Keywords =
        Keywords.map((c) => `"${c}"`)
          .filter((k) => k.length > 0)
          .join(" OR ") || ""
    } else {
      Keywords = Keywords.join(" OR ") || ""
    }

    Keywords = Keywords.includes("OR") ? `(${Keywords})` : Keywords

    ExcludeWords =
      chatGPTResultsFormat
        .filter((v) => v.type.includes("xclude"))[0]
        .content.split(",")
        .map((e) => {
          return `-"${e.trimLeft()}"`.replace(".", "")
        })
        .join(" ") || ""

    City = chatGPTResultsFormat
      .filter((v) => v.type.includes("ity"))[0]
      .content.replace(",", "")

    Country = chatGPTResultsFormat
      .filter((v) => v.type.includes("ountry"))[0]
      .content.replace(",", "")
    //
    let extendedRole = [
      Role,
      ...RelatedJobs.split(",").map((rj) => rj.trimLeft())
    ]

    console.log("similar jobs", extendedRole)
    //query for google from chatgpt
    chatGTPQuery = extendedRole.map((er) => {
      if (find_with_email.value) {
        emailQuery = ` ("@gmail.com" OR "@yahoo.*" OR "@msn.*" OR "@outlook.*" OR "@hotmail.*" )`
      }
      return `"${er}" ${Keywords} ${ExcludeWords} ("${City}" AND "${Country}") ${emailQuery}`
    })
  }

  // We are preparing to send our query to Google using Custom Search API
  //var key = "AIzaSyCzJSI6jnGd7L-gtFTsPVviZVK8e5dSnXA"
  //let searchEngineId = "71dad861b05c246a9"
  let key = "AIzaSyDksDd3fC0E_NtloOdThhE2HhNzyYpZOJo"
  let searchEngineId = "b196af71d330f4ff3"
  let prefix = "site:linkedin.com/in"

  // Setting up options for GET request
  var options = {
    method: "GET",
    contentType: "application/json"
  }

  // Function to get results from Google API
  const getResultsGoogle = async (query, page) => {
    let search_tem = `${prefix} ${query}`
    let fetchURL = `https://www.googleapis.com/customsearch/v1?key=${key}&start=${
      page * 10
    }&q=${search_tem}&cx=${searchEngineId}`
    const response = await fetch(fetchURL, options).then((results) =>
      results.text()
    )
    let data = JSON.parse(response)

    if (data?.error?.code === 429) {
      res.send(data)
    }
    return data?.items
  }

  // Defining the array to store all candidates
  let allCandidates = []
  let promises = []

  // Function to fetch all pages
  const fetchAllPages = async (paginations) => {
    chatGTPQuery.map((query) => {
      paginations.forEach((element) => {
        promises.push(getResultsGoogle(query, element))
      })
    })

    const all_items = await Promise.all(promises)
    return all_items
  }

  // Function to format results and run Google query
  const formatResultsAndRunGoogleQuery = async (response, paginations) => {
    return new Promise((resolve) => {
      let a = fetchAllPages(paginations)
      resolve(a)
    })
  }

  // Function to return GPT prompt results
  const returnPromptResults = async (paginations) => {
    return new Promise((resolve) => {
      try {
        GPTPrompt().then((response) => {
          formatGPTQueryResults(response)
          formatResultsAndRunGoogleQuery(response, paginations).then((r) => {
            resolve(r)
          })
        })
      } catch (error) {
        res.send(error)
        console.log("error", error)
      }
    })
  }

  // Defining the array for pagination
  const paginations = new Array(pagination_numbers.value).fill(0)
  let finalGoogleResults = []
  ;(async () => {
    cquery = await returnPromptResults(paginations)
    cquery.forEach((element) => {
      finalGoogleResults.push(...element)
    })

    finalGoogleResults = finalGoogleResults.filter((obj, index, self) => {
      return index === self.findIndex((o) => o.link === obj.link)
    })

    //return finalGoogleResults
    let fullResults = finalGoogleResults.map((result) => {
      let str = result.htmlTitle

      const firstDashIndex = str.indexOf("-")
      const lastDashIndex = str.lastIndexOf("-")

      const fullName = str.substring(0, firstDashIndex).trim()
      let company = str.substring(lastDashIndex + 1).trim()
      if (company.indexOf("|")) {
        company = company.split("|")[0]
      }
      const actualRole = str
        .substring(firstDashIndex, lastDashIndex - 1)
        .trim()
        .replace(/<[^>]+>/g, "")

      return {
        fullName,
        actualRole,
        company,
        ...result
      }
    })
    // Send the results back as a response
    res.send({
      total: fullResults.length,
      results: fullResults
    })
  })()
})

module.exports = router
