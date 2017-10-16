const Koa = require('koa')

const app = new Koa()
const serve = require('koa-static')
app.use(serve('./', {defer: true}))

const server = require('http').createServer(app.callback())

const io = require('socket.io')(server)

io.on('connection', function (socket) {
    socket.on('beginPath', function () {
        socket.broadcast.emit('beginPath', arguments[0])
    })
    socket.on('draw', function () {
        socket.broadcast.emit('draw', arguments[0])
    })
    socket.on('end', function () {
        socket.broadcast.emit('end')
    })
    socket.on('clear', function () {
        socket.broadcast.emit('clear')
    })
})

server.listen(7001)
