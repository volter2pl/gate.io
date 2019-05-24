class Logger {
    constructor(activator, console, config) {
        this.content = [];
        this.activator = activator;
        this.console = console;
        this.max = config.max || 10;
        this.showNotice = config.showNotice || false;
        if (config.showOnInit || false) {
            this.show();
        } else {
            this.hide();
        }

        (("ontouchstart" in window) ? ["touchstart", "touchend"] : ["mousedown", "mouseup"])
            .forEach(evt => activator.addEventListener(evt, this, false));
    }

    handleEvent(evt) {
        let handler = `on${evt.type}`;
        if (typeof this[handler] === "function") {
            evt.preventDefault();
            return this[handler](evt);
        }
    }

    ontouchstart(evt) {
        return this.onmousedown(evt);
    }

    onmousedown(evt) {
        this.changeState();
    }

    changeState() {
        if (this.console.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }

    hide() {
        if (!this.console.classList.contains('hidden')) {
            this.console.classList.add('hidden');
            this.activator.setAttribute("fill", "#000");
        }
    }

    show() {
        if (this.console.classList.contains('hidden')) {
            this.console.classList.remove('hidden');
            this.activator.setAttribute("fill", "#444");
        }

    }

    add(text) {
        this.content.push(text);
        if (this.content.length > this.max) {
            this.content.shift();
        }
        this.print();
    }

    notice(text) {
        if (this.showNotice) {
            this.add(text);
        }
    }

    get() {
        return this.content.join('<br>');
    }

    print() {
        this.console.innerHTML = this.get();
    }
};
