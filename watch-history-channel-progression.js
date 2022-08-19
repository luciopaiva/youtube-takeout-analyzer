
const moment = require("moment");
const HashMap = require("./lib/hashmap");
const Counter = require("./lib/counter");
const Digest = require("./watch-history-digest");

const CUTOFF = 30;

function getMostViewedChannels(views, cutoff) {
    const channelsAndViewsCounter = new Counter();

    for (const view of views) {
        channelsAndViewsCounter.increment(view.channelName);
    }

    const channelsAndViews = [...channelsAndViewsCounter.entries()];
    channelsAndViews.sort((a, b) => b[1] - a[1]);

    return [...channelsAndViews.map(cav => cav[0])].slice(0, cutoff);
}

((async function () {
    const digest = await Digest.load();
    const channelCountsByYearMonth = new HashMap();

    const views = digest.views.filter(v => typeof v.date !== "undefined");
    views.sort((a, b) => a.date.localeCompare(b.date));

    const channels = getMostViewedChannels(views, CUTOFF);

    for (const view of views) {
        const yearMonth = moment(view.date).format("YYYY-MM");
        /** @type {Counter} */
        const channelCounts = channelCountsByYearMonth.computeIfAbsent(yearMonth, () => new Counter());
        channelCounts.increment(view.channelName);
    }

    console.info(["year-month", ...channels].join(","));
    for (const [yearMonth, channelCounts] of channelCountsByYearMonth.entries()) {
        const line = [yearMonth];
        for (const channel of channels) {
            line.push(channelCounts.get(channel));
        }
        console.info(line.join(","));
    }
}))();
