let http = require('http');
let https = require('https');
let privateKey  = fs.readFileSync('../sslcert/server.key', 'utf8');
let certificate = fs.readFileSync('../sslcert/server.crt', 'utf8');

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
app.set('port', port.http);

let httpServer = http.createServer(app);
let httpsServer = https.createServer({key: privateKey, cert: certificate}, app);

httpServer.listen(port.http, () => {console.log((new Date()) + ' httpServer is listening on port ' + port.http)});
httpsServer.listen(port.https);

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
