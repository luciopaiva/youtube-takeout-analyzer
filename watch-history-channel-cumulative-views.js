
const moment = require("moment");
const HashMap = require("./lib/hashmap");
const Counter = require("./lib/counter");
const Digest = require("./watch-history-digest");
const WatchHistoryCache = require("./lib/watch-history-cache");
const fetchVideoInfos = require("./lib/fetch-video-info");

const PRUNE_CHANNELS_WITH_HUGE_DURATIONS = false;

function getChannelsList(views) {
    return [...new Set(views.map(v => v.channelName))];
}

function getChannelViewsByYearMonth(views, cache) {
    const channelViewsByYearMonth = new HashMap();

    for (const view of views) {
        const yearMonth = moment(view.date).format("YYYY-MM");
        /** @type {Counter} */
        const channelCounts = channelViewsByYearMonth.computeIfAbsent(yearMonth, () => new Counter());
        const id = getIdFromView(view);
        const inc = cache ? cache.getVideoDurationInMinutes(id) : 1;
        channelCounts.increment(view.channelName, inc);
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

function removeChannelsWithHugeDurations(channels, channelViewsByYearMonth) {
    const channelSet = new Set(channels);
    const channelViews = getChannelViewsFromLastMonth(channelViewsByYearMonth);
    for (const [channel, count] of channelViews.entries()) {
        if (count > 100_000) {
            channelSet.delete(channel);
        }
    }
    return [...channelSet];
}

function getChannelViewsFromLastMonth(channelViewsByYearMonth) {
    const months = [...channelViewsByYearMonth.keys()];
    months.sort((a, b) => a.localeCompare(b));
    const lastMonth = months[months.length - 1];
    return channelViewsByYearMonth.get(lastMonth);
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

function getIdFromView(view) {
    const m = view.videoUrl.match(/watch\?v=(.*)$/)
    if (!m) {
        console.error(`Could not find id for URL ${view.videoUrl}`);
        process.exit(1);
    }
    return m[1];
}

async function loadVideoInfos(views) {
    const ids = views.map(view => getIdFromView(view));

    const cache = new WatchHistoryCache();

    const missingIds = cache.findAllMissing(ids);

    if (missingIds.length > 0) {
        const videoInfos = await fetchVideoInfos(missingIds);
        checkMissingIds(missingIds, videoInfos);
        cache.add(videoInfos);
        cache.persist();
    }

    return cache;
}

function checkMissingIds(missingIds, videoInfos) {
    const missingSet = new Set(missingIds);
    for (const info of videoInfos) {
        missingSet.delete(info.id);
    }
    if (missingSet.size > 0) {
        console.error(`The following ids are still missing: ${[...missingSet].join(", ")}`);
    }
}

((async function (cmd) {
    const digest = await Digest.load();
    const views = getViewsByDateAsc(digest);

    const useDuration = cmd === "duration";

    const cache = useDuration && await loadVideoInfos(views);

    const channels = getChannelsList(views);
    const channelViewsByYearMonth = getChannelViewsByYearMonth(views, cache);
    accumulateViewsFromPreviousMonths(channels, channelViewsByYearMonth);
    let popularChannels = getMostPopularChannels(channelViewsByYearMonth);
    if (useDuration && PRUNE_CHANNELS_WITH_HUGE_DURATIONS) {
        popularChannels = removeChannelsWithHugeDurations(popularChannels, channelViewsByYearMonth);
    }

    dump(popularChannels, channelViewsByYearMonth);
}))(...process.argv.slice(2));
