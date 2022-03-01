// require('dotenv').config();

const express = require("express");
const socket = require("socket.io");
const app = express();
// var fs = require("fs");
var http = require("http");
// var https = require("https");
// var credentials = {
//   key: fs.readFileSync("key.pem"),
//   cert: fs.readFileSync("cert.pem"),
// };
var httpServer = http.createServer(app);
// var httpsServer = https.createServer(credentials, app);

const server = httpServer.listen(process.env.PORT || 4000, (err) => {
  if (err) console.log(err);
  else console.log("Server Started at port 4000");
});

// app.use(express.static('Public'));

var io = socket(server, {
  cors: {
    origin: "http://127.0.0.1:5500/",
    credentials: true,
  },
});
// var io = socket(server);

io.on("connection", (socket) => {
  console.log("Connected: ", socket.id);

  socket.on("join", (roomName) => {
    var rooms = io.sockets.adapter.rooms;
    var room = io.sockets.adapter.rooms.get(roomName);

    if (room == undefined) {
      socket.join(roomName);
      socket.emit("created");
    } else if (room.size == 1) {
      socket.join(roomName);
      socket.emit("joined");
    } else {
      socket.emit("full");
    }
    console.log("rooms-->", rooms);
  });

  socket.on("ready", (roomName) => {
    console.log("ready");
    socket.broadcast.to(roomName).emit("ready");
  });

  socket.on("candidate", (candidate, roomName) => {
    console.log("candidate");
    socket.broadcast.to(roomName).emit("candidate", candidate);
  });

  socket.on("offer", (offer, roomName) => {
    console.log("offer");
    socket.broadcast.to(roomName).emit("offer", offer);
  });

  socket.on("answer", (answer, roomName) => {
    console.log("answer");
    socket.broadcast.to(roomName).emit("answer", answer);
  });

  socket.on("endCall", (roomName) => {
    console.log("endCall");
    socket.leave(roomName);
    socket.broadcast.to(roomName).emit("endCall");
  });
});
