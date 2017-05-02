var settingsWin;

const {Menu, BrowserWindow} = require("electron"),
    isMac = process.platform === "darwin",
    template = [
        {
            label: "&File",
            submenu: [
                {
                    label: "&Settings",
                    click: (menuItem, browserWindow, ev) => {
                        if (settingsWin) {
                            // TODO: Focus settings window.
                        } else {
                            settingsWin = new BrowserWindow({show: false, width: 800, height: 600, icon: __dirname + "/../logo/logo.ico", title: "Settings - Hyperdrive Toolkit"}); // TODO: Get the right icon, setup proper dimensions, don't allow change in size.

                            settingsWin.loadURL(`file://${__dirname}/site/settings.htm`);
                            settingsWin.setMenu(null);
                            settingsWin.toggleDevTools(); // TODO: Remove for release.

                            settingsWin.once("ready-to-show", () => {
                                settingsWin.show();
                            });

                            settingsWin.on("closed", () => {
                                settingsWin = null;
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

Menu.setApplicationMenu(menu);
