
class Channel {
    /** @type {string} */
    name;
    /** @type {string} */
    url;
    /** @type {number} */
    views;

    constructor(url, name) {
        this.url = url;
        this.name = name;
        this.views = 0;
    }

    addView() {
        this.views++;
    }
}

module.exports = Channel;
