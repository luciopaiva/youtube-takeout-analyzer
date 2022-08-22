
const ChannelCache = require("./channel-cache");
const fetchChannel = require("./fetch-channel");

class ChannelService {

    cache = new ChannelCache();

    async getChannels(ids) {
        const idsAndChannels = this.cache.getByIds(ids);
        const channelById = new Map(idsAndChannels);

        const missingIds = idsAndChannels.filter(t => t[1] === undefined).map(t => t[0]);
        if (missingIds.length > 0) {
            const missingChannels = await fetchChannel(missingIds);
            this.cacheChannels(missingChannels);
            for (const channel of missingChannels) {
                channelById.set(channel.id, channel);
            }
        }

        return ids.map(id => [id, channelById.get(id)]);
    }

    cacheChannels(channels) {
        for (const channel of channels) {
            this.cache.add(channel.id, channel);
        }
        this.cache.save();
    }

    /**
     * @param {{}} channel
     * @return {string}
     */
    getThumbUrl(channel) {
        return channel?.snippet?.thumbnails?.default?.url;
    }
}

module.exports = ChannelService;
