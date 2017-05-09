var EventEmitter = require("events");

//  ####           #             ###    #                         
//   #  #          #            #   #   #                         
//   #  #   ###   ####    ###   #      ####    ###   # ##    ###  
//   #  #      #   #         #   ###    #     #   #  ##  #  #   # 
//   #  #   ####   #      ####      #   #     #   #  #      ##### 
//   #  #  #   #   #  #  #   #  #   #   #  #  #   #  #      #     
//  ####    ####    ##    ####   ###     ##    ###   #       ###  
/**
 * A class that represents a data store module.
 */
class DataStore extends EventEmitter {
    //                           #                       #                
    //                           #                       #                
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###   
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #  
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #     
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #     
    /**
     * Creates the data store module.
     */
    constructor() {
        super();
    }
}

module.exports = DataStore;
