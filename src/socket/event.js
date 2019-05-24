exports.load_common_event = function(request, connection, socket) {

    console.log((new Date()) + " new SOCKET user", connection.id, connection.remoteAddress);
    connection.sendUTF("hello user " + connection.id + " from " + connection.remoteAddress);
    socket.connections[connection.id] = connection;
    socket.common.gate_io.emit("gate", {status: "GATE_CONNECTED", message: "socket client connected"} );

    socket.on("disconnect", function() {
        console.log((new Date()) + " SOCKET client disconnected", conection.id, connection.remoteAddress);
        socket.common.gate_io.emit("gate", {status: "GATE_DISCONNECTED", message: "socket client disconnected"} );
        socket.connections[connection.id] = null;
    });

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + " SOCKET Peer " + connection.id + " (" + connection.remoteAddress + ") disconnected.");
        socket.common.gate_io.emit("gate", {status: "GATE_DISCONNECTED", message: "socket client disconnected"} );
        socket.connections[connection.id] = null;
    });

};

exports.load_user_event = function (request, connection, socket) {

    connection.sendUTF("receiving data!");

    connection.on("message", function(message) {
        if (message.type === "utf8") {
            if (["OPEN_GATE_START_RESPONSE", "OPEN_GATE_END_RESPONSE"].includes(message.utf8Data)) {
                console.log((new Date()) + " Received Message: " + message.utf8Data + " from SOCKET " + connection.id + ", sending by IO");
                socket.common.gate_io.emit("gate", {status: message.utf8Data} );

            } else if (["2"].includes(message.utf8Data)) {
                socket.common.gate_io.emit("gate", {status: "GATE_HEARTBEAT"} );
            }
        }
        else if (message.type === "binary") {
            console.log((new Date()) + " Received Binary Message of " + message.binaryData.length + " bytes");
            connection.sendBytes(message.binaryData);
        }
    });
};