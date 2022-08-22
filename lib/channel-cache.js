
const fs = require("fs");
const CACHE_FILE = "./channel-cache.json";
const zip = require("./zip");

class ChannelCache {

    /** @type {Map<string, {}>} */
    channelById = new Map();

    constructor() {
        this.load();
    }

    load() {
        if (fs.existsSync(CACHE_FILE)) {
            const obj = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"))
            this.channelById = new Map(Object.entries(obj));
        } else {
            console.error(`Cache file ${CACHE_FILE} does not exist`);
        }
    }

    save() {
        const obj = Object.fromEntries(this.channelById);
        fs.writeFileSync(CACHE_FILE, JSON.stringify(obj));
    }

    add(id, channel) {
        this.channelById.set(id, channel);
    }

    getByIds(ids) {
        return zip(ids, ids.map(id => this.channelById.get(id)));
    }
}

module.exports = ChannelCache;
