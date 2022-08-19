
const Digest = require("./watch-history-digest");

((async function () {
    if (process.argv.length < 3) {
        console.error("Missing query string");
        process.exit(1);
    }

    const query = process.argv[2].toLowerCase();

    const digest = await Digest.load();

    for (const view of digest.views) {
        const channelMatches = view.channelName && view.channelName.toLowerCase().includes(query);
        const videoMatches = view.videoName && view.videoName.toLowerCase().includes(query);
        if (channelMatches || videoMatches) {
            console.info(`[${view.date}] ${view.channelName} - ${view.videoName}`);
        }
    }
}))();
