module.exports = function(httpServer) {

    let io = require('socket.io')(httpServer);
    let gate_io = io.of('/gate');

    gate_io.on('connection', function (socket) {

        /* nowy user, wysyłamy stan bramy */
        console.log((new Date()) + ' New IO user', socket.id);
        socket.emit('gate', {
            status: gate_io.common.gate_ws.connections.length ? "GATE_CONNECTED" : "GATE_DISCONNECTED"
        });

        socket.on('disconnect', function() {
            console.log((new Date()) + " IO client disconnected", socket.id);
        });

        /* obsługa requestów przychodzących z frontendu */
        socket.on('gate', function (button) {
            if (button.pressing === true) {
                console.log((new Date()) + ' Open gate START request from io user');

                socket.emit('gate', {
                    status: 'OPEN_GATE_START_REQUEST',
                    message: 'request START received'
                });
                socket.broadcast.emit('gate', {
                    status: 'OPEN_GATE_START_REQUEST',
                    message: 'someone starts to open the gate'
                });

                gate_io.common.gate_ws.broadcast('OPEN_GATE_START_REQUEST');

            } else if (button.pressing === false) {
                console.log((new Date()) + ' Open gate END request from io user');

                socket.emit('gate', {
                    status: 'OPEN_GATE_END_REQUEST',
                    message: 'request END received'
                });
                socket.broadcast.emit('gate', {
                    status: 'OPEN_GATE_END_REQUEST',
                    message: 'someone finishes opening the gate'
                });

                gate_io.common.gate_ws.broadcast('OPEN_GATE_END_REQUEST');
            }
        });

    });

    return gate_io;
};
