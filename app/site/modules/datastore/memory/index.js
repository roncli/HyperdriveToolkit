var DataStore = require("../../../js/base/datastore");

class Memory extends DataStore {
    constructor () {
        super();

        this.dataStore = {};
    }

    get data() {
        return this.dataStore;
    }
}

module.exports = Memory;
