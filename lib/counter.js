
const HashMap = require("./hashmap");

class Counter extends HashMap {

    get(key) {
        return super.get(key) || 0;
    }

    increment(key, inc = 1) {
        this.set(key, this.get(key) + inc);
    }
}

module.exports = Counter;
