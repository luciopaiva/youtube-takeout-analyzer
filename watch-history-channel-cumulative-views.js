
const moment = require("moment");
const HashMap = require("./lib/hashmap");
const Counter = require("./lib/counter");
const Digest = require("./watch-history-digest");

function getChannelsList(views) {
    return [...new Set(views.map(v => v.channelName))];
}

function getChannelViewsByYearMonth(views) {
    const channelViewsByYearMonth = new HashMap();

    for (const view of views) {
        const yearMonth = moment(view.date).format("YYYY-MM");
        /** @type {Counter} */
        const channelCounts = channelViewsByYearMonth.computeIfAbsent(yearMonth, () => new Counter());
        channelCounts.increment(view.channelName);
    }

    return channelViewsByYearMonth;
}

function accumulateViewsFromPreviousMonths(channels, channelViewsByYearMonth) {
    const months = [...channelViewsByYearMonth.keys()];
    months.sort((a, b) => a.localeCompare(b));

    for (let i = 1; i < months.length; i++) {
        const previousMonth = channelViewsByYearMonth.get(months[i - 1]);
        const currentMonth = channelViewsByYearMonth.get(months[i]);

        for (const channel of channels) {
            currentMonth.increment(channel, previousMonth.get(channel));
        }
    }
}

/**
 * Returns a list containing only popular channels. The idea here is that if a channel never appears in the top K of
 * any given month, it is considered not popular and has no reason to appear in the final CSV file (bar chart race
 * generators like alienart.io will only show the top K of each month).
 */
function getMostPopularChannels(channelViewsByYearMonth, K = 10) {
    const popularChannelsSet = new Set();

    for (const viewsByChannel of channelViewsByYearMonth.values()) {
        const channelsAndViews = [...viewsByChannel.entries()];
        channelsAndViews.sort((a, b) => b[1] - a[1]);
        channelsAndViews.slice(0, K).map(cav => cav[0]).forEach(c => popularChannelsSet.add(c));
    }

    const popularChannels = [...popularChannelsSet];
    popularChannels.sort((a, b) => a.localeCompare(b));
    return popularChannels;
}

function dump(channels, channelViewsByYearMonth) {
    console.info(["year-month", ...channels].join(","));
    for (const [yearMonth, channelCounts] of channelViewsByYearMonth.entries()) {
        const line = [yearMonth];
        for (const channel of channels) {
            line.push(channelCounts.get(channel));
        }
        console.info(line.join(","));
    }
}

function getViewsByDateAsc(digest) {
    const views = digest.views.filter(v => typeof v.date !== "undefined");
    views.sort((a, b) => a.date.localeCompare(b.date));
    return views;
}

((async function () {
    const digest = await Digest.load();
    const views = getViewsByDateAsc(digest);
    const channels = getChannelsList(views);
    const channelViewsByYearMonth = getChannelViewsByYearMonth(views);
    accumulateViewsFromPreviousMonths(channels, channelViewsByYearMonth);
    const popularChannels = getMostPopularChannels(channelViewsByYearMonth);

    dump(popularChannels, channelViewsByYearMonth);
}))();
