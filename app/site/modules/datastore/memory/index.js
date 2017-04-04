var DataStore = require("../../../js/base/datastore.js");

class Memory extends DataStore {
    constructor () {
        super();

        this.data = {};
    }

    get data() {
        return this.data;
    }
}

module.exports = Memory;
