const path = require("path"),
    electron = require("electron"),
    {remote, remote: {Menu, MenuItem, app}} = electron,
    win = remote.getCurrentWindow(),
    tinycolor = require("tinycolor2"),
    Twitch = require("./modules/chat/twitch"), // TODO: Load modules
    File = require("./modules/datastore/file"),
    settings = require("./js/apiSettings"),
    client = new Twitch(settings),
    Utilities = require("./js/utilities");

var channels = {},
    profileWin, editChannelWin;

class Index {
    //              #    ###                     ##
    //              #    #  #                     #
    //  ###   ##   ###   #  #   ###  ###    ##    #
    // #  #  # ##   #    ###   #  #  #  #  # ##   #
    //  ##   ##     #    #     # ##  #  #  ##     #
    // #      ##     ##  #      # #  #  #   ##   ###
    //  ###
    static getPanel(username) {
        return `<div role="tabpanel" class="tab-pane channel-pane" id="channel-${username}" data-username="${username}">
    <div class="chat">
        <div class="topic"></div>
        <div class="text"></div>
    </div>
    <div class="divider"></div>
    <div class="users"></div>
</div>`;
    }

    //              #    ###         #
    //              #     #          #
    //  ###   ##   ###    #     ###  ###
    // #  #  # ##   #     #    #  #  #  #
    //  ##   ##     #     #    # ##  #  #
    // #      ##     ##   #     # #  ###
    //  ###
    static getTab(username) {
        return `<li id="tab-${username}" class="channel-tab"><a data-toggle="tab" href="#channel-${username}">#${username}</a></li>`;
    }

    //              #    ###    #                 ##    #
    //              #     #                      #  #
    //  ###   ##   ###    #    ##    # #    ##    #    ##    ###    ##    ##
    // #  #  # ##   #     #     #    ####  # ##    #    #    #  #  #     # ##
    //  ##   ##     #     #     #    #  #  ##    #  #   #    #  #  #     ##
    // #      ##     ##   #    ###   #  #   ##    ##   ###   #  #   ##    ##
    //  ###
    static getTimeSince(time) {
        var diff = new Date().getTime() - new Date(time).getTime();

        return `${Math.floor(diff / 3600000)}:${("0" + Math.floor(diff % 3600000 / 60000)).slice(-2)}`;
    }

    // #      #          ##    ####                       #
    // #      #           #    #                          #
    // ###   ###   # #    #    ###   ###    ##    ##    ###   ##
    // #  #   #    ####   #    #     #  #  #     #  #  #  #  # ##
    // #  #   #    #  #   #    #     #  #  #     #  #  #  #  ##
    // #  #    ##  #  #  ###   ####  #  #   ##    ##    ###   ##
    static htmlEncode(str) {
        return str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
    }

    //               #     ##    #
    //               #    #  #
    //  ###    ##   ###    #    ##    ####   ##
    // ##     # ##   #      #    #      #   # ##
    //   ##   ##     #    #  #   #     #    ##
    // ###     ##     ##   ##   ###   ####   ##
    static setSize($el) {
        setTimeout(() => {
            $el.css({height: "1px"});
            $el.css({height: `${$el.prop("scrollHeight") + 2}px`});
        }, 0);
    }

