
const Digest = require("./watch-later-digest");
const Counter = require("./lib/counter");

(async function () {
    const digest = await Digest.load();

    const videosById = digest.mapVideosById();

    const countByChannel = new Counter();
    for (const video of videosById.values()) {
        const channel = video.snippet?.channelTitle;
        if (channel) {
            countByChannel.increment(channel);
        }
    }

    const channelsAndCounts = [...countByChannel.entries()];
    channelsAndCounts.sort((a, b) => b[1] - a[1]);

    for (let i = 0; i < 50; i++) {
        const [channel, count] = channelsAndCounts[i];
        console.info(`${channel}: ${count}`);
    }
})();
