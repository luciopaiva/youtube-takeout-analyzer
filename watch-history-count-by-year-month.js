
const Digest = require("./watch-history-digest");

const digest = new Digest();

const entries = [...digest.countByMonthYear.entries()];
entries.sort((a, b) => a[0].localeCompare(b[0]));
for (const [ym, count] of entries) {
    console.info(`${ym},${count}`);
}