    //               #     #     #                        ##   #                                #
    //               #     #                             #  #  #                                #
    //  ###    ##   ###   ###   ##    ###    ###   ###   #     ###    ###  ###    ###   ##    ###
    // ##     # ##   #     #     #    #  #  #  #  ##     #     #  #  #  #  #  #  #  #  # ##  #  #
    //   ##   ##     #     #     #    #  #   ##     ##   #  #  #  #  # ##  #  #   ##   ##    #  #
    // ###     ##     ##    ##  ###   #  #  #     ###     ##   #  #   # #  #  #  #      ##    ###
    //                                       ###                                  ###
    static settingsChanged() {
        Utilities.changeCss("#display", `font-family: "${win.data.appSettings.data.chat.font.face}"; font-size: ${win.data.appSettings.data.chat.font.size}px;`, $); // TODO: Potentially have a max size for title, input box
        Utilities.changeCss("#display div.chat", `color: ${win.data.appSettings.data.chat.colors.chat.foreground}; background-color: ${win.data.appSettings.data.chat.colors.chat.background};`, $);
        Utilities.changeCss("#display div.chat .info", `color: ${win.data.appSettings.data.chat.colors.chat.info};`, $);
        Utilities.changeCss("#display div.chat .join", `color: ${win.data.appSettings.data.chat.colors.chat.join};`, $);
        Utilities.changeCss("#display div.chat .part", `color: ${win.data.appSettings.data.chat.colors.chat.part};`, $);
        Utilities.changeCss("#display div.chat .highlight", `color: ${win.data.appSettings.data.chat.colors.chat.highlight};`, $);
        Utilities.changeCss("#inputbox", `color: ${win.data.appSettings.data.chat.colors.input.foreground}; background-color: ${win.data.appSettings.data.chat.colors.input.background}; font-family: "${win.data.appSettings.data.chat.font.face}"; font-size: ${win.data.appSettings.data.chat.font.size}px;`, $);
        Utilities.changeCss("#display div.users", `color: ${win.data.appSettings.data.chat.colors.userList.foreground}; background-color: ${win.data.appSettings.data.chat.colors.userList.background};`, $);
        this.setSize($("#inputbox"));
    }

