
class Video {
    /** @type {string} */
    url;
    /** @type {string} */
    name;
    /** @type {Video} */
    channel;
    /** @type {number} */
    views;

    constructor(url, name, channel) {
        this.url = url;
        this.name = name;
        this.channel = channel;
        this.views = 0;
    }

    addView() {
        this.views++;
    }
}

module.exports = Video;
