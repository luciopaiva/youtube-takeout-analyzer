
const fs = require("fs");
const cheerio = require("cheerio");
const moment = require("moment");
const HashMap = require("./lib/hashmap");
const Counter = require("./lib/counter");
const Channel = require("./lib/channel");
const Video = require("./lib/video");
const View = require("./lib/view");
const checksum = require("./lib/checksum");

const WATCH_HISTORY_INPUT = "Takeout/YouTube and YouTube Music/history/watch-history.html";
const WATCH_HISTORY_DIGEST = "watch-history.digest";
const WATCH_HISTORY_SHA1 = "watch-history.sha1";

class WatchHistoryDigest {

    totalViewsCount = 0;
    removedVideoCount = 0;
    youtubeMusicVisits = 0;
    storyViews = 0;
    videosWithoutChannel = 0;

    /** @type {HashMap<string, Channel>} */
    channelByUrl = new HashMap();
    /** @type {HashMap<string, Video>} */
    videoByUrl = new HashMap();
    countByMonthYear = new Counter();
    /** @type {View[]} */
    views;

    static async load() {
        const digest = new WatchHistoryDigest();

        let previousHash;

        if (fs.existsSync(WATCH_HISTORY_DIGEST) &&
            fs.existsSync(WATCH_HISTORY_SHA1)) {
            previousHash = fs.readFileSync(WATCH_HISTORY_SHA1, "utf-8");
        }

        const currentHash = await checksum(WATCH_HISTORY_INPUT);
        let views;

        if (currentHash === previousHash) {
            views = WatchHistoryDigest.loadFromFile();
        } else {
            views = WatchHistoryDigest.parseFromTakeout();
            await WatchHistoryDigest.saveToFile(views, currentHash);
        }

        digest.process(views);
        return digest;
    }

    static loadFromFile() {
        const lines = fs.readFileSync(WATCH_HISTORY_DIGEST, "utf-8").split("\n");
        return lines.map(line => JSON.parse(line));
    }

    static async saveToFile(views, hash) {
        const output = views.map(view => JSON.stringify(view)).join("\n");
        fs.writeFileSync(WATCH_HISTORY_DIGEST, output);
        fs.writeFileSync(WATCH_HISTORY_SHA1, hash);
    }

    static parseFromTakeout() {
        const views = [];

        const historyFile = fs.readFileSync(WATCH_HISTORY_INPUT, "utf-8");
        const $ = cheerio.load(historyFile);

        const cells = $("body .mdl-grid .mdl-cell .mdl-grid");

        cells.each((i, elem) => {
            const view = new View();
            views.push(view);

            const content = $(".content-cell", elem).first();
            const anchors = $("a", content);

            const text = content.text();

            if (text.startsWith("Watched a video that has been removed")) {
                view.wasRemoved = true;
                return;
            } else if (text.startsWith("Visited YouTube Music")) {
                view.isYouTubeMusicVisit = true;
                return;
            } else if (text.startsWith("Watched story")) {
                view.isStoryView = true;
                return;
            }

            const videoAnchor = $(anchors.get(0));
            const videoName = videoAnchor.text();
            const videoUrl = videoAnchor.attr("href");

            if (!videoUrl) {
                console.error("Found video without URL:");
                console.info(content.text());
                process.exit(1);
            }

            view.videoName = videoName;
            view.videoUrl = videoUrl;

            const channelAnchor = $(anchors.get(1));
            const channelName = channelAnchor.text();
            const channelUrl = channelAnchor.attr("href");

            if (!channelUrl) {
                // they actually do have a channel, but they're private now so no information is given
                view.becamePrivate = true;
                return;
            }

            view.channelName = channelName;
            view.channelUrl = channelUrl;

            const html = content.html();
            const lines = html.split("<br>");
            if (lines.length < 3 || lines.length > 4) {
                console.error("Unexpected format while parsing date:");
                console.error(html);
                process.exit(1);
            }
            const dateStr = lines.length === 3 ? lines[2] : lines[3];
            // here I'm just ignoring the timezone - it should be enough to give an approximation to the real date
            const date = moment(dateStr, "MMM D, YYYY, h:mm:ss", false);  // e.g.: "Feb 21, 2012, 11:35:26 PM WEST"
            view.date = date.toISOString();
        });

        return views;
    }

    process(views) {
        this.views = views;
        this.totalViewsCount = views.length;

        for (const /** @type {View} */ view of views) {
            if (view.wasRemoved) {
                this.removedVideoCount++;
                continue;
            } else if (view.isYouTubeMusicVisit) {
                this.youtubeMusicVisits++;
                continue;
            } else if (view.isStoryView) {
                this.storyViews++;
                continue;
            } else if (!view.channelUrl) {
                this.videosWithoutChannel++;
                continue;
            }

            const date = moment(view.date);

            const channel = this.channelByUrl.computeIfAbsent(view.channelUrl,
                () => new Channel(view.channelUrl, view.channelName));
            const video = this.videoByUrl.computeIfAbsent(view.videoUrl,
                () => new Video(view.videoUrl, view.videoName, channel));
            video.addView(date);
            channel.addView();

            this.countByMonthYear.increment(date.format("YYYY-MM"));
        }
    }

    printSummary() {
        console.info("Total views: " + this.totalViewsCount);
        console.info("Total unique videos watched: " + this.videoByUrl.size);
        console.info("Total channels watched: " + this.channelByUrl.size);
        console.info("Videos that were later removed: " + this.removedVideoCount);
        console.info("Videos that were later turned private: " + this.videosWithoutChannel);
    }
}

if (require.main === module) {
    WatchHistoryDigest.load().then(digest => digest.printSummary());
} else {
    module.exports = WatchHistoryDigest;
}
