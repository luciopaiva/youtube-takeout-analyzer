
const Digest = require("./watch-later-digest");

(async function () {
    const digest = await Digest.load();

    const videosById = digest.mapVideosById();

    for (const [id, date] of digest.videoIdsAndDates) {
        const video = videosById.get(id);
        const columns = [date, id];
        if (video) {
            columns.push(...[video.snippet?.channelTitle, video.snippet?.title]);
        }
        console.info(columns
            .map(s => s.replaceAll('"', '""'))
            .map(s => `"${s}"`)
            .join(","));
    }
})();
