var http = require("http"),
    electron = require("electron"),
    Tmi = require("tmi.js"),
    TwitchApi = require("twitch-api"),
    Chat = require("../../../js/base/chat"),
    rangeRegex = /^([0-9]+)-([0-9]+)$/;

require("../../../js/extensions");

TwitchApi.prototype.getEmoticonImages = function(callback) {
    this._executeRequest(
        {
            method: 'GET',
            path: '/chat/emoticon_images',
        },
        callback
    );
}

class Twitch extends Chat {
    constructor (settings) {
        super();

        this.settings = settings;

        this.api = new TwitchApi(settings.twitch);
    }

    get connected() {
        return this.tmi.readyState() === "OPEN";
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
            settings.identity = {
                username: twitch.username,
                password: `oauth:${twitch.accessToken}`
            };

            twitch.tmi = new Tmi.client(settings);

            // TODO: See what events we want to forward. https://docs.tmijs.org/v1.1.2/Events.html#join

            twitch.tmi.on("connected", (address, port) => {
                twitch.emit("connected", address, port);
                //twitch.api.getEmoticonImages((err, emotes) => console.log(err, emotes));
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
                var span = $("<span></span>");
                if (userstate.emotes) {
                    let emotes = {},
                        lastEnd = 0;
                    Object.keys(userstate.emotes).forEach((id) => {
                        var ranges = userstate.emotes[id];
                        ranges.forEach((range) => {
                            var matches = rangeRegex.exec(range);
                            emotes[+matches[1]] = {start: +matches[1], end: +matches[2], id: id};
                        });
                    });
                    Object.keys(emotes).sort((a, b) => a.start - b.start).forEach((start) => {
                        var emote = emotes[start];

                        if (start > lastEnd) {
                            span.append($("<span></span>").text(text.substring(lastEnd, start)).html());
                        }

                        span.append($("<img></img>").attr({
                            src: `https://static-cdn.jtvnw.net/emoticons/v1/${emote.id}/1.0`,
                            title: text.substring(start, emote.end + 1)
                        }));

                        lastEnd = emote.end + 1;
                    });
                    if (lastEnd < text.length) {
                        span.append($("<span></span>").text(text.substring(lastEnd)).html());
                    }
                } else {
                    span.text(text);
                }
                twitch.emit("message", channel, userstate.username, userstate.color, userstate["display-name"], span.html());
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
                twitch.tmi.raw("CAP REQ :twitch.tv/membership twitch.tv/commands twitch.tv/tags");

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

    authorize(username, accessToken) {
        var twitch = this;
        
        return new Promise((resolve, reject) => {
            var api = twitch.api;

            new Promise((innerResolve, innerReject) => {
                if (username && accessToken) {
                    api.getAuthenticatedUser(accessToken, (err, body) => {
                        if (err) {
                            innerReject();
                            // TODO: Handle the error more gracefully.
                        }

                        twitch.accessToken = accessToken;
                        twitch.username = body.name;
                        twitch.displayName = body.display_name;

                        twitch.emit("credentials", twitch.username, twitch.accessToken);

                        innerResolve();
                    });
                } else {
                    innerReject();
                }
            }).then(resolve).catch(() => {
                var win = new electron.remote.BrowserWindow({width: 800, height: 600, parent: electron.remote.BrowserWindow.getAllWindows().find((w) => w.getTitle() === "Hyperdrive Toolkit"), modal: true, title: "Hyperdrive Toolkit - Waiting for Twitch OAuth"});
                
                win.loadURL(`file://${__dirname}/twitch.htm`);
                win.setMenu(null);

                win.once("ready-to-show", () => {
                    win.show();
                });

                win.on("access-token", (accessToken) => {
                    twitch.accessToken = accessToken;
                    api.getAuthenticatedUser(twitch.accessToken, (err, body) => {
                        if (err) {
                            // TODO: Handle the error more gracefully.
                        }

                        twitch.username = body.name;
                        twitch.displayName = body.display_name;

                        twitch.emit("credentials", twitch.username, twitch.accessToken);
                    });
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
        });
    }

    join(channel) {
        return this.tmi.join(channel);
    }

    part(channel) {
        return this.tmi.part(channel);
    }

    send(channel, command) {
        return this.tmi.say(channel, command);
    }

    getStream(channel) {
        var api = this.api;

        return new Promise((resolve, reject) => {
            api.getChannelStream(channel, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(stream.stream);
            });
        });
    }

    getChannel(channel) {
        var api = this.api;

        return new Promise((resolve, reject) => {
            api.getChannel(channel, (err, channelData) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(channelData);
            });
        });
    }

    getChatters(channel) {
        return new Promise((resolve, reject) => {
            http.get("http://tmi.twitch.tv/group/user/" + channel + "/chatters", (res) => {
                var body = "";
                res.on("data", (chunk) => {
                    body += chunk;
                });
                res.on("end", () => {
                    JSON.tryParse(body).then(resolve).catch(reject);
                });
                // TODO: Handle errors on res
            });
        });
    }
}

module.exports = Twitch;