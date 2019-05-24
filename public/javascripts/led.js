class Led {
    constructor(element, color) {
        this.element = element;
        this.color = color || "#000";
        this.set();
    }

    set(color) {
        this.element.setAttribute("fill", color || this.color);
    }

    blink(color, time) {
        this.set(color || '#FFF');
        setTimeout(() => {this.set(this.color)}, time || 300);
    }

    red() {
        this.color = '#F00';
        this.set();
    }

    darkred() {
        this.color = '#600';
        this.set();
    }

    green() {
        this.color = '#0F0';
        this.set();
    }

    blue() {
        this.color = '#00F';
        this.set();
    }

    yellow() {
        this.color = '#FF0';
        this.set();
    }

    orange() {
        this.color = '#FA0';
        this.set();
    }

    black() {
        this.color = '#000';
        this.set();
    }

    white() {
        this.color = '#FFF';
        this.set();
    }
};
