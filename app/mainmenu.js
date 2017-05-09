const electron = require("electron"),
    BrowserWindow = electron.BrowserWindow,
    Menu = electron.Menu;

//  #   #           #           #   #                      
//  #   #                       #   #                      
//  ## ##   ###    ##    # ##   ## ##   ###   # ##   #   # 
//  # # #      #    #    ##  #  # # #  #   #  ##  #  #   # 
//  #   #   ####    #    #   #  #   #  #####  #   #  #   # 
//  #   #  #   #    #    #   #  #   #  #      #   #  #  ## 
//  #   #   ####   ###   #   #  #   #   ###   #   #   ## # 
/**
 * The main menu for the application.
 */
class MainMenu {
    //                           #                       #                
    //                           #                       #                
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###   
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #  
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #     
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #     
    /**
     * Creates the main menu and attaches it to the application.
     * @param {BrowserWindow} win The browser window to set as the parent of windows opened by the main menu.
     */
    constructor(win) {
        var mainMenu = this,
            isMac = process.platform === "darwin",
            template = [
                {
                    label: "&File",
                    submenu: [
                        {
                            label: "&Settings",
                            click: () => {
                                if (mainMenu.settingsWin) {
                                    mainMenu.settingsWin.show();
                                } else {
                                    mainMenu.settingsWin = new BrowserWindow({show: false, width: 800, height: 600, icon: __dirname + "/../logo/logo.ico", title: "Settings - Hyperdrive Toolkit", parent: mainMenu.win}); // TODO: Get the right icon, setup proper dimensions, don't allow change in size.

                                    mainMenu.settingsWin.loadURL(`file://${__dirname}/site/settings.htm`);
                                    mainMenu.settingsWin.setMenu(null);
                                    mainMenu.settingsWin.toggleDevTools(); // TODO: Remove for release.

                                    mainMenu.settingsWin.once("ready-to-show", () => {
                                        mainMenu.settingsWin.show();
                                    });

                                    mainMenu.settingsWin.on("closed", () => {
                                        mainMenu.settingsWin = null;
                                    });
                                }
                            }
                        },
                        {
                            type: "separator"
                        },
                        {
                            label: isMac ? "&Quit" : "E&xit",
                            accelerator: isMac ? "Cmd+Q" : "Alt+F4",
                            role: "quit"
                        }
                    ]
                },
                {
                    label: "&Edit",
                    submenu: [
                        {
                            label: "&Undo",
                            accelerator: "CmdOrCtrl+Z"
                        },
                        {
                            label: "&Redo",
                            accelerator: "CmdOrCtrl+Y"
                        },
                        {
                            type: "separator"
                        },
                        {
                            label: "Cu&t",
                            accelerator: "CmdOrCtrl+X"
                        },
                        {
                            label: "&Copy",
                            accelerator: "CmdOrCtrl+C"
                        },
                        {
                            label: "&Paste",
                            accelerator: "CmdOrCtrl+V"
                        },
                        {
                            label: "&Delete",
                            accelerator: "Delete"
                        },
                        {
                            label: "Select A&ll",
                            accelerator: "CmdOrCtrl+A"
                        }
                    ]
                }
            ],
            menu = Menu.buildFromTemplate(template);

        this.win = win;
        Menu.setApplicationMenu(menu);
    }
}

module.exports = MainMenu;
