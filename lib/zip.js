
// https://stackoverflow.com/a/10284006/778272
module.exports = (...rows) => rows[0].map((_,c) => rows.map(row => row[c]));
