let http = require('http');

let port = {
        http: 80,
        socket: 81
    },
    sockets = {
        gate_io: null,  // WebSocket z WWW (socket.io)
        gate_ws: null   // WebSocket z ARDUINO (websocket)
    };

let app = require('../app')(sockets);
app.set('port', port.http);

let httpServer = http.createServer(app);
httpServer.listen(port.http, () => {console.log((new Date()) + ' httpServer is listening on port ' + port.http)});

let socketServer = http.createServer((req, res) => {
    console.log((new Date()) + ' WS: Received request for ' + req.url + " (" + (req.headers["X-Forwarded-For"] || req.connection.remoteAddress) + ")");
    res.writeHead(404);
    res.write('websocket only');
    res.end();
});
socketServer.listen(port.socket, () => {console.log((new Date()) + ' socketServer is listening on port ' + port.socket)});


let gate_io = require('../src/io/gate')(httpServer);
gate_io.common = sockets;
gate_io.common.gate_io = gate_io;

let gate_ws = require('../src/socket/socket')(socketServer);
gate_ws.common = sockets;
gate_ws.common.gate_ws = gate_ws;