    //  #     #                        #
    //  #                              #
    // ###   ##    # #    ##    ###   ###    ###  # #   ###
    //  #     #    ####  # ##  ##      #    #  #  ####  #  #
    //  #     #    #  #  ##      ##    #    # ##  #  #  #  #
    //   ##  ###   #  #   ##   ###      ##   # #  #  #  ###
    //                                                  #
    static timestamp() {
        var date = new Date();
        return `${win.data.appSettings.data.chat.timestamps ? `[${`0${date.getHours()}`.substr(-2)}:${`0${date.getMinutes()}`.substr(-2)}:${`0${date.getSeconds()}`.substr(-2)}` : ""}] `;
    }

    //                #         #           ##    #
    //                #         #          #  #   #
    // #  #  ###    ###   ###  ###    ##    #    ###   ###    ##    ###  # #
    // #  #  #  #  #  #  #  #   #    # ##    #    #    #  #  # ##  #  #  ####
    // #  #  #  #  #  #  # ##   #    ##    #  #   #    #     ##    # ##  #  #
    //  ###  ###    ###   # #    ##   ##    ##     ##  #      ##    # #  #  #
    //       #
    /**
     * Updates the stream's data.
     * @param {stream} channel The channel to update.
     * @return {void}
     */
    static updateStream(channel) {
        var channelName = channel.substring(1);

        if (!channels[channel]) {
            return;
        }
        
        client.getStream(channelName).then((stream) => {
            if (stream) {
                channels[channel].stream = stream;
                channels[channel].channel = stream.channel;
                Index.updateTitle(channel);
            } else {
                delete channels[channel].stream;
                client.getChannel(channelName).then((channelData) => {
                    channels[channel].channel = channelData;
                    Index.updateTitle(channel);
                });
            }
        });

        client.getChatters(channelName).then((chatters) => {
            channels[channel].chatters = chatters;
            Index.updateTitle(channel);
        });
    }

    //                #         #          ###    #     #    ##
    //                #         #           #           #     #
    // #  #  ###    ###   ###  ###    ##    #    ##    ###    #     ##
    // #  #  #  #  #  #  #  #   #    # ##   #     #     #     #    # ##
    // #  #  #  #  #  #  # ##   #    ##     #     #     #     #    ##
    //  ###  ###    ###   # #    ##   ##    #    ###     ##  ###    ##
    //       #
    static updateTitle(channel) {
        var channelName = channel.substring(1);

        $(`#channel-${channelName} .topic`).html(
`<div style="position: relative;">
    ${channels[channel].channel && channels[channel].channel.profile_banner ? `<div class="topic-background" style="background-image: url('${channels[channel].channel.profile_banner}');"></div>` : ""}
    <div class="topic-foreground">
        ${channels[channel].channel && channels[channel].channel.logo ? `<img src="${channels[channel].channel.logo}" class="topic-logo">` : ""}
        <div class="topic-edit">
            <button class="btn btn-sm btn-default editchannel"><span class="glyphicon glyphicon-edit"></span></button>
        </div>
        ${channels[channel].channel ? `<div class="topic-text">
            ${channel}${channels[channel].channel.status ? ` - ` : ""}${this.htmlEncode(channels[channel].channel.status)} ${channels[channel].channel.game ? `(${this.htmlEncode(channels[channel].channel.game)})` : ""}<br />
            ${channels[channel].stream ? `Online: ${this.getTimeSince(channels[channel].stream.created_at)} - Viewers: ${channels[channel].stream.viewers} - ` : ""}${channels[channel].chatters ? `Chatters: ${channels[channel].chatters.chatter_count} - ` : ""}Followers: ${channels[channel].channel.followers} - Views: ${channels[channel].channel.views}
        </div>` : ""}
    </div>
</div>`);
    }

    //                          #      #          #
    //                          #                 #
    // #  #   ###    ##   ###   #     ##    ###   # #
    // #  #  ##     # ##  #  #  #      #    #  #  ##
    // #  #    ##   ##    #     #      #    #  #  # #
    //  ###  ###     ##   #     ####  ###   #  #  #  #
    static userLink(channel, username, displayname) {
        return `<a class="userlink" data-username="${username}" data-displayname="${displayname}" data-channel="${channel}">${displayname || username}</a>`;
    }

    //  #            ##    #    ###          #     #
    //              #  #   #    #  #         #     #
    // ##     ###   #  #  ###   ###    ##   ###   ###    ##   # #
    //  #    ##     ####   #    #  #  #  #   #     #    #  #  ####
    //  #      ##   #  #   #    #  #  #  #   #     #    #  #  #  #
    // ###   ###    #  #    ##  ###    ##     ##    ##   ##   #  #
    static isAtBottom($channel) {
        return $channel.prop("scrollHeight") - $channel.scrollTop() <= $channel.height() + 28;
    }

    //                                  #  ###          ##   #                             ##
    //                                  #   #          #  #  #                              #
    //  ###  ###   ###    ##   ###    ###   #     ##   #     ###    ###  ###   ###    ##    #
    // #  #  #  #  #  #  # ##  #  #  #  #   #    #  #  #     #  #  #  #  #  #  #  #  # ##   #
    // # ##  #  #  #  #  ##    #  #  #  #   #    #  #  #  #  #  #  # ##  #  #  #  #  ##     #
    //  # #  ###   ###    ##   #  #   ###   #     ##    ##   #  #   # #  #  #  #  #   ##   ###
    //       #     #
    static appendToChannel($channel, html) {
        const atBottom = this.isAtBottom($channel);

        $channel.append(html);

        while ($channel.children().length > 1000) {
            $channel.children().first().remove(); // TODO: Investigate possible memory leak?
        }

        if (atBottom) {
            $channel.scrollTop($channel.prop("scrollHeight"));
        }

        const thisChannelName = $channel.parent().parent().data("username"),
            activeChannelName = $("#channels li.active").text().substring(1);

        if (thisChannelName !== activeChannelName) {
            $(`#tab-${thisChannelName}`).find("a").addClass("text-danger");
        }
   }
}

if (!win.data) {
    win.data = {};
}
win.data.userSettings = new File(path.join(app.getPath("userData"), "userSettings.js")),
win.data.appSettings = new File(path.join(app.getPath("userData"), "appSettings.js")),

// TODO: Figure out how to do timeouts, bans, purges
//       ##     #                 #                        #    # #                                               # #   #
//        #                       #                       #     # #                                               # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  # #    ##    ###    ###    ###   ###   ##    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          ####  # ##  ##     ##     #  #  #  #  # ##          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  ##      ##     ##   # ##   ##   ##            #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         #  #   ##   ###    ###     # #  #      ##          #
//                                                                                                    ###
client.on("message", (channel, username, usercolor, displayname, html, text) => {
    var color = tinycolor(usercolor),
        background = tinycolor(win.data.appSettings.data.chat.colors.chat.background),
        brightness = background.getBrightness(),
        difference = brightness - color.getBrightness(),
        channelName = channel.substring(1);

    if (difference > 0 && difference < 50) {
        usercolor = color.darken(50);
    } else if (difference < 0 && difference > -50) {
        usercolor = color.brighten(50);
    } else if (difference === 0) {
        if (brightness < 128) {
            usercolor = color.brighten(50);
        } else {
            usercolor = color.darken(50);
        }
    }

    if ($("<div></div>").append(html).text().indexOf(win.data.userSettings.data.twitch.username) === -1) {
        Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="user-${username}">${Index.timestamp()}<b style="color: ${usercolor}">${Index.userLink(channel, username, displayname)}</b>: ${html}</span>`);
    } else {
        Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="user-${username}">${Index.timestamp()}<b style="color: ${usercolor}">${Index.userLink(channel, username, displayname)}</b>: <span class="highlight">${html}</span></span>`);
    }
});

