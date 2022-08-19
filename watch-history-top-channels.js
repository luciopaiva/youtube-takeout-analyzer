
const Digest = require("./watch-history-digest");

const TOP_COUNT = 20;
const VIDEO_NAME_PADDING = 100;

((async function () {
    const digest = await Digest.load();

    /** @type {Channel[]} */
    const channels = [...digest.channelByUrl.values()];
    channels.sort((a, b) => b.views - a.views);

    console.info(`\nTop ${TOP_COUNT} most watched channels:`);
    for (let i = 0; i < TOP_COUNT; i++) {
        const channel = channels[i];
        const name = channel.name.padEnd(VIDEO_NAME_PADDING, " ");
        console.info(`- ${name} ${channel.views}`);
    }
}))();
