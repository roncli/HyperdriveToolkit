//   ###                              
//  #   #                             
//  #   #  #   #   ###   #   #   ###  
//  #   #  #   #  #   #  #   #  #   # 
//  #   #  #   #  #####  #   #  ##### 
//  # # #  #  ##  #      #  ##  #     
//   ###    ## #   ###    ## #   ###  
//      #                             
/**
 * A class that creates a queue of functions.
 */
class Queue {
    //                           #                       #                
    //                           #                       #                
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###   
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #  
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #     
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #     
    /**
     * Creates a new queue.
     */
    constructor() {
        this.promise = Promise.resolve();
    }

    //                    #     
    //                    #     
    // ###   #  #   ###   ###   
    // #  #  #  #  ##     #  #  
    // #  #  #  #    ##   #  #  
    // ###    ###  ###    #  #  
    // #                        
    /**
     * Adds a function to the queue.
     */
    push(fx) {
        this.promise = this.promise.then(() => {}).catch(() => {}).then(fx);
    }
}

module.exports = Queue;
