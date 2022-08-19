
class Video {
    /** @type {string} */
    url;
    /** @type {string} */
    name;
    /** @type {Video} */
    channel;

    constructor(url, name, channel) {
        this.url = url;
        this.name = name;
        this.channel = channel;
        this.viewDates = [];
    }

    addView(date) {
        this.viewDates.push(date);
    }

    get views() {
        return this.viewDates.length;
    }
}

module.exports = Video;
