
const moment = require("moment");
const HashMap = require("./lib/hashmap");
const Counter = require("./lib/counter");
const Digest = require("./watch-history-digest");
const WatchHistoryCache = require("./lib/watch-history-cache");
const fetchVideoInfos = require("./lib/fetch-video-info");
const ChannelService = require("./lib/channel-service");

const CAP_VIEWS_IN_MINUTES_AT = 3 * 60;
const channelBlockList = [];

function getChannelsList(views) {
    const channels = [...new Set(views.map(v => v.channelName))];
    return channels.filter(c => !channelBlockList.some(blocked => c.includes(blocked)));
}

function getChannelViewsByYearMonth(views, cache, channelSet) {
    const channelViewsByYearMonth = new HashMap();

    for (const view of views) {
        if (!channelSet.has(view.channelName)) {
            continue;
        }
        const yearMonth = moment(view.date).format("YYYY-MM");
        /** @type {Counter} */
        const channelCounts = channelViewsByYearMonth.computeIfAbsent(yearMonth, () => new Counter());
        const id = getIdFromView(view);
        const inc = cache ? cache.getVideoDurationInMinutes(id, CAP_VIEWS_IN_MINUTES_AT) : 1;
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

function dump(channels, thumbs, channelViewsByYearMonth) {
    console.info(["year-month", ...channels].join(","));
    console.info(["Image", ...thumbs].join(","));
    for (const [yearMonth, channelCounts] of channelViewsByYearMonth.entries()) {
        const line = [yearMonth];
        for (const channel of channels) {
            line.push(channelCounts.get(channel).toFixed(1));
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

/**
 *
 * @param {string[]} channels
 * @param {WatchHistoryCache} cache
 * @returns {Promise<string[]>}
 */
async function loadChannelThumbs(channels, cache) {
    const channelIdsByName = mapChannelIdsByName(cache);
    const idsInOrder = channels.map(c => channelIdsByName.get(c));

    const service = new ChannelService();
    const idsAndChannels = await service.getChannels(idsInOrder);
    return idsAndChannels.map(([_, c]) => service.getThumbUrl(c));
}

function mapChannelIdsByName(cache) {
    const videos = cache.values();
    const namesAndIds = videos.map(v => [
        v?.snippet?.channelTitle,
        v?.snippet?.channelId]);
    return new Map(namesAndIds);
}

((async function (cmd) {
    const digest = await Digest.load();
    const views = getViewsByDateAsc(digest);

    const useDuration = cmd === "duration";

    const cache = useDuration && await loadVideoInfos(views);

    const channels = getChannelsList(views);
    const channelSet = new Set(channels);

    const channelViewsByYearMonth = getChannelViewsByYearMonth(views, cache, channelSet);
    accumulateViewsFromPreviousMonths(channels, channelViewsByYearMonth);
    let popularChannels = getMostPopularChannels(channelViewsByYearMonth);

    const thumbs = await loadChannelThumbs(popularChannels, cache);

    dump(popularChannels, thumbs, channelViewsByYearMonth);
}))(...process.argv.slice(2));
