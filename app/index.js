const {app, BrowserWindow} = require("electron"),
    MainMenu = require("./mainmenu"),

    //                          #          #  #   #             #              
    //                          #          #  #                 #              
    //  ##   ###    ##    ###  ###    ##   #  #  ##    ###    ###   ##   #  #  
    // #     #  #  # ##  #  #   #    # ##  ####   #    #  #  #  #  #  #  #  #  
    // #     #     ##    # ##   #    ##    ####   #    #  #  #  #  #  #  ####  
    //  ##   #      ##    # #    ##   ##   #  #  ###   #  #   ###   ##   ####  
    /**
     * Creates the main window.
     */
    createWindow = () => {
        win = new BrowserWindow({show: false, width: 800, height: 600, minWidth: 800, minHeight: 600, icon: __dirname + "/../logo/logo.ico", title: "Hyperdrive Toolkit"}); // TODO: Get the right icon.
        win.loadURL(`file://${__dirname}/site/index.htm`);
        win.setMenu(null);
        win.maximize(); // TODO: Remember previous window position?
        win.toggleDevTools(); // TODO: Remove for release.

        win.once("ready-to-show", () => {
            win.show();
        });

        win.on("closed", () => {
            win = null;
        });

        this.menu = new MainMenu(win);
    };

var win;

//                                                                #        
//                                                                #        
//  ###  ###   ###          ##   ###         ###    ##    ###   ###  #  #  
// #  #  #  #  #  #        #  #  #  #        #  #  # ##  #  #  #  #  #  #  
// # ##  #  #  #  #        #  #  #  #        #     ##    # ##  #  #   # #  
//  # #  ###   ###          ##   #  #        #      ##    # #   ###    #   
//       #     #                                                      #    
app.on("ready", createWindow);

//                                                  #             #                          ##    ##                ##                          #  
//                                                                #                           #     #                 #                          #  
//  ###  ###   ###          ##   ###         #  #  ##    ###    ###   ##   #  #         ###   #     #           ##    #     ##    ###    ##    ###  
// #  #  #  #  #  #        #  #  #  #        #  #   #    #  #  #  #  #  #  #  #  ####  #  #   #     #    ####  #      #    #  #  ##     # ##  #  #  
// # ##  #  #  #  #        #  #  #  #        ####   #    #  #  #  #  #  #  ####        # ##   #     #          #      #    #  #    ##   ##    #  #  
//  # #  ###   ###          ##   #  #        ####  ###   #  #   ###   ##   ####         # #  ###   ###          ##   ###    ##   ###     ##    ###  
//       #     #                                                                                                                                    
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

//                                                        #     #                 #          
//                                                        #                       #          
//  ###  ###   ###          ##   ###          ###   ##   ###   ##    # #    ###  ###    ##   
// #  #  #  #  #  #        #  #  #  #        #  #  #      #     #    # #   #  #   #    # ##  
// # ##  #  #  #  #        #  #  #  #        # ##  #      #     #    # #   # ##   #    ##    
//  # #  ###   ###          ##   #  #         # #   ##     ##  ###    #     # #    ##   ##   
//       #     #                                                                             
app.on("activate", () => {
    if (win === null) {
        createWindow();
    }
});
