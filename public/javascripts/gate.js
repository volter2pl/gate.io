class Gate {
    constructor(url, activator, led, log) {
        this.url = url;
        this.activator = activator;
        this.led = led;
        this.log = log;
        this.socketRegisterEvents(this);

        (("ontouchstart" in window) ? ["touchstart", "touchend"] : ["mousedown", "mouseup"])
            .forEach(evt => activator.addEventListener(evt, this, false));
    }

    socketRegisterEvents(self) {
        this.socket = io.connect(this.url);
        this.socket.on('gate'            , (data)    => { self.socketEvents(data) });

        this.socket.on('connect'         , ()        => { self.socketConnect('Connected')   });
        this.socket.on('reconnect'       , (attempt) => { self.socketConnect('Reconnected') });

        this.socket.on('connect_error'   , (error)   => { self.socketError('connect_error'   , error) });
        this.socket.on('reconnect_error' , (error)   => { self.socketError('reconnect_error' , error) });
        this.socket.on('reconnect_failed', ()        => { self.socketError('reconnect_failed', null)  });
        this.socket.on('connect_timeout' , ()        => { self.socketError('connect_timeout' , null)  });

        this.socket.on('reconnecting'     , (attempt) => { self.socketNotice('Reconnecting'     , attempt) });
        this.socket.on('reconnect_attempt', (attempt) => { self.socketNotice('Reconnect attempt', attempt) });
        this.socket.on('ping'             , ()        => { self.socketNotice('Ping', 'ok') });
        this.socket.on('pong'             , ()        => { self.socketNotice('Pong', 'ok') });

    }

    socketEvents(data) {
        this.log.add(data.status);
        switch (data.status) {
            case 'OPEN_GATE_START_REQUEST' : this.led.black();       break;
            case 'OPEN_GATE_START_RESPONSE': this.led.red();         break;
            case 'OPEN_GATE_END_REQUEST'   : this.led.black();       break;
            case 'OPEN_GATE_END_RESPONSE'  : this.led.darkred();     break;
            case 'GATE_HEARTBEAT'          : this.led.blink('#00F'); break;
            case 'GATE_CONNECTED'          : this.led.darkred();     break;
            case 'GATE_DISCONNECTED'       : this.led.black();       break;
            default: this.log.add('Unexpected status ' + data.status);
        }
    }

    socketConnect(type) {
        this.log.add(type + ' to server');
        this.socket.sendBuffer = [];
    }

    socketError(type, error) {
        this.log.add('Error connecting to server: ' + type);
        this.led.black();
    }

    socketNotice(type, value) {
        this.log.notice(type + ": " + value);
    }

    handleEvent(evt) {
        let handler = `on${evt.type}`;
        if (typeof this[handler] === "function") {
            evt.preventDefault();
            return this[handler](evt);
        }
    }

    ontouchstart(evt) {
        return this.gateStart(evt);
    }

    onmousedown(evt) {
        return this.gateStart();
    }

    ontouchend(evt) {
        return this.gateEnd(evt);
    }

    onmouseup(evt) {
        return this.gateEnd();
    }

    gateStart(evt) {
        if (this.socket.connected) {
            this.activator.setAttribute("fill", "#444");
            this.socket.emit('gate', {pressing: true});
            // this.log.add('request send');
        } else {
            this.log.add('not connected!');
        }
    }

    gateEnd(evt) {
        if (this.socket.connected) {
            this.socket.emit('gate', {pressing: false});
            this.activator.setAttribute("fill", "#000");
            // this.log.add('request send');
        } else {
            this.log.add("not connected!");
        }
    }
}
