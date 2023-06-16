const express = require("express")

const router = express.Router()

router.post("/", (req, res) => {
  let data = req.body

  let role = data.jobRole
  let similarJobs = data.similarjob
  let isEmail = data.email
  let skill = data.skill.map((s) => `"${s}"`).join(" OR ")
  let extended_role = new Array(1).fill(role)

  if (!data.job_role_exact_search) {
    extended_role.push(...similarJobs)
  }
  let emailQuery = ""
  let city = data.location_city
  let country = data.location_country
  let exclude = data.exclude
    .split(",")
    .map((e) => {
      return ` -"${e.trimLeft()}" `.replace(".", "")
    })
    .join(" ")
  let education = data.education || ""
  switch (data.education) {
    case "Degree":
      education = education + "&as_oq=bachelordegreelicence"
      break

    case "Masters Degree":
      education =
        education +
        "&as_oq=mastersmbamasterdiplomemscmagistermagisteresmaitrise"
      break

    case "Doctoral Degree":
      education =
        education +
        "&as_oq=drPh.D.PhDD.PhilDPhildoctorDoctoradoDoktorDoctoratDoutoradoDrScTohtoriDoctorateDoctoraDuktorahDottoratoDaktarasDoutoramentoDoktorgrad"
      break

    default:
      break
  }

  if (isEmail) {
    emailQuery = `("@gmail.com" OR "@yahoo.*" OR "@msn.*" OR "@outlook.*" OR "@hotmail.*" )`
  }
  let chatGTPQuery = []
  chatGTPQuery =
    extended_role &&
    extended_role.map((er) => {
      return `"${er}" (${skill}) ${exclude} ("${city}" AND "${country}") ${emailQuery} ${education}`
    })
  //res.send(chatGTPQuery)
  // var key = "AIzaSyCzJSI6jnGd7L-gtFTsPVviZVK8e5dSnXA"
  // let searchEngineId = "71dad861b05c246a9"

  let key = "AIzaSyDksDd3fC0E_NtloOdThhE2HhNzyYpZOJo"
  let searchEngineId = "b196af71d330f4ff3"
  let prefix = "site:linkedin.com/in "

  //fetch options
  var options = {
    method: "GET",
    contentType: "application/json"
  }
  //get google results
  const getResultsGoogle = async (query, page) => {
    let search_tem = `${prefix} ${query}`
    let fetchURL = `https://www.googleapis.com/customsearch/v1?key=${key}&start=${
      page * 10
    }&q=${search_tem}&cx=${searchEngineId}`
    const response = await fetch(fetchURL, options).then((results) =>
      results.text()
    )
    let data = JSON.parse(response)
    if (data?.error) {
      res.send(data)
    }
    return data?.items || []
  }
  //all candidates
  let allCandidates = []
  //fetch all pages
  let promises = []
  const fetchAllPages = async (paginations) => {
    chatGTPQuery.map((query) => {
      paginations.forEach((element) => {
        promises.push(getResultsGoogle(query, element))
      })
    })

    const all_items = await Promise.all(promises)
    return all_items
  }

  const returnPromptResults = async (paginations) => {
    return new Promise((resolve) => {
      let a = fetchAllPages(paginations)
      resolve(a)
    })
  }

  const enrichEachCandidate = async (linkedinURL) => {
    let datagmaURL = "https://gateway.datagma.net/api/ingress/v2/full"
    let API_KEY = [
      "9d661a9a1f47",
      "0icR9YHm",
      "TondByn1",
      "9d661a9a1f47",
      "0icR9YHm",
      "TondByn1"
    ]

    var randomIndex = Math.floor(Math.random() * API_KEY.length)
    let fetchURL = `${datagmaURL}?apiId=${API_KEY[randomIndex]}&data=${linkedinURL}&personFull=true`
    let enrichResponse = await fetch(fetchURL, options).then((results) =>
      results.text()
    )

    let data = JSON.parse(enrichResponse)
    if (data?.error) {
      res.send(data)
    }
    return data || []
  }

  const paginations = new Array(data.pagination).fill(0)
  let finalGoogleResults = []
  let promisesEnrich = []
  let is_enrichement = data.enrich
  let enrichedResults = ""
  ;(async () => {
    cquery = await returnPromptResults(paginations)
    cquery.forEach((element) => {
      finalGoogleResults.push(...element)
    })

    finalGoogleResults = finalGoogleResults.filter((obj, index, self) => {
      return index === self.findIndex((o) => o.link === obj.link)
    })

    if (is_enrichement) {
      finalGoogleResults.map((result) => {
        console.log(result.link)
        promisesEnrich.push(enrichEachCandidate(result.link))
      })

      enrichedResults = await Promise.all(promisesEnrich)
      console.log(enrichedResults)
      res.send({
        total: enrichedResults.length,
        enrichedResults
      })
    } else {
      fullResults = finalGoogleResults.map((result) => {
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

      res.send({
        total: fullResults.length,
        results: fullResults
      })
    }
  })()
})

module.exports = router
