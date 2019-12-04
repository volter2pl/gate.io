let fs = require('fs');
let http = require('http');
let https = require('https');
let key  = fs.readFileSync('sslcert/server.key', 'utf8');
let cert = fs.readFileSync('sslcert/server.crt', 'utf8');

let port = {
        http: 80,
        https: 443,
        socket: 81
    },
    sockets = {
        gate_io: null,  // WebSocket z WWW (socket.io)
        gate_ws: null   // WebSocket z ARDUINO (websocket)
    };

let app = require('../app')(sockets);
app.set('port', port.https);

let httpServer = http.createServer((req, res) => {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
});
httpServer.listen(port.http, () => {console.log((new Date()) + ' httpServer is listening on port ' + port.http)});

let httpsServer = https.createServer({key, cert}, app);
httpsServer.listen(port.https, () => {console.log((new Date()) + ' httpsServer is listening on port ' + port.https)});

let socketServer = http.createServer((req, res) => {
    console.log((new Date()) + ' WS: Received request for ' + req.url + " (" + (req.headers["X-Forwarded-For"] || req.connection.remoteAddress) + ")");
    res.writeHead(404);
    res.write('websocket only');
    res.end();
});
socketServer.listen(port.socket, () => {console.log((new Date()) + ' socketServer is listening on port ' + port.socket)});


let gate_io = require('../src/io/gate')(httpsServer);
gate_io.common = sockets;
gate_io.common.gate_io = gate_io;

let gate_ws = require('../src/socket/socket')(socketServer);
gate_ws.common = sockets;
gate_ws.common.gate_ws = gate_ws;