//       ##     #                 #                        #    # #    #          #           # #   #
//        #                       #                       #     # #                           # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #    #    ##   ##    ###    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #            #   #  #   #    #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #            #   #  #   #    #  #          #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         # #    ##   ###   #  #         #
//                                                                    #
client.on("join", (channel, username, self) => {
    var channelName = channel.substring(1);
    if (self) {
        channels[channel] = {
            users: [],
            interval: setInterval(() => Index.updateStream(channel), 60000),
            isAtBottom: true
        };
        $("#channels").append(Index.getTab(channelName));
        $("#display").append(Index.getPanel(channelName));
        if (Object.keys(channels).length === 1) {
            $(`#tab-${channelName} > a`).tab("show");
        }
        Index.updateStream(channel);
    }
    channels[channel].users.push(username);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="join">${Index.timestamp()}${(self ? "You have" : `${Index.userLink(channel, username)} has`)} joined ${channel}</span>`);
    $(`#channel-${channelName} .users`).html(channels[channel].users.join("<br />"));
});

//       ##     #                 #                        #    # #                     #     # #   #
//        #                       #                       #     # #                     #     # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  ###    ###  ###   ###    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #  #  #  #  #  #   #            #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  # ##  #      #            #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         ###    # #  #       ##         #
//                                                                   #
client.on("part", (channel, username, self) => {
    var channelName = channel.substring(1);
    if (self) {
        let index = $(`#tab-${channelName}`).index();
        $(`#tab-${channelName}`).remove();
        $(`#channel-${channelName}`).remove();
        clearInterval(channels[channel].interval);
        delete channels[channel];
        if ($(".channel-tab.active").length === 0) {
            $(`.channel-tab:nth-child(${index === Object.keys(channels).length ? index : index + 1}) > a`).tab("show");
        }
    } else {
        channels[channel].users.splice(channels[channel].users.indexOf(username), 1);
        Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="part">${Index.timestamp()}${`${Index.userLink(channel, username)}`} has left ${channel}</span>`);
        $(`#channel-${channelName} .users`).html(channels[channel].users.join("<br />"));
    }
});

//       ##     #                 #                        #    # #                 #   # #   #
//        #                       #                       #     # #                 #   # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  # #    ##    ###   # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          ####  #  #  #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  #  #  #  #          #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         #  #   ##    ###         #
client.on("mod", (channel, username) => {
    var channelName = channel.substring(1);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}${Index.userLink(channel, username)} is now a moderator of ${channel}</span>`);
});

//       ##     #                 #                        #    # #                             #   # #   #
//        #                       #                       #     # #                             #   # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  #  #  ###   # #    ##    ###   # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #  #  #  #  ####  #  #  #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  #  #  #  #  #  #  #  #          #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #          ###  #  #  #  #   ##    ###         #
client.on("unmod", (channel, username) => {
    var channelName = channel.substring(1);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}${Index.userLink(channel, username)} is no longer a moderator of ${channel}</span>`);
});

