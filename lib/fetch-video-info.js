
const fs = require("fs");
const axios = require("axios");

const API_KEY_FILE = "api.key";

module.exports = async function fetchVideoInfo(ids, pageToken) {
    try {
        const result = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
            params: {
                id: ids.join(","),
                part: "snippet,contentDetails,statistics",
                maxResults: ids.length,
                ...(pageToken && {pageToken}),  // include page token if one was passed
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
