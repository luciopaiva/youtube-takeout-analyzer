
class HashMap extends Map {

    computeIfAbsent(key, compute) {
        let val = this.get(key);
        if (!val) {
            val = compute();
            this.set(key, val);
        }
        return val;
    }
}

module.exports = HashMap;
