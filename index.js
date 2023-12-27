const express = require('express');
const app = express();
const cors = require('cors');
const {Server} = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

app.use(cors());
app.use(express.json());

const server = app.listen(process.env.PORT || 8000, () => {
    console.log(`Listening on port ${process.env.PORT || 8000}`);
})

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    const roomName = socket.handshake.query.roomName;
    if(['', undefined, null].includes(roomName?.trim())) {
        socket.emit('error', 'Invalid room name');
        socket.disconnect();
        return;
    }
    socket.join(roomName);
    socket.onAny((event, ...args) => {
        socket.to(roomName).emit(event, ...args);
    })
    socket.on('disconnect', () => {
        socket.leave(roomName);
        if(!io.sockets.adapter.rooms.get(roomName)?.size){
            io.sockets.adapter.rooms.delete(roomName);
        }
    })
})