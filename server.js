/// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();
const cors = require('cors')
app.use(cors())

let morgan = require('morgan')
app.use(morgan('combined'))

let bodyParser = require('body-parser')
app.use(bodyParser.raw({ type: "*/*" }))

let credentials = new Map()
let tokens = new Map()
let channels = new Map()
let usersInChannel = []
let messages = []

app.get("/sourcecode", (req, res) => {
  res.send(require('fs').readFileSync(__filename).toString())
})

// This endpoint lets users create an account
app.post("/signup", (req, res) => {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    let password = parsed.password

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
    console.log("CREDENTIALS: ")
    console.log(credentials)

})

// LogIn
app.post("/login", (req, res) => {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    let password = parsed.password
    let expectedPassword = credentials.get(username)
    let token = ""
    console.log("expectedPassword", expectedPassword)


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
  
    token = username + Math.random().toString(36).substr(2)
    tokens.set(token, username)
    console.log("TOKENS: ")
    console.log(tokens)
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
  
    if (!tokens.has(tokenId)) {
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
  
    channels.set(channelName, tokenId)
    res.send(JSON.stringify({ success: true }))
    console.log("CHANNELS: ")
    console.log(channels)
})


//The join-channel endpoint lets users join a channel. 
app.post("/join-channel", (req, res) => {
    let parsed = JSON.parse(req.body)
    let channelName = parsed.channelName
    let tokenId = req.headers.token
    
    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    if (channelName == undefined) {
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
      return
    }
  
    if (!channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    }
  
    for (let key in usersInChannel) {
      if (usersInChannel[key].channelName == channelName && usersInChannel[key].user == tokens.get(tokenId) && usersInChannel[key].status.includes("active")) {
        res.send(JSON.stringify({ success: false, reason: "User has already joined" }))
        return
      }
      if (usersInChannel[key].channelName == channelName && usersInChannel[key].user == tokens.get(tokenId) && usersInChannel[key].status.includes("banned")) {
        res.send(JSON.stringify({ success: false, reason: "User is banned" }))
        return
      }
    }
  
    usersInChannel.push({"channelName":channelName, "user": tokens.get(tokenId), "status": "active"})
    res.send(JSON.stringify({ success: true }))
    console.log("USERS IN CHANNEL: ")
    console.log(usersInChannel)
})

//The leave-channel endpoint lets users leave a channel
app.post("/leave-channel", (req, res) => {
    let parsed = JSON.parse(req.body)
    let channelName = parsed.channelName
    let tokenId = req.headers.token
    
    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    if (channelName == undefined) {
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
      return
    }
  
    if (!channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    }
  
    console.log("USERS IN CHANNEL BEFORE REMOVAL: ")
    console.log(usersInChannel)
  
    let response = {}
    for (let key in usersInChannel) {
      if (usersInChannel[key].channelName != channelName || (usersInChannel[key].channelName == channelName && usersInChannel[key].user == tokens.get(tokenId))) {
        response = { success: false, reason: "User is not part of this channel" }
    
      }
    }
  
    for (let key in usersInChannel) {
      if (usersInChannel[key].channelName == channelName && usersInChannel[key].user == tokens.get(tokenId)) {
        usersInChannel.splice(key, 1)
        response = { success: true }
      }
    }
  
    res.send(JSON.stringify(response))
    console.log("USERS IN CHANNEL AFTER REMOVAL: ")
    console.log(usersInChannel)
  
})

//The joined endpoint provides the usernames of everyone in the channel.
app.get("/joined", (req, res) => {
    let channelName = req.query.channelName
    let tokenId = req.headers.token
    
    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    if (channelName == undefined) {
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
      return
    }
  
    if (!channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    }
  
    console.log("USERS IN CHANNEL: ")
    console.log(usersInChannel)
  
    let response = true
    for (let key in usersInChannel) {
            
      if ((usersInChannel[key].channelName.includes(channelName) && usersInChannel[key].user.includes(tokens.get(tokenId)))) {
        response = false
      }
    }

    let list = []
    if(response == true) {
      res.send(JSON.stringify({"success":false,"reason":"User is not part of this channel"}))
      return
    }
    else {
      
      for (let key in usersInChannel) {
        if (usersInChannel[key].channelName.includes(channelName)) {
          list.push(usersInChannel[key].user)
        }
        response = { success: true, joined: list}
      }
    }
  
    console.log("LIST: " + list)
    res.send(JSON.stringify(response))
})

//The delete endpoint lets users delete a channel that they had previously created.
app.post("/delete", (req, res) => {
    let parsed = JSON.parse(req.body)
    let channelName = parsed.channelName
    let tokenId = req.headers.token
    
    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    if (channelName == undefined) {
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
      return
    }
  
    if (!channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    }
  
    if (channels.get(channelName) != tokenId) {
      res.send(JSON.stringify({ success: false, reason: "User is not the owner of this channel" }))
      return
    }
  
    console.log("CHANNELS: " + channels)
    channels.delete(channelName)
    res.send(JSON.stringify({ success: true}))
    console.log("CHANNELS: " + channels)
})

//The kick endpoint lets users kick someone off of a channel.
app.post("/kick", (req, res) => {
    let parsed = JSON.parse(req.body)
    let channelName = parsed.channelName
    let target = parsed.target
    let tokenId = req.headers.token
    
    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    if (channelName == undefined) {
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
      return
    }
  
    if (target == undefined) {
      res.send(JSON.stringify({ success: false, reason: "target field missing" }))
      return
    }
  
    if (!channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    }
  
    if (channels.get(channelName) != tokenId) {
      res.send(JSON.stringify({ success: false, reason: "Channel not owned by user" }))
      return
    }
  
    console.log("USERS IN CHANNEL BEFORE REMOVAL: ")
    console.log(usersInChannel)
    
    for (let key in usersInChannel) {
      if (usersInChannel[key].channelName.includes(channelName) && usersInChannel[key].user.includes(target)) {
        usersInChannel.splice(key, 1)
        res.send(JSON.stringify({ success: true }))
      }
    }

    console.log("USERS IN CHANNEL AFTER REMOVAL: ")
    console.log(usersInChannel)
})

//The ban endpoint lets users ban someone from a channel.
app.post("/ban", (req, res) => {
    let parsed = JSON.parse(req.body)
    let channelName = parsed.channelName
    let target = parsed.target
    let tokenId = req.headers.token
    
    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    if (channelName == undefined) {
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
      return
    }
  
    if (target == undefined) {
      res.send(JSON.stringify({ success: false, reason: "target field missing" }))
      return
    }
  
    if (!channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    }
  
    if (channels.get(channelName) != tokenId) {
      res.send(JSON.stringify({ success: false, reason: "Channel not owned by user" }))
      return
    }
  
    console.log("USERS IN CHANNEL BEFORE BAN: ")
    console.log(usersInChannel)
    
    for (let key in usersInChannel) {
      if (usersInChannel[key].channelName.includes(channelName) && usersInChannel[key].user.includes(target)) {
        usersInChannel.splice(key, 1)
        usersInChannel.push({"channelName":channelName, "user": target, "status": "banned"})
      }
      else {
        usersInChannel.push({"channelName":channelName, "user": target, "status": "banned"})
      }
    }

    res.send(JSON.stringify({ success: true }))
    console.log("USERS IN CHANNEL AFTER BAN: ")
    console.log(usersInChannel)
})

//Tmessage endpoint lets users send a message to a particular channel they have joined.
app.post("/message", (req, res) => {
    let parsed = JSON.parse(req.body)
    let channelName = parsed.channelName
    let contents = parsed.contents
    let tokenId = req.headers.token
    
    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    if (channelName == undefined) {
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
      return
    }
  
    if (contents == undefined) {
      res.send(JSON.stringify({ success: false, reason: "contents field missing" }))
      return
    }
  
    let response = true
    for (let key in usersInChannel) {
            
      if ((usersInChannel[key].channelName.includes(channelName) && usersInChannel[key].user.includes(tokens.get(tokenId)))) {
        response = false
      }
    }


    if(response == true) {
      res.send(JSON.stringify({"success":false,"reason":"User is not part of this channel"}))
      return
    }
    else {
      messages.push({"channelName": channelName, "from": tokens.get(tokenId),"contents": contents})
      response = { success: true}
    }
  
    res.send(JSON.stringify(response))
    console.log(messages)
})

//The messages endpoint lets users see all the messages in a particular endpoint.
app.get("/messages", (req, res) => {
    let channelName = req.query.channelName
    let tokenId = req.headers.token
    
    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    if (channelName == undefined) {
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
      return
    }
  
    if (!channels.has(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    }
  
    console.log("USERS IN CHANNEL: ")
    console.log(usersInChannel)
  
    let response = true
    for (let key in usersInChannel) {
            
      if ((usersInChannel[key].channelName.includes(channelName) && usersInChannel[key].user.includes(tokens.get(tokenId)))) {
        response = false
      }
    }

    let list = []
    if(response == true) {
      res.send(JSON.stringify({"success":false,"reason":"User is not part of this channel"}))
      return
    }
    else {
      
      for (let key in messages) {
        if (messages[key].channelName.includes(channelName)) {
          list.push({"from": messages[key].from, "contents":messages[key].contents})
        }
        response = { success: true, messages: list}
      }
    }
  
    console.log("LIST: " )
    console.log(list)
    res.send(JSON.stringify(response))
})

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
