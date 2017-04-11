var fs = require("fs"),
    DataStore = require("../../../js/base/datastore"),
    Queue = require("../../../js/queue");

require("../../../js/extensions");

class File extends DataStore {
    constructor (filename) {
        super();

        this.filename = filename;
        this.dataStore = {};
        this.fileQueue = new Queue();
    }

    get data() {
        return this.dataStore;
    }

    queue(fx) {
        var file = this;

        return new Promise((outerResolve, outerReject) => {
            file.fileQueue.push(() => {
                return new Promise((resolve, reject) => {
                    fx();
                    resolve();
                }).then(outerResolve).catch(outerReject);
            });
        });
    }

    save() {
        var file = this;

        return new Promise((outerResolve, outerReject) => {
            file.fileQueue.push(() => {
                return new Promise((resolve, reject) => {
                    fs.writeFile(file.filename, JSON.stringify(file.dataStore), (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        
                        resolve();
                    });
                }).then(outerResolve).catch(outerReject);
            });
        });
    }

    load() {
        var file = this;

        return new Promise((outerResolve, outerReject) => {
            fs.exists(file.filename, (exists) => {
                if (exists) {
                    file.fileQueue.push(() => {
                        return new Promise((resolve, reject) => {
                            fs.readFile(file.filename, "utf8", (err, jsonString) => {
                                if (err) {
                                    reject(err);
                                    return;
                                }

                                JSON.tryParse(jsonString).then((obj) => {
                                    if (obj && typeof obj === "object") {
                                        file.dataStore = obj;
                                    }

                                    resolve();
                                });
                            });
                        }).then(outerResolve).catch(outerReject);
                    });
                } else {
                    outerResolve();
                }
            });
        });
    }
}

module.exports = File;
