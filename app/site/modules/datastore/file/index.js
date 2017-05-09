const fs = require("fs"),
    DataStore = require("../../../js/base/datastore"),
    Queue = require("../../../js/queue");

require("../../../js/extensions");

//  #####    #     ##          
//  #               #          
//  #       ##      #     ###  
//  ####     #      #    #   # 
//  #        #      #    ##### 
//  #        #      #    #     
//  #       ###    ###    ###  
/**
 * A class that represents data stored in a JSON file.
 */
class File extends DataStore {

    //                           #                       #                
    //                           #                       #                
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###   
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #  
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #     
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #     
    /**
     * Creates a new data store based on a file.
     * @param {string} filename The filename to use for the file.
     */
    constructor(filename) {
        super();

        this.filename = filename;
        this.dataStore = {};
        this.fileQueue = new Queue();
    }

    //    #         #          
    //    #         #          
    //  ###   ###  ###    ###  
    // #  #  #  #   #    #  #  
    // #  #  # ##   #    # ##  
    //  ###   # #    ##   # #  
    /**
     * Returns the data in the data store.
     * @return {object} The data in the data store.
     */
    get data() {
        return this.dataStore;
    }

    //  ###  #  #   ##   #  #   ##   
    // #  #  #  #  # ##  #  #  # ##  
    // #  #  #  #  ##    #  #  ##    
    //  ###   ###   ##    ###   ##   
    //    #                          
    /**
     * Queues a function.
     * @param {function} fx The function to queue.
     * @return {Promise} A promise that resolves when the function is complete.
     */
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

    //  ###    ###  # #    ##   
    // ##     #  #  # #   # ##  
    //   ##   # ##  # #   ##    
    // ###     # #   #     ##   
    /**
     * Saves the data to a file.
     * @return {Promise} A promise that resolves when the file is saved.
     */
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
                        
                        super.emit("saved");
                        resolve();
                    });
                }).then(outerResolve).catch(outerReject); // TODO: Handle rejection better.
            });
        });
    }

    // ##                   #  
    //  #                   #  
    //  #     ##    ###   ###  
    //  #    #  #  #  #  #  #  
    //  #    #  #  # ##  #  #  
    // ###    ##    # #   ###  
    /**
     * Loads the data from a file.
     * @return {Promise} A promise that resolves when the file is loaded.
     */
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
                        }).then(outerResolve).catch(outerReject); // TODO: Handle rejection better.
                    });
                } else {
                    outerResolve();
                }
            });
        });
    }
}

module.exports = File;
