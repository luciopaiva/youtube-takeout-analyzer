
const fs = require("fs");
const axios = require("axios");

const BULK_SIZE = 50;  // the max accepted by the API when fetching multiple video infos
const API_KEY_FILE = "api.key";

async function fetchVideoInfosBatch(ids) {
    try {
        const result = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
            params: {
                id: ids.join(","),
                part: "snippet,contentDetails,statistics",
                maxResults: ids.length,
                key: fs.readFileSync(API_KEY_FILE, "utf-8"),
            }
        });

        const data = result?.data;
        const videos = data?.items;

        if (!Array.isArray(videos)) {
            console.error("Could not retrieve list of videos");
            process.exit(1);
        }

        return videos;
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

async function fetchVideoInfos(ids) {
    const result = [];
    for (let i = 0; i < ids.length; i += BULK_SIZE) {
        const pct = Math.floor(100 * i / ids.length);
        console.error(`Fetching videos ${i} to ${i + BULK_SIZE} (${pct}% done)`);
        const bulk = ids.slice(i, i + BULK_SIZE);
        const data = await fetchVideoInfosBatch(bulk);
        result.push(...data);
    }
    console.error(`${ids.length} videos queried, ${result.length} returned.`);
    return result;
}

module.exports = fetchVideoInfos;
