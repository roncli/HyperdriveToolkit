var Chat = require("../../../js/base/chat"),
    electron = require("electron"),
    Tmi = require("tmi.js"),
    TwitchApi = require("twitch-api");

class Twitch extends Chat {
    constructor (settings) {
        super();

        this.settings = settings;

        this.api = new TwitchApi(settings.twitch);
    }

    get connected() {
        // TODO: Return whether or not we're connected to TMI.
    }

    connect() {
        var twitch = this;

        return new Promise((resolve, reject) => {
            var settings;

            if (twitch.tmi) {
                // TODO: Refine this.
                reject("You are already connected.");
                return;
            }

            if (!twitch.authorized) {
                reject("You must authorize your Twitch account before connecting.");
                return;
            }

            settings = twitch.settings.tmi;
            settings.identity.password = `oauth:${twitch.accessToken}`;

            twitch.tmi = new Tmi.client(settings);

            // TODO: See what events we want to forward. https://docs.tmijs.org/v1.1.2/Events.html#join

            twitch.tmi.on("connected", (address, port) => {
                twitch.emit("connected", address, port);
            });

            twitch.tmi.on("disconnected", (message) => {
                twitch.emit("disconnected", message);
                console.log("DISCONNECTED", message);
                // TODO: Something when chat disconnects.
                // tmi.disconnect().then(function() {
                //     tmiConnect();
                // }).catch(function() {
                //     tmiConnect();
                // });
            });

            twitch.tmi.on("message", (channel, userstate, text, self) => {
                twitch.emit("message", channel, userstate.username, userstate["display-name"], text);
            });

            twitch.tmi.on("join", (channel, username, self) => {
                twitch.emit("join", channel, username, self);
            });

            twitch.tmi.on("part", (channel, username, self) => {
                twitch.emit("part", channel, username, self);
            });

            twitch.tmi.on("mod", (channel, username) => {
                twitch.emit("mod", channel, username);
            });

            twitch.tmi.on("unmod", (channel, username) => {
                twitch.emit("unmod", channel, username);
            });

            twitch.tmi.connect().then(() => {
                twitch.tmi.raw("CAP REQ :twitch.tv/membership");

                resolve();
            }).catch((err) => {
                // TODO: Handle the error more gracefully.
                reject(err);
            });
        });
    }

    get authorized() {
        return !!(this.accessToken);
    }

    authorize() {
        var twitch = this,
            api = this.api,
            win = new electron.remote.BrowserWindow({width: 800, height: 600, parent: electron.remote.BrowserWindow.getAllWindows().find((w) => w.getTitle() === "Hyperdrive Toolkit"), modal: true, title: "Hyperdrive Toolkit - Waiting for Twitch OAuth"});

        return new Promise((resolve, reject) => {
            win.loadURL(`file://${__dirname}/twitch.htm`);
            win.setMenu(null);

            win.once("ready-to-show", () => {
                win.show();
            });

            win.on("access-token", (accessToken) => {
                twitch.accessToken = accessToken;
            });

            win.on("closed", () => {
                win = null;
                if (twitch.accessToken) {
                    resolve();
                } else {
                    reject();
                }
            });

            electron.shell.openExternal(api.getAuthorizationUrl().replace("response_type=code", "response_type=token") + "&force_verify=true");
        });
    }

    join(channel) {
        this.tmi.join(channel);
    }

    part(channel) {
        this.tmi.part(channel);
    }
}

module.exports = Twitch;
