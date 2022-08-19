
const Digest = require("./watch-history-digest");

const CUTOFF = 5;

((async function () {
    const digest = await Digest.load();

    /** @type {Channel[]} */
    const channels = [...digest.channelByUrl.values()];
    channels.sort((a, b) => b.views - a.views);

    for (const channel of channels) {
        if (channel.views < CUTOFF) {
            break;
        }
        console.info(`${channel.name},${channel.views}`);
    }
}))();
