'use strict'

var port    = +process.argv[ 2 ] || +process.env.PORT || 8080,
    serve   = require('serve-static')(__dirname + '/www'),
    destroy = require('server-destroy'),
    next    = require('finalhandler'),
    server  = require('http')
        .createServer(onrequest)
        .listen(8080, onlistening)

destroy(server)

process
    .on('SIGTERM', exit)
    .on('SIGINT', exit)
    .on('SIGHUP', noop)

function onrequest(req, res) {
    serve(req, res, next(req, res))
}

function onlistening() {
    console.log()
    console.log('server is ready to accept connections on port', port)
    console.log('press ^C to exit')
    console.log()
}

function exit() {
    server.destroy()
    console.log()
}

function noop() {}
