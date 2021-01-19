const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')

const app = new express()
const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(publicDirPath))


io.on('connection', (socket) => {
    console.log('New websocket connection')

    socket.on('join', ({ username, room }) => {
        socket.join(room)

        console.log(username)

        socket.emit('message', generateMessage('Welcome!'))
        // To emit event to all connected sockets except the socket in which it is trigger 
        socket.broadcast.to(room).emit('message', generateMessage(` ${username} has joined ${room}! `))
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profanity not allowed')
        }
        io.emit('message', generateMessage(message))
        callback('Delivered')
    })

    socket.on('sendLocation', (coords, callback) => {
        io.emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        io.emit('message', generateMessage('A user has left !'))
    })
})



server.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})