//       ##     #                 #                        #    # #                       #               #     #          ##            # #   #
//        #                       #                       #     # #                       #               #                 #            # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #   ##   ###    ##    ###   ##   ###   ###   ##     ###   #     ###    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #     #  #  # ##  #  #  # ##  #  #   #     #    #  #   #    ##             #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #     #     ##    #  #  ##    #  #   #     #    # ##   #      ##           #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #          ##   #      ##    ###   ##   #  #    ##  ###    # #  ###   ###           #
client.on("credentials", (username, accessToken) => {
    if (!win.data.userSettings.data.twitch) {
        win.data.userSettings.data.twitch = {};
    }

    win.data.userSettings.queue(() => {
        win.data.userSettings.data.twitch.username = username;
        win.data.userSettings.data.twitch.accessToken = accessToken;
    }).then(() => {
        win.data.userSettings.save();
    });
});

//                           ##          #     #     #                             ##                   #
//                          #  #         #     #                                    #                   #
// #  #   ###    ##   ###    #     ##   ###   ###   ##    ###    ###   ###          #     ##    ###   ###
// #  #  ##     # ##  #  #    #   # ##   #     #     #    #  #  #  #  ##            #    #  #  #  #  #  #
// #  #    ##   ##    #     #  #  ##     #     #     #    #  #   ##     ##    ##    #    #  #  # ##  #  #
//  ###  ###     ##   #      ##    ##     ##    ##  ###   #  #  #     ###     ##   ###    ##    # #   ###
//                                                               ###
win.data.userSettings.load().then(() => {
    new Promise((resolve) => {
        if (win.data.userSettings.data && win.data.userSettings.data.twitch) {
            client.authorize(win.data.userSettings.data.twitch.username, win.data.userSettings.data.twitch.accessToken).then(resolve);
        } else {
            client.authorize().then(resolve);
        }
    }).then(() => {
        client.connect().then(() => {
            client.join(`#${win.data.userSettings.data.twitch.username}`);
        });
    });
});

