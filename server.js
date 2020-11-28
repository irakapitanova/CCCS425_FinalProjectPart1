// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();

let morgan = require('morgan')
app.use(morgan('combined'))

let bodyParser = require('body-parser')
app.use(bodyParser.raw({ type: "*/*" }))

let credentials = new Map()
let channels = new Map()
let token = ""

// This endpoint lets users create an account
app.post("/signup", (req, res) => {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    let password = parsed.password
    console.log("username", username)
    console.log("password", password)


    if (username == undefined) {
        res.send(JSON.stringify({ success: false, reason: "username field missing" }))
        return
    }

    if (password == undefined) {
        res.send(JSON.stringify({ success: false, reason: "password field missing" }))
        return
    }
  
    if (credentials.has(username)) {
        res.send(JSON.stringify({ success: false, reason: "Username exists" }))
        return
    }

    credentials.set(username, password)
    res.send(JSON.stringify({ success: true }))

})

// LogIn
app.post("/login", (req, res) => {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    let password = parsed.password
    let expectedPassword = credentials.get(username)
    console.log("username", username)
    console.log("password", password)


    if (username == undefined) {
      res.send(JSON.stringify({ success: false, reason: "username field missing" }))
      return
    }

    if (password == undefined) {
      res.send(JSON.stringify({ success: false, reason: "password field missing" }))
      return
    }
  
    if (expectedPassword === undefined) {
      res.send(JSON.stringify({ success: false, reason: "User does not exist" }))
      return
    }
  
    if (expectedPassword !== password) {
      res.send(JSON.stringify({ success: false, reason: "Invalid password" }))
      return
    }
  
     token = "" + Math.random().toString(36).substr(2)
  
    res.send(JSON.stringify({ success: true, token: token }))
})

//The create channel is used to create a chat channel where people can chat.
app.post("/create-channel", (req, res) => {
    let parsed = JSON.parse(req.body)
    let channelName = parsed.channelName
    
    let tokenId = req.headers.token
    
    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (tokenId != token) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    if (channelName == undefined) {
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
      return
    }
  
    if (channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel already exists" }))
        return
    }
  
    channels.set(channelName)
    res.send(JSON.stringify({ success: true }))
})



// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
