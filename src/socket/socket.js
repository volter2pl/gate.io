module.exports = function(socketServer) {

    let WebSocketServer = require('websocket').server;
    let users = require('../../users').arduino;
    let uuid = require('uuid/v4');

    let gate_ws = new WebSocketServer({
        httpServer: socketServer,
        autoAcceptConnections: false
    });
    gate_ws.connections = [];

    gate_ws.broadcast = function broadcast(data) {
        gate_ws.connections.forEach(function each(connection) {
            connection.sendUTF(data);
        });
    };

    let socketEvent = require('./event');

    function authenticate(req) {
        const base64Credentials =  req.httpRequest.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');
        if (users[username] === password) {
            console.log((new Date()) + " SOCKET connection accepted. [" + username + "]");
            return true;
        } else {
            console.log((new Date()) + " SOCKET connection rejected. [" + username + ", " + password + "]");
            return false;
        }
    }

    gate_ws.on('request', function (req) {
        req.httpRequest.connection.on('error', () => null);
        if (!authenticate(req)) {
            req.reject();
            return;
        }

        var connection = req.accept('arduino', req.origin);
        connection.id = uuid();
        socketEvent.load_common_event(req, connection, gate_ws);
        socketEvent.load_user_event(req, connection, gate_ws);

    });

    return gate_ws;
};