//                    ##          #     #     #                             ##                   #
//                   #  #         #     #                                    #                   #
//  ###  ###   ###    #     ##   ###   ###   ##    ###    ###   ###          #     ##    ###   ###
// #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##            #    #  #  #  #  #  #
// # ##  #  #  #  #  #  #  ##     #     #     #    #  #   ##     ##    ##    #    #  #  # ##  #  #
//  # #  ###   ###    ##    ##     ##    ##  ###   #  #  #     ###     ##   ###    ##    # #   ###
//       #     #                                          ###
win.data.appSettings.load().then(() => {
    if (!win.data.appSettings.data.chat) {
        win.data.appSettings.data.chat = {
            font: {
                face: "",
                size: 14
            },
            colors: {
                chat: {
                    foreground: "#000000",
                    background: "#ffffff",
                    info: "#0080ff",
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

    Index.settingsChanged();
});

//                    ##          #     #     #                                                                           #
//                   #  #         #     #                                                                                 #
//  ###  ###   ###    #     ##   ###   ###   ##    ###    ###   ###          ##   ###          ###    ###  # #    ##    ###
// #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##           #  #  #  #        ##     #  #  # #   # ##  #  #
// # ##  #  #  #  #  #  #  ##     #     #     #    #  #   ##     ##         #  #  #  #          ##   # ##  # #   ##    #  #
//  # #  ###   ###    ##    ##     ##    ##  ###   #  #  #     ###           ##   #  #        ###     # #   #     ##    ###
//       #     #                                          ###
win.data.appSettings.on("saved", () => {
    if (profileWin) {
        profileWin.emit("chat-settings", win.data.appSettings.data.chat);
    }
    Index.settingsChanged();
});

//        #                                                     ##          #     #     #                                          #
//                                                             #  #         #     #                                                #
// #  #  ##    ###          ##   ###          ###  ###   ###    #     ##   ###   ###   ##    ###    ###   ###          ###   ##   ###
// #  #   #    #  #        #  #  #  #        #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     ####  #  #  # ##   #
// ####   #    #  #        #  #  #  #        # ##  #  #  #  #  #  #  ##     #     #     #    #  #   ##     ##          ##   ##     #
// ####  ###   #  #         ##   #  #         # #  ###   ###    ##    ##     ##    ##  ###   #  #  #     ###          #      ##     ##
//                                                 #     #                                          ###                ###
win.on("appSettings-get", (remoteWin) => {
    remoteWin.emit("appSettings-get-response", win.data.appSettings.data);
});

//        #                                                     ##          #     #     #                                           #
//                                                             #  #         #     #                                                 #
// #  #  ##    ###          ##   ###          ###  ###   ###    #     ##   ###   ###   ##    ###    ###   ###          ###    ##   ###
// #  #   #    #  #        #  #  #  #        #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     ####  ##     # ##   #
// ####   #    #  #        #  #  #  #        # ##  #  #  #  #  #  #  ##     #     #     #    #  #   ##     ##           ##   ##     #
// ####  ###   #  #         ##   #  #         # #  ###   ###    ##    ##     ##    ##  ###   #  #  #     ###          ###     ##     ##
//                                                 #     #                                          ###
win.on("appSettings-set", (newAppSettings) => {
    win.data.appSettings.data.chat = newAppSettings.chat;
    win.data.appSettings.save();
});

//    #       #       #                                             #      #                                     #
//   ###     #        #                                             #       #                                    #
//  # #     #      ## #   ###    ###   #   #  ## #    ###   # ##   ####      #          # ##    ###    ###    ## #  #   #
//   ###    #     #  ##  #   #  #   #  #   #  # # #  #   #  ##  #   #        #          ##  #  #   #      #  #  ##  #   #
//    # #   #     #   #  #   #  #      #   #  # # #  #####  #   #   #        #          #      #####   ####  #   #  #  ##
//   ###     #    #  ##  #   #  #   #  #  ##  # # #  #      #   #   #  #    #      #    #      #      #   #  #  ##   ## #
//    #       #    ## #   ###    ###    ## #  #   #   ###   #   #    ##    #      ###   #       ###    ####   ## #      #
//                                                                                 #                                #   #
//                                                                                                                   ###
$(document).ready(() => {
    var $inputbox = $("#inputbox"),
        patterns = {
            join: /^\/join #?([a-z0-9_]+)$/i,
            part: /^\/part$/i
        };

    Index.tabContextMenu = new Menu();
    Index.tabContextMenu.append(new MenuItem({
        label: "Close",
        click: () => {
            client.part($("#channels li.context").text());
        }
    }));

    //        #                       #    #                                         #
    //  # #                           #    #                                         #
    // ##### ##    ###   ###   #  #  ###   ###    ##   #  #         ##   ###         # #    ##   #  #  ###   ###    ##    ###    ###
    //  # #   #    #  #  #  #  #  #   #    #  #  #  #   ##         #  #  #  #        ##    # ##  #  #  #  #  #  #  # ##  ##     ##
    // #####  #    #  #  #  #  #  #   #    #  #  #  #   ##         #  #  #  #        # #   ##     # #  #  #  #     ##      ##     ##
    //  # #  ###   #  #  ###    ###    ##  ###    ##   #  #         ##   #  #        #  #   ##     #   ###   #      ##   ###    ###
    //                   #                                                                        #    #
    // Setup input box resizing
    $inputbox.on("keypress", (ev) => {
        if (ev.keyCode === 13 && client.connected) {
            let input = $inputbox.val(),
                matches;

            if (matches = patterns.join.exec(input)) {
                let channel = matches[1].toLowerCase();
                client.join(`#${channel}`);
            } else if (matches = patterns.part.exec(input)) {
                client.part($("#channels li.active").text());
            } else {
                client.send($("#channels li.active").text(), $inputbox.val());
            }

            $inputbox.val("");

            ev.preventDefault();
            return false;
        }
    });

    $inputbox.on("change", () => Index.setSize($inputbox));
    $inputbox.on("cut", () => Index.setSize($inputbox));
    $inputbox.on("paste", () => Index.setSize($inputbox));
    $inputbox.on("drop", () => Index.setSize($inputbox));
    $inputbox.on("keydown", () => Index.setSize($inputbox));
    $inputbox.on("keyup", () => Index.setSize($inputbox));

    $("#inputbox").emojioneArea({
        shortcuts: false
    });

    //             #                             ##                                                           ##     #          #
    //  # #        #                              #                                                            #                #
    // #####  ##   ###    ###  ###   ###    ##    #     ###                ###         ##   ###          ##    #    ##     ##   # #
    //  # #  #     #  #  #  #  #  #  #  #  # ##   #    ##                 #  #        #  #  #  #        #      #     #    #     ##
    // ##### #     #  #  # ##  #  #  #  #  ##     #      ##          ##   # ##        #  #  #  #        #      #     #    #     # #
    //  # #   ##   #  #   # #  #  #  #  #   ##   ###   ###           ##    # #         ##   #  #         ##   ###   ###    ##   #  #
    // Setup channel tabs.
    $("#channels").on("click", "a", (ev) => {
        ev.preventDefault();

        let currentChannelName = $("#channels li.active").text().substring(1),
            $channel = $(`#channel-${currentChannelName} .text`);

        channels[`#${currentChannelName}`].isAtBottom = Index.isAtBottom($channel);

        $(ev.target).tab("show").on("shown.bs.tab", () => {
            currentChannelName = $("#channels li.active").text().substring(1);
            $channel = $(`#channel-${currentChannelName} .text`);

            if (channels[`#${currentChannelName}`].isAtBottom) {
                $channel.scrollTop($channel.prop("scrollHeight"));
            }
        });

        $(ev.target).removeClass("text-danger");
    });

    //    #   #                   #   #           #       #                                                                        #
    //    #                       #                       #                                                                        #
    //  ###  ##    # #          ###  ##    # #   ##     ###   ##   ###          ##   ###         # #    ##   #  #   ###    ##    ###   ##   #  #  ###
    // #  #   #    # #         #  #   #    # #    #    #  #  # ##  #  #        #  #  #  #        ####  #  #  #  #  ##     # ##  #  #  #  #  #  #  #  #
    // #  #   #    # #    ##   #  #   #    # #    #    #  #  ##    #           #  #  #  #        #  #  #  #  #  #    ##   ##    #  #  #  #  ####  #  #
    //  ###  ###    #     ##    ###  ###    #    ###    ###   ##   #            ##   #  #        #  #   ##    ###  ###     ##    ###   ##   ####  #  #
    // Setup user list divider.
    $("#display").on("mousedown", "div.divider", (ev) => {
        var pageX = ev.pageX,
            $users = $(ev.target).next("div.users"),
            width = $users.width();
        $("#display").on("mousemove", (ev) => {
            width += pageX - ev.pageX;
            $users.css({"flex-basis": `${width}px`});
            pageX = ev.pageX;
        });
        $("#display").on("mouseup", () => {
            $("#display").off("mousemove");
        });

        ev.preventDefault();
    });

    // ##     #                #                             ##           #          #                                                               #
    //  #                      #                              #           #          #                                                               #
    //  #    ##           ##   ###    ###  ###   ###    ##    #          ###    ###  ###          ##   ###         # #    ##   #  #   ###    ##    ###   ##   #  #  ###
    //  #     #          #     #  #  #  #  #  #  #  #  # ##   #    ####   #    #  #  #  #        #  #  #  #        ####  #  #  #  #  ##     # ##  #  #  #  #  #  #  #  #
    //  #     #     ##   #     #  #  # ##  #  #  #  #  ##     #           #    # ##  #  #        #  #  #  #        #  #  #  #  #  #    ##   ##    #  #  #  #  ####  #  #
    // ###   ###    ##    ##   #  #   # #  #  #  #  #   ##   ###           ##   # #  ###          ##   #  #        #  #   ##    ###  ###     ##    ###   ##   ####  #  #
    $("#channels").on("mousedown", "li.channel-tab", (ev) => {
        if (ev.which === 3) {
            $("#channels li.channel-tab").removeClass("context");
            $(ev.target).closest("li").addClass("context");
            Index.tabContextMenu.popup();
        }
    });

    //                                      ##     #          #                                   ##     #          #
    //                                       #                #                                    #                #
    //  ###        #  #   ###    ##   ###    #    ##    ###   # #          ##   ###          ##    #    ##     ##   # #
    // #  #        #  #  ##     # ##  #  #   #     #    #  #  ##          #  #  #  #        #      #     #    #     ##
    // # ##   ##   #  #    ##   ##    #      #     #    #  #  # #         #  #  #  #        #      #     #    #     # #
    //  # #   ##    ###  ###     ##   #     ###   ###   #  #  #  #         ##   #  #         ##   ###   ###    ##   #  #
    $("#display").on("click", "a.userlink", (ev) => {
        const data = $(ev.target).data(),
            $text = $("<div></div>");

        $(`#display .text .user-${data.username}`).each((index, value) => $text.append($(value).clone()));

        if (profileWin) {
            profileWin.emit("profile-set", data.channel, data.username, $text.html());
        } else {
            profileWin = new electron.remote.BrowserWindow({width: 640, height: 480, resizable: false, title: `Hyperdrive Toolkit - Profile - ${data.username} on ${data.channel}`});

            profileWin.on("profile-get", () => {
                profileWin.emit("profile-set", data.channel, data.username, $text.html());
                profileWin.emit("chat-settings", win.data.appSettings.data.chat);
            });

            profileWin.loadURL(`file://${__dirname}/profile.htm`);
            profileWin.setMenu(null);
            profileWin.toggleDevTools(); // TODO: Remove for release.

            profileWin.once("ready-to-show", () => {
                profileWin.show();
            });

            profileWin.on("command", (command, ...args) => {
                switch (command) {
                    case "ban":
                        client.ban(...args).catch(console.log);
                        break;
                    case "unban":
                        client.unban(...args).catch(console.log);
                        break;
                    case "timeout":
                        client.timeout(...args).catch(console.log);
                        break;
                    case "mod":
                        client.mod(...args).catch(console.log);
                        break;
                    case "unmod":
                        client.unmod(...args).catch(console.log);
                        break;
                    case "join":
                        client.join(...args).catch(console.log);
                        break;
                    case "follow":
                        client.follow(...args);
                        break;
                    case "unfollow":
                        client.unfollow(...args);
                        break;
                }
            });

            profileWin.on("closed", () => {
                profileWin = null;
            });
        }
    });

    // #            #     #                               #   #     #          #                             ##                                  ##     #          #
    // #            #     #                               #         #          #                              #                                   #                #
    // ###   #  #  ###   ###    ##   ###          ##    ###  ##    ###    ##   ###    ###  ###   ###    ##    #           ##   ###          ##    #    ##     ##   # #
    // #  #  #  #   #     #    #  #  #  #        # ##  #  #   #     #    #     #  #  #  #  #  #  #  #  # ##   #          #  #  #  #        #      #     #    #     ##
    // #  #  #  #   #     #    #  #  #  #   ##   ##    #  #   #     #    #     #  #  # ##  #  #  #  #  ##     #          #  #  #  #        #      #     #    #     # #
    // ###    ###    ##    ##   ##   #  #   ##    ##    ###  ###     ##   ##   #  #   # #  #  #  #  #   ##   ###          ##   #  #         ##   ###   ###    ##   #  #
    $("#display").on("click", "button.editchannel", (ev) => {
        const username = $(ev.target).closest(".channel-pane").data("username"),
            channelName = `#${username}`,
            channel = channels[channelName];

        if (editChannelWin) {
            editChannelWin.emit("editchannel-set", username, channel && channel.channel ? channel.channel.status : "", channel && channel.channel ? channel.channel.game : "");
        } else {
            editChannelWin = new electron.remote.BrowserWindow({width: 640, height: 480, resizable: false, title: `Hyperdrive Toolkit - Edit Channel - #${username}`});

            editChannelWin.on("editchannel-get", () => {
                editChannelWin.emit("editchannel-set", username, channel && channel.channel ? channel.channel.status : "", channel && channel.channel ? channel.channel.game : "");
            });

            editChannelWin.loadURL(`file://${__dirname}/editchannel.htm`);
            editChannelWin.setMenu(null);
            editChannelWin.toggleDevTools(); // TODO: Remove for release.

            editChannelWin.once("ready-to-show", () => {
                editChannelWin.show();
            });

            editChannelWin.on("updatechannel", (channel, title, game) => {
                client.setStatus(channel, {status: title, game}).then((channelData) => {
                    channels[channelName].channel = channelData;
                    Index.updateTitle(channelName);
                }).catch(console.log);
            });

            editChannelWin.on("closed", () => {
                editChannelWin = null;
            });
        }
    });
});
