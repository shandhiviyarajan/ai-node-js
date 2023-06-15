const express = require("express")
const bodyParser = require("body-parser")
const app = express()
const port = process.env.PORT || 3000
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
const getCandidate = require("./routes/getCandidate")
const getCandidateExpert = require("./routes/getCandidateExpert")
const getSimilarJob = require("./routes/getSimilarJob")
const getKeywords = require("./routes/getKeywords")
const getKeywordsFromRole = require("./routes/getKeywordsFromRole")
const getExcludeRole = require("./routes/getExcludeRole")
const getAiAdvice = require("./routes/getAiAdvice")
const getBooleanQueryFromNMP = require("./routes/getBooleanQueryFromNMP")
app.get("/", (req, res) => {
  res.send("Ai Sourcing API End Points")
})
app.use("/getCandidate", getCandidate)
app.use("/getCandidateExpert", getCandidateExpert)
app.use("/getSimilarJob", getSimilarJob)
app.use("/getKeywords", getKeywords)
app.use("/getKeywordsFromRole", getKeywordsFromRole)
app.use("/getExcludeRole", getExcludeRole)
app.use("/getAiAdvice", getAiAdvice)
app.use("/getBooleanQueryFromNMP", getBooleanQueryFromNMP)
app.listen(port)