
const Digest = require("./watch-history-digest");

const TOP_COUNT = 20;
const VIDEO_NAME_PADDING = 100;

const digest = new Digest();

/** @type {Channel[]} */
const videos = [...digest.videoByUrl.values()];
videos.sort((a, b) => b.views - a.views);

console.info(`\nTop ${TOP_COUNT} most watched videos:`);
for (let i = 0; i < TOP_COUNT; i++) {
    const video = videos[i];
    const name = video.name.padEnd(VIDEO_NAME_PADDING, " ");
    console.info(`- ${name} ${video.views}`);
}
