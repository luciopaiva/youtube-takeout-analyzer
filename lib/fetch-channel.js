
const fs = require("fs");
const axios = require("axios");

const BULK_SIZE = 50;  // the max accepted by the API when fetching multiple items
const API_KEY_FILE = "api.key";

async function fetchChannelBatch(ids) {
    try {
        const result = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
            params: {
                id: ids.join(","),
                part: "snippet",
                maxResults: ids.length,
                key: fs.readFileSync(API_KEY_FILE, "utf-8"),
            }
        });

        const data = result?.data;
        const videos = data?.items;

        if (!Array.isArray(videos)) {
            console.error("Could not retrieve list of channels");
            process.exit(1);
        }

        return videos;
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

async function fetchChannels(ids) {
    const result = [];
    for (let i = 0; i < ids.length; i += BULK_SIZE) {
        const pct = Math.floor(100 * i / ids.length);
        console.error(`Fetching channels ${i} to ${i + BULK_SIZE} (${pct}% done)`);
        const bulk = ids.slice(i, i + BULK_SIZE);
        const data = await fetchChannelBatch(bulk);
        result.push(...data);
    }
    console.error(`${ids.length} channels queried, ${result.length} returned.`);
    return result;
}

module.exports = fetchChannels;
