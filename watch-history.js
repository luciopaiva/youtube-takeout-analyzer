
const fs = require("fs");
const cheerio = require("cheerio");
const HashMap = require("./hashmap");
const Channel = require("./channel");
const Video = require("./video");

const TOP_COUNT = 20;
const VIDEO_NAME_PADDING = 100;

const historyFile = fs.readFileSync("Takeout/YouTube and YouTube Music/history/watch-history.html", "utf-8");
const $ = cheerio.load(historyFile);

const cells = $("body .mdl-grid .mdl-cell .mdl-grid");

let totalViewsCount = 0;
let removedVideoCount = 0;
let youtubeMusicVisits = 0;
let storyViews = 0;
let videosWithoutChannel = 0;

/** @type {HashMap<string, Channel>} */
const channelByUrl = new HashMap();
/** @type {HashMap<string, Video>} */
const videoByUrl = new HashMap();


cells.each((i, elem) => {
    const content = $(".content-cell", elem).first();
    const anchors = $("a", content);

    const text = content.text();

    if (text.startsWith("Watched a video that has been removed")) {
        removedVideoCount++;
        return;
    } else if (text.startsWith("Visited YouTube Music")) {
        youtubeMusicVisits++;
        return;
    } else if (text.startsWith("Watched story")) {
        storyViews++;
        return;
    }

    // count even videos that were later removed or turned private
    totalViewsCount++;

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
        videosWithoutChannel++;
        return;
    }

    const channel = channelByUrl.computeIfAbsent(channelUrl, () => new Channel(channelUrl, channelName));
    const video = videoByUrl.computeIfAbsent(videoUrl, () => new Video(videoUrl, videoName, channel));
    video.addView();
    channel.addView();
});

console.info("Total views: " + totalViewsCount);
console.info("Total unique videos watched: " + videoByUrl.size);
console.info("Total channels watched: " + channelByUrl.size);
console.info("Videos that were later removed: " + removedVideoCount);
console.info("Videos that were later turned private: " + videosWithoutChannel);

/** @type {Video[]} */
const videos = [...videoByUrl.values()];
videos.sort((a, b) => b.views - a.views);

console.info("");

console.info(`Top ${TOP_COUNT} most watched videos:`);
for (let i = 0; i < TOP_COUNT; i++) {
    const video = videos[i];
    const name = video.name.padEnd(VIDEO_NAME_PADDING, " ");
    console.info(`- ${name} ${video.views}`);
}

/** @type {Channel[]} */
const channels = [...channelByUrl.values()];
channels.sort((a, b) => b.views - a.views);

console.info("");

console.info(`Top ${TOP_COUNT} most watched channels:`);
for (let i = 0; i < TOP_COUNT; i++) {
    const channel = channels[i];
    const name = channel.name.padEnd(VIDEO_NAME_PADDING, " ");
    console.info(`- ${name} ${channel.views}`);
}
