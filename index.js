const express = require("express");
const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const request = require("request");

dotenv.config();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("OK ! ACTIVE");
});

setInterval(() => {
  request("https://your-socket-backend.onrender.com");
}, 1000 * 60 * 25);

const server = app.listen(process.env.PORT || 8000, () => {
  console.log(`Listening on port ${process.env.PORT || 8000}`);
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  const roomName = socket.handshake.query.namespace;
  if (["", undefined, null].includes(roomName?.trim())) {
    socket.emit("error", "Invalid Name Space");
    socket.disconnect();
    return;
  }
  socket.emit("connect_success", {socketID: socket.id})
  socket.join(roomName);
  socket.on("SEND_TO", ([target,event, ...args]) => {
    socket.to(target).emit(event, ...args);
  })
  socket.onAny((event, ...args) => {
    if(event === 'SEND_TO') return;
    socket.to(roomName).emit(event, ...args);
  });
  socket.on("disconnect", () => {
    socket.leave(roomName);
    if (!io.sockets.adapter.rooms.get(roomName)?.size) {
      io.sockets.adapter.rooms.delete(roomName);
    }
  });
});
