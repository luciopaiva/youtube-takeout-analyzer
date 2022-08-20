
const fs = require("fs");
const moment = require("moment");
const CACHE_FILE = "./watch-history-cache.json";

class WatchHistoryCache {

    videoInfoById = {};

    constructor() {
        this.loadFromFile();
    }

    loadFromFile() {
        if (fs.existsSync(CACHE_FILE)) {
            this.videoInfoById = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
        }
    }

    /**
     * @param {string[]} ids
     * @return {boolean}
     */
    containsAll(ids) {
        return ids.every(id => !!this.videoInfoById[id]);
    }

    /**
     * @param {string[]} ids
     * @return {string[]}
     */
    findAllMissing(ids) {
        return ids.filter(id => !this.videoInfoById[id]);
    }

    add(videoInfos) {
        for (const info of videoInfos) {
            if (!info.id) {
                console.error(`Video info does not contain id`);
                console.error(JSON.stringify(info, null, 2));
                process.exit(1);
            }
            this.videoInfoById[info.id] = info;
        }
    }

    persist() {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(this.videoInfoById));
    }

    getVideoDurationInMinutes(id) {
        const info = this.videoInfoById[id];
        const durationStr = info?.contentDetails?.duration;
        if (!durationStr) {
            console.error(`Video ${id} does not contain duration information.`);
            return 0;
        }
        const minutes = moment.duration(durationStr).asMinutes();
        if (typeof minutes !== "number") {
            console.error(`Video ${id} has invalid duration ${durationStr}`);
            return 0;
        }
        return minutes;
    }
}

module.exports = WatchHistoryCache;
