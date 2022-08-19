
module.exports = function checksumFile(path) {
    return new Promise(function (resolve, reject) {
        let fs = require('fs');
        let crypto = require('crypto');

        let hash = crypto.createHash("sha1").setEncoding('hex');
        fs.createReadStream(path)
            .once('error', reject)
            .pipe(hash)
            .once('finish', function () {
                resolve(hash.read());
            });
    });
}
