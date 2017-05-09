const DataStore = require("../../../js/base/datastore");

//  #   #                                    
//  #   #                                    
//  ## ##   ###   ## #    ###   # ##   #   # 
//  # # #  #   #  # # #  #   #  ##  #  #   # 
//  #   #  #####  # # #  #   #  #      #  ## 
//  #   #  #      # # #  #   #  #       ## # 
//  #   #   ###   #   #   ###   #          # 
//                                     #   # 
//                                      ###  
class Memory extends DataStore {
    //                           #                       #                
    //                           #                       #                
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###   
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #  
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #     
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #     
    /**
     * Creates a new data store in memory.
     */
    constructor () {
        super();

        this.dataStore = {};
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
}

module.exports = Memory;
