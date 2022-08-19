
const Digest = require("./watch-history-digest");

const CUTOFF = 2;

((async function () {
    const digest = await Digest.load();

    /** @type {Channel[]} */
    const videos = [...digest.videoByUrl.values()];
    videos.sort((a, b) => b.views - a.views);

    for (const video of videos) {
        if (video.views < CUTOFF) {
            break;
        }
        console.info(`${video.name},${video.views}`);
    }
}))();
