const http = require("http"),
    electron = require("electron"),
    Tmi = require("tmi.js"),
    TwitchHelix = require("twitch-helix"),
    Chat = require("../../../js/base/chat"),
    rangeRegex = /^([0-9]+)-([0-9]+)$/,
    urlRegex = /\b((?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?)\b/ig,
    defaultColors = ["Blue", "Coral", "DodgerBlue", "SpringGreen", "YellowGreen", "Green", "OrangeRed", "Red", "GoldenRod", "HotPink", "CadetBlue", "SeaGreen", "Chocolate", "BlueViolet", "Firebrick"],
    apiSettings = require("../../../js/apiSettings");

require("../../../js/extensions");

//  #####           #     #            #
//    #                   #            #
//    #    #   #   ##    ####    ###   # ##
//    #    #   #    #     #     #   #  ##  #
//    #    # # #    #     #     #      #   #
//    #    # # #    #     #  #  #   #  #   #
//    #     # #    ###     ##    ###   #   #
/**
 * A class to connect to Twitch chat.
 */
class Twitch extends Chat {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates an instance of Twitch chat.
     * @param {object} settings The settings used to connect to Twitch.
     */
    constructor (settings) {
        super();

        this.settings = settings;

        this.api = new TwitchHelix(settings.twitch);
    }

    //                                      #             #
    //                                      #             #
    //  ##    ##   ###   ###    ##    ##   ###    ##    ###
    // #     #  #  #  #  #  #  # ##  #      #    # ##  #  #
    // #     #  #  #  #  #  #  ##    #      #    ##    #  #
    //  ##    ##   #  #  #  #   ##    ##     ##   ##    ###
    /**
     * Determines whether you are connected to Twitch.
     * @return {bool} Whether you are connected.
     */
    get connected() {
        return this.tmi.readyState() === "OPEN";
    }

    //                                      #
    //                                      #
    //  ##    ##   ###   ###    ##    ##   ###
    // #     #  #  #  #  #  #  # ##  #      #
    // #     #  #  #  #  #  #  ##    #      #
    //  ##    ##   #  #  #  #   ##    ##     ##
    /**
     * Connects to Twitch chat.
     * @return {Promise} A promise that resolves when Twitch chat is connected.
     */
    connect() {
        const twitch = this;

        return new Promise((resolve, reject) => {
            if (twitch.tmi) {
                // TODO: Refine this.
                reject(new Error("You are already connected."));
                return;
            }

            if (!twitch.authorized) {
                reject(new Error("You must authorize your Twitch account before connecting."));
                return;
            }

            const {settings: {tmi: settings}} = twitch;
            settings.identity = {
                username: twitch.username,
                password: `oauth:${twitch.accessToken}`
            };

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

            const handleMessage = (event, channel, userstate, text, self) => {
                const span = $("<span></span>");

                if (userstate.emotes) {
                    const emotes = {};
                    let lastEnd = 0;

                    Object.keys(userstate.emotes).forEach((id) => {
                        const {emotes: {[id]: ranges}} = userstate;

                        ranges.forEach((range) => {
                            const matches = rangeRegex.exec(range);

                            emotes[+matches[1]] = {start: +matches[1], end: +matches[2], id: id};
                        });
                    });

                    Object.keys(emotes).sort((a, b) => a - b).forEach((start) => {
                        const emote = emotes[start];

                        if (start > lastEnd) {
                            const fragment = text.substring(lastEnd, start),
                                subspan = $("<span></span>");

                            subspan.text(fragment);
                            subspan.html(subspan.text().replace(urlRegex, (match, capture) => $("<div></div>").append($("<a></a>").attr({href: capture}).addClass("external-link").text(capture)).html()));

                            span.append(subspan.html());
                        }

                        span.append($("<img></img>").attr({
                            src: `https://static-cdn.jtvnw.net/emoticons/v1/${emote.id}/1.0`,
                            title: text.substring(start, emote.end + 1)
                        }).addClass("emote"));

                        lastEnd = emote.end + 1;
                    });

                    if (lastEnd < text.length) {
                        const fragment = text.substring(lastEnd),
                            subspan = $("<span></span>");

                        subspan.text(fragment);
                        subspan.html(subspan.text().replace(urlRegex, (match, capture) => $("<div></div>").append($("<a></a>").attr({href: capture}).addClass("external-link").text(capture)).html()));

                        span.append(subspan.html());
                    }
                } else {
                    span.text(text);
                    span.html(span.text().replace(urlRegex, (match, capture) => $("<div></div>").append($("<a></a>").attr({href: capture}).addClass("external-link").text(capture)).html()));
                }

                if (!userstate.color) {
                    userstate.color = defaultColors[(userstate.username.charCodeAt(0) + userstate.username.charCodeAt(userstate.username.length - 1)) % defaultColors.length];
                }

                if (userstate.bits) {

                } else {
                    switch (userstate["message-type"]) {
                        case "chat":
                            twitch.emit("message", channel, userstate.username, userstate.color, userstate["display-name"], userstate.badges, span.html(), text);
                            break;
                        case "whisper":
                            twitch.emit("whisper", channel, userstate.username, userstate.color, userstate["display-name"], userstate.badges, span.html(), text);
                            break;
                        default:
                            console.log("WARNING: Missing message-type", channel, userstate, text, self);
                            break;
                    }
                }
            };

            //  #           #     #          #            #           #                        #    # #                                               # #   #
            //  #                 #          #            #                                   #     # #                                               # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #  # #    ##    ###    ###    ###   ###   ##    # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          ####  # ##  ##     ##     #  #  #  #  # ##          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          #  #  ##      ##     ##   # ##   ##   ##            #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #         #  #   ##   ###    ###     # #  #      ##          #
            //                                                                                                                            ###
            twitch.tmi.on("message", (channel, userstate, message, self) => handleMessage("message", channel, userstate, message, self));

            //  #           #     #          #            #           #                        #    # #    #          #           # #   #
            //  #                 #          #            #                                   #     # #                           # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #    #    ##   ##    ###    # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #            #   #  #   #    #  #          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #            #   #  #   #    #  #          #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #         # #    ##   ###   #  #         #
            //                                                                                            #
            twitch.tmi.on("join", (channel, username, self) => {
                twitch.emit("join", channel, username, self);
            });

            //  #           #     #          #            #           #                        #    # #                     #     # #   #
            //  #                 #          #            #                                   #     # #                     #     # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #  ###    ###  ###   ###    # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          #  #  #  #  #  #   #            #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          #  #  # ##  #      #            #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #         ###    # #  #       ##         #
            //                                                                                           #
            twitch.tmi.on("part", (channel, username, self) => {
                twitch.emit("part", channel, username, self);
            });

            //  #           #     #          #            #           #                        #    # #                 #   # #   #
            //  #                 #          #            #                                   #     # #                 #   # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #  # #    ##    ###   # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          ####  #  #  #  #          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          #  #  #  #  #  #          #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #         #  #   ##    ###         #
            twitch.tmi.on("mod", (channel, username) => {
                twitch.emit("mod", channel, username);
            });

            //  #           #     #          #            #           #                        #    # #                             #   # #   #
            //  #                 #          #            #                                   #     # #                             #   # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #  #  #  ###   # #    ##    ###   # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          #  #  #  #  ####  #  #  #  #          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          #  #  #  #  #  #  #  #  #  #          #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #          ###  #  #  #  #   ##    ###         #
            twitch.tmi.on("unmod", (channel, username) => {
                twitch.emit("unmod", channel, username);
            });

            //  #           #     #          #            #           #                        #    # #  #                  # #   #
            //  #                 #          #            #                                   #     # #  #                  # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #  ###    ###  ###    # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          #  #  #  #  #  #          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          #  #  # ##  #  #          #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #         ###    # #  #  #         #
            twitch.tmi.on("ban", (channel, username, reason) => {
                twitch.emit("ban", channel, username, reason);
            });

            //  #           #     #          #            #           #                        #    # #        #                        # #   #
            //  #                 #          #            #                                   #     # #        #                        # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #   ##   ###    ##    ##   ###    # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          #     #  #  # ##  # ##  #  #          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          #     #  #  ##    ##    #             #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #          ##   #  #   ##    ##   #            #
            twitch.tmi.on("cheer", (channel, userstate, message) => handleMessage("message", channel, userstate, message));

            //  #           #     #          #            #           #                        #    # #        ##                            #            #     # #   #
            //  #                 #          #            #                                   #     # #         #                            #            #     # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #   ##    #     ##    ###  ###    ##   ###    ###  ###    # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          #      #    # ##  #  #  #  #  #     #  #  #  #   #            #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          #      #    ##    # ##  #     #     #  #  # ##   #            #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #          ##   ###    ##    # #  #      ##   #  #   # #    ##         #
            twitch.tmi.on("clearchat", (channel) => {
                twitch.emit("clearchat", channel);
            });

            //  #           #     #          #            #           #                        #    # #                     #                      ##           # #   #
            //  #                 #          #            #                                   #     # #                     #                       #           # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #   ##   # #    ##   ###    ##    ##   ###    #    #  #   # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          # ##  ####  #  #   #    # ##  #  #  #  #   #    #  #          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          ##    #  #  #  #   #    ##    #  #  #  #   #     # #          #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #          ##   #  #   ##     ##   ##    ##   #  #  ###     #          #
            //                                                                                                                                            #
            twitch.tmi.on("emoteonly", (channel, enabled) => {
                twitch.emit("emoteonly", channel, enabled);
            });

            //  #           #     #          #            #           #                        #    # #    #         ##    ##                                               ##           # #   #
            //  #                 #          #            #                                   #     # #   # #         #     #                                                #           # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #   #     ##    #     #     ##   #  #   ##   ###    ###    ##   ###    #    #  #   # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          ###   #  #   #     #    #  #  #  #  # ##  #  #  ##     #  #  #  #   #    #  #          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #           #    #  #   #     #    #  #  ####  ##    #       ##   #  #  #  #   #     # #          #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #          #     ##   ###   ###    ##   ####   ##   #     ###     ##   #  #  ###     #          #
            //                                                                                                                                                                     #
            twitch.tmi.on("followersonly", (channel, enabled, length) => {
                twitch.emit("followersonly", channel, enabled, length);
            });

            //  #           #     #          #            #           #                        #    # #  #                   #             #   # #   #
            //  #                 #          #            #                                   #     # #  #                   #             #   # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #  ###    ##    ###   ###    ##    ###   # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          #  #  #  #  ##      #    # ##  #  #          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          #  #  #  #    ##    #    ##    #  #          #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #         #  #   ##   ###      ##   ##    ###         #
            twitch.tmi.on("hosted", (channel, username, viewers, autohost) => {
                twitch.emit("hosted", channel, username, viewers, autohost);
            });

            //  #           #     #          #            #           #                        #    # #  #                   #     #                 # #   #
            //  #                 #          #            #                                   #     # #  #                   #                       # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #  ###    ##    ###   ###   ##    ###    ###   # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          #  #  #  #  ##      #     #    #  #  #  #          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          #  #  #  #    ##    #     #    #  #   ##           #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #         #  #   ##   ###      ##  ###   #  #  #            #
            //                                                                                                                                 ###
            twitch.tmi.on("hosting", (channel, target, viewers) => {
                twitch.emit("hosting", channel, target, viewers);
            });

            //  #           #     #          #            #           #                        #    # #         ##   #     #            #           # #   #
            //  #                 #          #            #                                   #     # #        #  #  #     #            #           # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #  ###   #  #  # #   ###    ##   ###    ###   # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          #  #   ###  ##    #  #  # ##   #    #  #          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          #        #  # #   #  #  ##     #    # ##          #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #         #      ##   #  #  ###    ##     ##   # #         #
            twitch.tmi.on("r9kbeta", (channel, enabled) => {
                twitch.emit("r9kbeta", channel, enabled);
            });

            //  #           #     #          #            #           #                        #    # #                           #      # #   #
            //  #                 #          #            #                                   #     # #                           #      # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #  ###    ##    ###   #  #  ###    # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          #  #  # ##  ##     #  #  #  #          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          #     ##      ##   #  #  #  #          #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #         #      ##   ###     ###  ###          #
            twitch.tmi.on("resub", (channel, username, months, message, userstate, methods) => {
                twitch.emit("resub", channel, username, months, message, userstate, methods);
            });

            //  #           #     #          #            #           #                        #    # #                                  #           #           # #   #
            //  #                 #          #            #                                   #     # #                                  #           #           # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #  ###    ##    ##   # #    ###   ###    ###  ###    ##    # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          #  #  #  #  #  #  ####  ##      #    #  #   #    # ##          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          #     #  #  #  #  #  #    ##    #    # ##   #    ##            #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #         #      ##    ##   #  #  ###      ##   # #    ##   ##          #
            twitch.tmi.on("roomstate", (channel, state) => {
                twitch.emit("roomstate", channel, state);
            });

            //  #           #     #          #            #           #                        #    # #         ##                               #         # #   #
            //  #                 #          #            #                                   #     # #          #                               #         # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #   ###    #     ##   #  #  # #    ##    ###   ##    # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          ##      #    #  #  #  #  ####  #  #  #  #  # ##          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #            ##    #    #  #  ####  #  #  #  #  #  #  ##            #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #         ###    ###    ##   ####  #  #   ##    ###   ##          #
            twitch.tmi.on("slowmode", (channel, enabled, length) => {
                twitch.emit("slowmode", channel, enabled, length);
            });

            //  #           #     #          #            #           #                        #    # #               #                         #    #                         # #   #
            //  #                 #          #            #                                   #     # #               #                              #                         # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #   ###   #  #  ###    ###    ##   ###   ##    ###    ##   ###    ###    # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          ##     #  #  #  #  ##     #     #  #   #    #  #  # ##  #  #  ##             #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #            ##   #  #  #  #    ##   #     #      #    #  #  ##    #       ##           #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #         ###     ###  ###   ###     ##   #     ###   ###    ##   #     ###           #
            twitch.tmi.on("subscribers", (channel, enabled) => {
                twitch.emit("subscribers", channel, enabled);
            });

            //  #           #     #          #            #           #                        #    # #               #                         #           #     #                 # #   #
            //  #                 #          #            #                                   #     # #               #                                     #                       # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #   ###   #  #  ###    ###    ##   ###   ##    ###   ###   ##     ##   ###    # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          ##     #  #  #  #  ##     #     #  #   #    #  #   #     #    #  #  #  #          #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #            ##   #  #  #  #    ##   #     #      #    #  #   #     #    #  #  #  #          #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #         ###     ###  ###   ###     ##   #     ###   ###     ##  ###    ##   #  #         #
            //                                                                                                                                       #
            twitch.tmi.on("subscription", (channel, username, method, message, userstate) => {
                twitch.emit("subscription", channel, username, method, message, userstate);
            });

            //  #           #     #          #            #           #                        #    # #   #     #                             #     # #   #
            //  #                 #          #            #                                   #     # #   #                                   #     # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #  ###   ##    # #    ##    ##   #  #  ###    # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #           #     #    ####  # ##  #  #  #  #   #            #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #           #     #    #  #  ##    #  #  #  #   #            #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #           ##  ###   #  #   ##    ##    ###    ##         #
            twitch.tmi.on("timeout", (channel, username, reason, duration) => {
                twitch.emit("timeout", channel, username, reason, duration);
            });

            //  #           #     #          #            #           #                        #    # #              #                   #     # #   #
            //  #                 #          #            #                                   #     # #              #                   #     # #    #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##   ###    #     # #  #  #  ###   ###    ##    ###   ###    # #    #
            //  #    #  #   #     #    #     #  #         #    ####   #          #  #  #  #   #          #  #  #  #  #  #  #  #  ##      #            #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #  #  #  #   #          #  #  #  #  #  #  #  #    ##    #            #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##   #  #    #          ###  #  #  #  #   ##   ###      ##         #
            twitch.tmi.on("unhost", (channel, viewers) => {
                twitch.emit("unhost", channel, viewers);
            });

            //  #           #     #          #            #           #                                               #      #    #
            //  #                 #          #            #                                                           #     #      #
            // ###   #  #  ##    ###    ##   ###         ###   # #   ##           ##    ##   ###   ###    ##    ##   ###    #      #
            //  #    #  #   #     #    #     #  #         #    ####   #          #     #  #  #  #  #  #  # ##  #      #     #      #
            //  #    ####   #     #    #     #  #   ##    #    #  #   #     ##   #     #  #  #  #  #  #  ##    #      #     #      #
            //   ##  ####  ###     ##   ##   #  #   ##     ##  #  #  ###    ##    ##    ##   #  #  #  #   ##    ##     ##    #    #
            twitch.tmi.connect().then(() => {
                twitch.tmi.raw("CAP REQ :twitch.tv/membership twitch.tv/commands twitch.tv/tags");

                resolve();
            }).catch((err) => {
                // TODO: Handle the error more gracefully.
                reject(err);
            });
        });
    }

    //              #    #                  #                   #
    //              #    #                                      #
    //  ###  #  #  ###   ###    ##   ###   ##    ####   ##    ###
    // #  #  #  #   #    #  #  #  #  #  #   #      #   # ##  #  #
    // # ##  #  #   #    #  #  #  #  #      #     #    ##    #  #
    //  # #   ###    ##  #  #   ##   #     ###   ####   ##    ###
    /**
     * Determines whether you are authorized to connect to Twitch chat.
     * @return {bool} Whether you are authorized.
     */
    get authorized() {
        return !!this.accessToken;
    }

    //              #    #                  #
    //              #    #
    //  ###  #  #  ###   ###    ##   ###   ##    ####   ##
    // #  #  #  #   #    #  #  #  #  #  #   #      #   # ##
    // # ##  #  #   #    #  #  #  #  #      #     #    ##
    //  # #   ###    ##  #  #   ##   #     ###   ####   ##
    /**
     * Authorizes you to use Twitch chat.
     * @param {string} username The username to authorize with.
     * @param {string} accessToken The access token to authorize with.
     */
    authorize(username, accessToken) {
        var twitch = this;

        return new Promise((resolve, reject) => {
            const {api} = twitch;

            new Promise((innerResolve, innerReject) => {
                if (username && accessToken) {
                    api.accessToken = accessToken;

                    api.sendHelixRequest("users").then((data) => {
                        twitch.accessToken = accessToken;

                        ({login: twitch.username, display_name: twitch.displayName, id: twitch.id} = data[0]);

                        twitch.emit("credentials", twitch.username, twitch.accessToken);

                        innerResolve();
                    }).catch((err) => {
                        innerReject(err);
                    });
                } else {
                    innerReject(new Error("Not logged in."));
                }
            }).then(resolve).catch(() => {
                let win = new electron.remote.BrowserWindow({width: 800, height: 600, parent: electron.remote.BrowserWindow.getAllWindows().find((w) => w.getTitle() === "Hyperdrive Toolkit"), modal: true, title: "Hyperdrive Toolkit - Waiting for Twitch OAuth"});

                win.loadURL(`file://${__dirname}/twitch.htm`);
                win.setMenu(null);

                win.once("ready-to-show", () => {
                    win.show();
                });

                win.on("access-token", (newAccessToken) => {
                    twitch.accessToken = newAccessToken;
                    api.sendHelixRequest("users").then((data) => {
                        twitch.accessToken = accessToken;

                        ({login: twitch.username, display_name: twitch.displayName, id: twitch.id} = data[0]);

                        twitch.emit("credentials", twitch.username, twitch.accessToken);
                    }); // TODO: .catch((err) => {})
                });

                win.on("closed", () => {
                    win = null;

                    if (twitch.accessToken) {
                        resolve();
                    } else {
                        reject(new Error("Not logged in."));
                    }
                });

                const authorizationUrl = `https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=${apiSettings.twitch.clientId}&redirect_uri=${apiSettings.twitch.redirectUri}&scope=${apiSettings.twitch.scopes.join("+")}&force_verify=true`;

                electron.shell.openExternal(authorizationUrl);
            });
        });
    }

    //   #          #
    //
    //   #    ##   ##    ###
    //   #   #  #   #    #  #
    //   #   #  #   #    #  #
    // # #    ##   ###   #  #
    //  #
    /**
     * Joins you to a channel.
     * @param {string} channel The channel to join.
     * @return {Promise} A promise that resolves when joining is successful.
     */
    join(channel) {
        return this.tmi.join(channel);
    }

    //                    #
    //                    #
    // ###    ###  ###   ###
    // #  #  #  #  #  #   #
    // #  #  # ##  #      #
    // ###    # #  #       ##
    // #
    /**
     * Parts you from a channel.
     * @param {string} channel The channel to part.
     * @return {Promise} A promise that resolves when parting is successful.
     */
    part(channel) {
        return this.tmi.part(channel);
    }

    //                       #
    //                       #
    //  ###    ##   ###    ###
    // ##     # ##  #  #  #  #
    //   ##   ##    #  #  #  #
    // ###     ##   #  #   ###
    /**
     * Sends a command to a channel.
     * @param {string} channel The channel to send the command to.
     * @param {string} command The command to send.
     * @return {Promise} A promise that resolves when sending is successful.
     */
    send(channel, command) {
        return this.tmi.say(channel, command);
    }

    // #
    // #
    // ###    ###  ###
    // #  #  #  #  #  #
    // #  #  # ##  #  #
    // ###    # #  #  #
    ban(channel, username, reason) {
        return this.tmi.ban(channel, username, reason);
    }

    //             #
    //             #
    // #  #  ###   ###    ###  ###
    // #  #  #  #  #  #  #  #  #  #
    // #  #  #  #  #  #  # ##  #  #
    //  ###  #  #  ###    # #  #  #
    unban(channel, username) {
        return this.tmi.unban(channel, username);
    }

    //  #     #                             #
    //  #                                   #
    // ###   ##    # #    ##    ##   #  #  ###
    //  #     #    ####  # ##  #  #  #  #   #
    //  #     #    #  #  ##    #  #  #  #   #
    //   ##  ###   #  #   ##    ##    ###    ##
    timeout(channel, username, seconds, reason) {
        return this.tmi.timeout(channel, username, seconds, reason);
    }

    //                #
    //                #
    // # #    ##    ###
    // ####  #  #  #  #
    // #  #  #  #  #  #
    // #  #   ##    ###
    mod(channel, username) {
        return this.tmi.mod(channel, username);
    }

    //                            #
    //                            #
    // #  #  ###   # #    ##    ###
    // #  #  #  #  ####  #  #  #  #
    // #  #  #  #  #  #  #  #  #  #
    //  ###  #  #  #  #   ##    ###
    unmod(channel, username) {
        return this.tmi.unmod(channel, username);
    }

    //   #         ##    ##
    //  # #         #     #
    //  #     ##    #     #     ##   #  #
    // ###   #  #   #     #    #  #  #  #
    //  #    #  #   #     #    #  #  ####
    //  #     ##   ###   ###    ##   ####
    follow(username, notifications) {
        // TODO: Allow user to set whether they receive notifications when the channel goes live.
        const twitch = this,
            {api} = this;

        return api.getTwitchUserByName(username).then((data) => data.id).then((id) => api.sendApiRequest(`users/${twitch.id}/follows/channel/${id}`, {requestOptions: {method: "PUT", json: {notifications: !!notifications}}, api: "kraken"}));
    }

    //               #         ##    ##
    //              # #         #     #
    // #  #  ###    #     ##    #     #     ##   #  #
    // #  #  #  #  ###   #  #   #     #    #  #  #  #
    // #  #  #  #   #    #  #   #     #    #  #  ####
    //  ###  #  #   #     ##   ###   ###    ##   ####
    unfollow(username) {
        const twitch = this,
            {api} = this;

        return api.getTwitchUserByName(username).then((data) => data.id).then((id) => api.sendApiRequest(`users/${twitch.id}/follows/channel/${id}`, {requestOptions: {method: "DELETE"}, api: "kraken"}));
    }

    //              #     ##    #
    //              #    #  #   #
    //  ###   ##   ###    #    ###   ###    ##    ###  # #
    // #  #  # ##   #      #    #    #  #  # ##  #  #  ####
    //  ##   ##     #    #  #   #    #     ##    # ##  #  #
    // #      ##     ##   ##     ##  #      ##    # #  #  #
    //  ###
    /**
     * Gets data for a stream.
     * @param {string} channel The channel to get stream data for.
     * @return {Promise} A promise that resolves when the stream data is sent.
     */
    getStream(channel) {
        const {api} = this;

        return api.sendHelixRequest("streams", {
            requestOptions: {
                qs: {
                    user_login: channel,
                    type: "all"
                }
            }
        }).then((streams) => {
            if (streams && streams[0]) {
                return streams[0];
            }

            throw new Error("Stream is not online.");
        });
    }

    //              #     ##   #                             ##
    //              #    #  #  #                              #
    //  ###   ##   ###   #     ###    ###  ###   ###    ##    #
    // #  #  # ##   #    #     #  #  #  #  #  #  #  #  # ##   #
    //  ##   ##     #    #  #  #  #  # ##  #  #  #  #  ##     #
    // #      ##     ##   ##   #  #   # #  #  #  #  #   ##   ###
    //  ###
    /**
     * Gets data for a channel.
     * @param {string} channel The channel to get data for.
     * @return {Promise} A promise that resolves when the channel data is sent.
     */
    getChannel(channel) {
        const {api} = this;

        return api.getTwitchUserByName(channel).then((data) => data.id).then((id) => api.sendApiRequest(`channels/${id}`, {api: "kraken"})).then((channels) => {
            if (channels && channels.body) {
                return channels.body;
            }

            throw new Error("Channel does not exist.");
        });
    }

    //              #     ##   #            #     #
    //              #    #  #  #            #     #
    //  ###   ##   ###   #     ###    ###  ###   ###    ##   ###    ###
    // #  #  # ##   #    #     #  #  #  #   #     #    # ##  #  #  ##
    //  ##   ##     #    #  #  #  #  # ##   #     #    ##    #       ##
    // #      ##     ##   ##   #  #   # #    ##    ##   ##   #     ###
    //  ###
    /**
     * Gets the list of chatters for a channel.
     * @param {string} channel The channel to get the list of chatters for.
     * @return {Promise} A promise that resolves when the chatters are sent.
     */
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

    //              #     ##   #                             ##    ###            #
    //              #    #  #  #                              #    #  #           #
    //  ###   ##   ###   #     ###    ###  ###   ###    ##    #    ###    ###   ###   ###   ##    ###
    // #  #  # ##   #    #     #  #  #  #  #  #  #  #  # ##   #    #  #  #  #  #  #  #  #  # ##  ##
    //  ##   ##     #    #  #  #  #  # ##  #  #  #  #  ##     #    #  #  # ##  #  #   ##   ##      ##
    // #      ##     ##   ##   #  #   # #  #  #  #  #   ##   ###   ###    # #   ###  #      ##   ###
    //  ###                                                                           ###
    /**
     * Gets the user badges that can be used in a channel.
     * @param {string} channelID The channel ID to get user badges for.
     * @return {Promise} A promise that resolves when the badges are sent.
     */
    getChannelBadges(channelID) {
        return new Promise((resolve, reject) => {
            const fxs = [
                new Promise((resolve, reject) => {
                    http.get("http://badges.twitch.tv/v1/badges/global/display", (res) => {
                        var body = "";

                        res.on("data", (chunk) => {
                            body += chunk;
                        });
                        res.on("end", () => {
                            JSON.tryParse(body).then(resolve).catch(reject);
                        });
                        // TODO: Handle errors on res
                    });
                }),
                new Promise((resolve, reject) => {
                    http.get(`http://badges.twitch.tv/v1/badges/channels/${channelID}/display?language=en`, (res) => { // TODO: Languages!
                        var body = "";

                        res.on("data", (chunk) => {
                            body += chunk;
                        });
                        res.on("end", () => {
                            JSON.tryParse(body).then(resolve).catch(reject);
                        });
                        // TODO: Handle errors on res
                    });
                }),
            ];

            Promise.all(fxs).then((badgeArray) => {
                const [{badge_sets: globalBadges}, {badge_sets: channelBadges}] = badgeArray;

                Object.keys(channelBadges).forEach((key) => {
                    ({[key]: globalBadges[key]} = channelBadges);
                });

                resolve(globalBadges);
            }).catch(reject);
        });
    }

    //               #     ##    #           #
    //               #    #  #   #           #
    //  ###    ##   ###    #    ###    ###  ###   #  #   ###
    // ##     # ##   #      #    #    #  #   #    #  #  ##
    //   ##   ##     #    #  #   #    # ##   #    #  #    ##
    // ###     ##     ##   ##     ##   # #    ##   ###  ###
    /**
     * Sets the channel's status.
     * @param {string} channel The channel to set the status for.
     * @param {object} status The status to set.
     * @return {Promise} A promise that resolves when the status is set.
     */
    setStatus(channel, status) {
        const {api} = this;

        return api.getTwitchUserByName(channel).then((data) => data.id).then((id) => api.sendApiRequest(`channels/${id}`, {requestOptions: {method: "PUT", json: {channel: status}}, api: "kraken"}));
    }
}

module.exports = Twitch;
