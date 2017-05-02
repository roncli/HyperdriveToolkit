var electron = require("electron"),
    path = require("path"),
    File = require("./modules/datastore/file"),
    appSettings = new File(path.join(electron.remote.app.getPath("userData"), "appSettings.js"));

$(document).ready(() => {
    appSettings.load().then(() => {
        if (!appSettings.data.chat) {
            appSettings.data.chat = {
                font: {
                    face: "",
                    size: 12
                },
                colors: {
                    chat: {
                        foreground: "#000000",
                        background: "#ffffff",
                        info: "#8000ff",
                        join: "#333333",
                        part: "#333333",
                        highlight: "#ff0000"
                    },
                    input: {
                        foreground: "#000000",
                        background: "#ffffff"
                    },
                    userList: {
                        foreground: "#000000",
                        background: "#ffffff"
                    }
                }
            };
        }
    });
});
