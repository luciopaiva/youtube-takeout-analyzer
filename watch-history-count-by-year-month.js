
const Digest = require("./watch-history-digest");

((async function () {
    const digest = await Digest.load();

    const entries = [...digest.countByMonthYear.entries()];
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    for (const [ym, count] of entries) {
        console.info(`${ym},${count}`);
    }
}))();
