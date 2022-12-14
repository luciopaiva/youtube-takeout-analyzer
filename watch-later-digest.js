
const fs = require("fs");
const moment = require("moment");
const fetchVideoInfos = require("./lib/fetch-video-info");
const checksum = require("./lib/checksum");

const WATCH_LATER_DIGEST = "watch-later.json";
const WATCH_LATER_SHA1 = "watch-later.sha1";
const WATCH_LATER_INPUT = "Takeout/YouTube and YouTube Music/playlists/Watch later.csv";

class Digest {

    /** @type {[string, string][]} */
    videoIdsAndDates = [];
    videoInfos = [];

    static async load() {
        const digest = new Digest();
        digest.loadVideosAndDates();

        let previousHash;

        if (fs.existsSync(WATCH_LATER_DIGEST) &&
            fs.existsSync(WATCH_LATER_SHA1)) {
            previousHash = fs.readFileSync(WATCH_LATER_SHA1, "utf-8");
        }

        const currentHash = await checksum(WATCH_LATER_INPUT);

        let videoInfos;
        if (currentHash === previousHash) {
            videoInfos = Digest.loadFromFile();
        } else {
            videoInfos = await digest.fetchVideoInfos();
            Digest.saveToFile(videoInfos, currentHash);
        }

        digest.videoInfos = videoInfos;
        return digest;
    }

    mapVideosById() {
        const videosById = new Map();
        for (const videoInfo of this.videoInfos) {
            videosById.set(videoInfo.id, videoInfo);
        }
        return videosById;
    }

    static loadFromFile() {
        return JSON.parse(fs.readFileSync(WATCH_LATER_DIGEST, "utf-8"));
    }

    static saveToFile(videoInfos, hash) {
        const content = JSON.stringify(videoInfos);
        fs.writeFileSync(WATCH_LATER_DIGEST, content);
        fs.writeFileSync(WATCH_LATER_SHA1, hash);
    }

    loadVideosAndDates() {
        const lines = fs.readFileSync(WATCH_LATER_INPUT, "utf-8").split("\n").slice(4)
            .filter(line => !/^\s*$/.test(line));

        for (const line of lines) {
            let [videoId, timeAdded] = line.split(",");
            videoId = videoId.trim();
            const date = moment(timeAdded, "YYYY-MM-DD HH:mm:ss").toISOString();  // e.g.: 2022-08-19 07:26:21
            this.videoIdsAndDates.push([videoId, date]);
        }
    }

    printSummary() {
        console.error(`Number of videos: ${this.videoIdsAndDates.length}`);
    }

    async fetchVideoInfos() {
        const ids = this.videoIdsAndDates.map(vad => vad[0]);
        return await fetchVideoInfos(ids);
    }
}

if (require.main === module) {
    Digest.load().then(async digest => digest.printSummary());
} else {
    module.exports = Digest;
}
