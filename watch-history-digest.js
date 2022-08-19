
const fs = require("fs");
const cheerio = require("cheerio");
const moment = require("moment");
const HashMap = require("./hashmap");
const Counter = require("./counter");
const Channel = require("./channel");
const Video = require("./video");

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

    constructor() {
        const historyFile = fs.readFileSync("Takeout/YouTube and YouTube Music/history/watch-history.html", "utf-8");
        const $ = cheerio.load(historyFile);

        const cells = $("body .mdl-grid .mdl-cell .mdl-grid");

        cells.each((i, elem) => {
            const content = $(".content-cell", elem).first();
            const anchors = $("a", content);

            const text = content.text();

            if (text.startsWith("Watched a video that has been removed")) {
                this.removedVideoCount++;
                return;
            } else if (text.startsWith("Visited YouTube Music")) {
                this.youtubeMusicVisits++;
                return;
            } else if (text.startsWith("Watched story")) {
                this.storyViews++;
                return;
            }

            // count even videos that were later removed or turned private
            this.totalViewsCount++;

            const videoAnchor = $(anchors.get(0));
            const videoName = videoAnchor.text();
            const videoUrl = videoAnchor.attr("href");

            if (!videoUrl) {
                console.error("Found video without URL:");
                console.info(content.text());
                return;
            }

            const channelAnchor = $(anchors.get(1));
            const channelName = channelAnchor.text();
            const channelUrl = channelAnchor.attr("href");

            if (!channelUrl) {
                // they actually do have a channel, but they're private now so no information is given
                this.videosWithoutChannel++;
                return;
            }

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

            const channel = this.channelByUrl.computeIfAbsent(channelUrl, () => new Channel(channelUrl, channelName));
            const video = this.videoByUrl.computeIfAbsent(videoUrl, () => new Video(videoUrl, videoName, channel));
            video.addView(date);
            channel.addView();

            this.countByMonthYear.increment(date.format("YYYY-MM"));
        });
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
    const digest = new WatchHistoryDigest();
    digest.printSummary();
} else {
    module.exports = WatchHistoryDigest;
}
