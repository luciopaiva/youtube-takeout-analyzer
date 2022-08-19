
const HashMap = require("./hashmap");

class Counter extends HashMap {

    increment(key, inc = 1) {
        let val = this.get(key);
        if (!val) {
            val = 0;
        }
        val += inc;
        this.set(key, val);
    }
}

module.exports = Counter;
