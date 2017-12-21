const path = require("path"),
    electron = require("electron"),
    {remote, remote: {Menu, MenuItem, app}} = electron,
    win = remote.getCurrentWindow(),
    tinycolor = require("tinycolor2"),
    Twitch = require("./modules/chat/twitch"), // TODO: Load modules
    File = require("./modules/datastore/file"),
    settings = require("./js/apiSettings"),
    client = new Twitch(settings),
    Utilities = require("./js/utilities"),
    channels = {};

let profileWin, editChannelWin;

//   ###              #
//    #               #
//    #    # ##    ## #   ###   #   #
//    #    ##  #  #  ##  #   #   # #
//    #    #   #  #   #  #####    #
//    #    #   #  #  ##  #       # #
//   ###   #   #   ## #   ###   #   #
/**
 * A class for the entry point into the application.
 */
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
        const diff = new Date().getTime() - new Date(time).getTime();

        return `${Math.floor(diff / 3600000)}:${(`0${Math.floor(diff % 3600000 / 60000)}`).slice(-2)}`;
    }

    //              #    ###                      #     #
    //              #    #  #                     #
    //  ###   ##   ###   #  #  #  #  ###    ###  ###   ##     ##   ###
    // #  #  # ##   #    #  #  #  #  #  #  #  #   #     #    #  #  #  #
    //  ##   ##     #    #  #  #  #  #     # ##   #     #    #  #  #  #
    // #      ##     ##  ###    ###  #      # #    ##  ###    ##   #  #
    //  ###
    static getDuration(time) {
        let str = "";

        if (time <= 0) {
            return "0 seconds";
        }

        const seconds = time % 60,
            minutes = Math.floor(time / 60) % 60,
            hours = Math.floor(time / 3600);

        if (seconds > 0) {
            str = `${seconds} second${seconds === 1 ? "" : "s"}`;
        }

        if (minutes > 0) {
            str = `${minutes}minute${minutes === 1 ? "" : "s"} ${str}`;
        }

        if (hours > 0) {
            str = `${hours}hour${hours === 1 ? "" : "s"} ${str}`;
        }

        return str;
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
        Utilities.changeCss("#display div.chat a.external-link", `color: ${win.data.appSettings.data.chat.colors.chat.foreground}; text-decoration: underline;`, $);
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
        const date = new Date();
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
        const channelName = channel.substring(1);

        if (!channels[channel]) {
            return;
        }

        new Promise((resolve, reject) => {
            client.getStream(channelName).then((stream) => {
                if (stream) {
                    channels[channel].stream = stream;
                } else {
                    reject(new Error("Stream is offline."));
                }

                resolve();
            }).catch(reject);
        }).catch(() => {
            delete channels[channel].stream;
        }).then(() => new Promise((resolve, reject) => {
            client.getChannel(channelName).then((channelData) => {
                channels[channel].channel = channelData;
                Index.updateTitle(channel);
            }).catch(reject);
        })).then(() => {
            if (!channels[channel].badges) {
                client.getChannelBadges(channels[channel].channel._id).then((badges) => {
                    channels[channel].badges = badges;
                });
            }
        });

        Index.listUsers(channel);
    }

    // ##     #            #    #  #
    //  #                  #    #  #
    //  #    ##     ###   ###   #  #   ###    ##   ###    ###
    //  #     #    ##      #    #  #  ##     # ##  #  #  ##
    //  #     #      ##    #    #  #    ##   ##    #       ##
    // ###   ###   ###      ##   ##   ###     ##   #     ###
    static listUsers(channel) {
        const channelName = channel.substring(1);

        client.getChatters(channelName).then((chatters) => {
            channels[channel].chatters = chatters;
            Index.updateTitle(channel);

            Index.displayUsers(channel);
        });
    }

    //    #   #                 ##                #  #
    //    #                      #                #  #
    //  ###  ##     ###   ###    #     ###  #  #  #  #   ###    ##   ###    ###
    // #  #   #    ##     #  #   #    #  #  #  #  #  #  ##     # ##  #  #  ##
    // #  #   #      ##   #  #   #    # ##   # #  #  #    ##   ##    #       ##
    //  ###  ###   ###    ###   ###    # #    #    ##   ###     ##   #     ###
    //                    #                  #
    static displayUsers(channel) {
        const channelName = channel.substring(1);

        if (channels[channel].chatters && channels[channel].chatters.chatter_count >= 1000) {
            $(`#channel-${channelName} .divider`).hide();
            $(`#channel-${channelName} .users`).hide();
            return;
        } else {
            $(`#channel-${channelName} .divider`).show();
            $(`#channel-${channelName} .users`).show();
        }

        const users = [];

        if (!channels[channel].chatters) {
            return;
        }

        Object.keys(channels[channel].chatters.chatters).forEach((key) => {
            channels[channel].chatters.chatters[key].forEach((user) => {
                if (channels[channel].userBadges[user]) {
                    users.push(user);
                }
            });
        });

        users.sort((a, b) => {
            // Channel owner.
            if (channel === `#${a}` && !(channel === `#${b}`)) {
                return -1;
            }

            if (!(channel === `#${a}`) && channel === `#${b}`) {
                return 1;
            }

            // Moderators.
            if (channels[channel].userBadges[a].includes("moderator") && !channels[channel].userBadges[b].includes("moderator")) {
                return -1;
            }

            if (!channels[channel].userBadges[a].includes("moderator") && channels[channel].userBadges[b].includes("moderator")) {
                return 1;
            }

            // Admin.
            if (channels[channel].userBadges[a].includes("admin") && !channels[channel].userBadges[b].includes("admin")) {
                return -1;
            }

            if (!channels[channel].userBadges[a].includes("admin") && channels[channel].userBadges[b].includes("admin")) {
                return 1;
            }

            // Global moderators.
            if (channels[channel].userBadges[a].includes("global_mod") && !channels[channel].userBadges[b].includes("global_mod")) {
                return -1;
            }

            if (!channels[channel].userBadges[a].includes("global_mod") && channels[channel].userBadges[b].includes("global_mod")) {
                return 1;
            }

            // Subscribers.
            if (channels[channel].userBadges[a].includes("subscriber") && !channels[channel].userBadges[b].includes("subscriber")) {
                return -1;
            }

            if (!channels[channel].userBadges[a].includes("subscriber") && channels[channel].userBadges[b].includes("subscriber")) {
                return 1;
            }

            // Sort everyone else alphabetically.
            return a.localeCompare(b);
        });

        $(`#channel-${channelName} .users`).html(
            users.map((username) => {
                return `<div class="user">${channels[channel].userBadgesHtml[username] || ""}${username}</div>`;
            }).join("")
        );
    }

    //                #         #          ###    #     #    ##
    //                #         #           #           #     #
    // #  #  ###    ###   ###  ###    ##    #    ##    ###    #     ##
    // #  #  #  #  #  #  #  #   #    # ##   #     #     #     #    # ##
    // #  #  #  #  #  #  # ##   #    ##     #     #     #     #    ##
    //  ###  ###    ###   # #    ##   ##    #    ###     ##  ###    ##
    //       #
    static updateTitle(channel) {
        const channelName = channel.substring(1);

        $(`#channel-${channelName} .topic`).html(`<div style="position: relative;">
    ${channels[channel].channel && channels[channel].channel.profile_banner ? `<div class="topic-background" style="background-image: url('${channels[channel].channel.profile_banner}');"></div>` : ""}
    <div class="topic-foreground">
        ${channels[channel].channel && channels[channel].channel.logo ? `<img src="${channels[channel].channel.logo}" class="topic-logo">` : ""}
        <div class="topic-edit">
            <button class="btn btn-sm btn-default editchannel"><span class="glyphicon glyphicon-edit"></span></button>
        </div>
        ${channels[channel].channel ? `<div class="topic-text">
            ${channel}${channels[channel].channel.status ? " - " : ""}${this.htmlEncode(channels[channel].channel.status)} ${channels[channel].channel.game ? `(${this.htmlEncode(channels[channel].channel.game)})` : ""}<br />
            ${channels[channel].stream ? `Online: ${this.getTimeSince(channels[channel].stream.started_at)} - Viewers: ${channels[channel].stream.viewer_count} - ` : ""}${channels[channel].chatters ? `Chatters: ${channels[channel].chatters.chatter_count} - ` : ""}Followers: ${channels[channel].channel.followers} - Views: ${channels[channel].channel.views}
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

win.data.userSettings = new File(path.join(app.getPath("userData"), "userSettings.js"));
win.data.appSettings = new File(path.join(app.getPath("userData"), "appSettings.js"));

//       ##     #                 #                        #    # #                                               # #   #
//        #                       #                       #     # #                                               # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  # #    ##    ###    ###    ###   ###   ##    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          ####  # ##  ##     ##     #  #  #  #  # ##          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  ##      ##     ##   # ##   ##   ##            #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         #  #   ##   ###    ###     # #  #      ##          #
//                                                                                                    ###
client.on("message", (channel, username, usercolor, displayname, badges, html, text) => {
    const color = tinycolor(usercolor),
        background = tinycolor(win.data.appSettings.data.chat.colors.chat.background),
        brightness = background.getBrightness(),
        difference = brightness - color.getBrightness(),
        channelName = channel.substring(1);
    let badgeHtml = "";

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

    if (channels[channel].badges && badges) {
        const oldBadges = channels[channel].userBadges[username] ? channels[channel].userBadges[username].join("") : "";

        Object.keys(badges).forEach((key) => {
            const {[key]: version} = badges,
                badge = channels[channel].badges[key].versions[version];

            badgeHtml += $("<img></img>").attr({
                src: badge.image_url_1x,
                title: badge.title
            }).addClass("twitch-badge")[0].outerHTML;
        });

        channels[channel].userBadges[username] = Object.keys(badges);
        channels[channel].userBadgesHtml[username] = badgeHtml;

        const newBadges = channels[channel].userBadges[username].join("");

        if (oldBadges !== newBadges) {
            Index.displayUsers(channel);
        }
    } else {
        channels[channel].userBadges[username] = [];
    }

    if ($("<div></div>").append(html).text().indexOf(win.data.userSettings.data.twitch.username) === -1) {
        Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="user-${username}">${Index.timestamp()}${badgeHtml}<b style="color: ${usercolor}">${Index.userLink(channel, username, displayname)}</b>: ${html}</span>`);
    } else {
        Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="user-${username}">${Index.timestamp()}${badgeHtml}<b style="color: ${usercolor}">${Index.userLink(channel, username, displayname)}</b>: <span class="highlight">${html}</span></span>`);
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
    const channelName = channel.substring(1);
    if (self) {
        channels[channel] = {
            interval: setInterval(() => Index.updateStream(channel), 60000),
            isAtBottom: true,
            userBadges: {},
            userBadgesHtml: {}
        };
        $("#channels").append(Index.getTab(channelName));
        $("#display").append(Index.getPanel(channelName));
        if (Object.keys(channels).length === 1) {
            $(`#tab-${channelName} > a`).tab("show");
        }
        Index.updateStream(channel);
    }
    channels[channel].userBadges[username] = [];
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="join">${Index.timestamp()}${(self ? "You have" : `${Index.userLink(channel, username)} has`)} joined ${channel}</span>`);
    Index.displayUsers(channel);
});

//       ##     #                 #                        #    # #                     #     # #   #
//        #                       #                       #     # #                     #     # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  ###    ###  ###   ###    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #  #  #  #  #  #   #            #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  # ##  #      #            #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         ###    # #  #       ##         #
//                                                                   #
client.on("part", (channel, username, self) => {
    const channelName = channel.substring(1);

    if (self) {
        const index = $(`#tab-${channelName}`).index();

        $(`#tab-${channelName}`).remove();
        $(`#channel-${channelName}`).remove();
        if (channels[channel]) {
            clearInterval(channels[channel].interval);
            delete channels[channel];
        }
        if ($(".channel-tab.active").length === 0) {
            $(`.channel-tab:nth-child(${index === Object.keys(channels).length ? index : index + 1}) > a`).tab("show");
        }
    } else {
        Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="part">${Index.timestamp()}${`${Index.userLink(channel, username)}`} has left ${channel}</span>`);
        Index.displayUsers(channel);
    }
});

//       ##     #                 #                        #    # #                 #   # #   #
//        #                       #                       #     # #                 #   # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  # #    ##    ###   # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          ####  #  #  #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  #  #  #  #          #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         #  #   ##    ###         #
client.on("mod", (channel, username) => {
    const channelName = channel.substring(1);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}${Index.userLink(channel, username)} is now a moderator of ${channel}</span>`);
});

//       ##     #                 #                        #    # #                             #   # #   #
//        #                       #                       #     # #                             #   # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  #  #  ###   # #    ##    ###   # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #  #  #  #  ####  #  #  #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  #  #  #  #  #  #  #  #          #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #          ###  #  #  #  #   ##    ###         #
client.on("unmod", (channel, username) => {
    const channelName = channel.substring(1);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}${Index.userLink(channel, username)} is no longer a moderator of ${channel}</span>`);
});

//       ##     #                 #                        #    # #  #                  # #   #
//        #                       #                       #     # #  #                  # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  ###    ###  ###    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #  #  #  #  #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  # ##  #  #          #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         ###    # #  #  #         #
client.on("ban", (channel, username, reason) => {
    const channelName = channel.substring(1);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}${Index.userLink(channel, username)} has been banned from chat: ${reason}</span>`);
});

//       ##     #                 #                        #    # #        #                        # #   #
//        #                       #                       #     # #        #                        # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #   ##   ###    ##    ##   ###    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #     #  #  # ##  # ##  #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #     #  #  ##    ##    #             #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #          ##   #  #   ##    ##   #            #
client.on("cheer", (channel, userstate, message) => {

});

//       ##     #                 #                        #    # #        ##                            #            #     # #   #
//        #                       #                       #     # #         #                            #            #     # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #   ##    #     ##    ###  ###    ##   ###    ###  ###    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #      #    # ##  #  #  #  #  #     #  #  #  #   #            #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #      #    ##    # ##  #     #     #  #  # ##   #            #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #          ##   ###    ##    # #  #      ##   #  #   # #    ##         #
client.on("clearchat", (channel) => {
    const channelName = channel.substring(1);
    $(`#channel-${channelName} .text`).empty();
});

//       ##     #                 #                        #    # #                     #                      ##           # #   #
//        #                       #                       #     # #                     #                       #           # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #   ##   # #    ##   ###    ##    ##   ###    #    #  #   # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          # ##  ####  #  #   #    # ##  #  #  #  #   #    #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          ##    #  #  #  #   #    ##    #  #  #  #   #     # #          #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #          ##   #  #   ##     ##   ##    ##   #  #  ###     #          #
//                                                                                                                    #
client.on("emoteonly", (channel, enabled) => {
    const channelName = channel.substring(1);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}Emote only chat mode has been ${enabled ? "enabled" : "disabled"}.</span>`);
});

//       ##     #                 #                        #    # #    #         ##    ##                                               ##           # #   #
//        #                       #                       #     # #   # #         #     #                                                #           # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #   #     ##    #     #     ##   #  #   ##   ###    ###    ##   ###    #    #  #   # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          ###   #  #   #     #    #  #  #  #  # ##  #  #  ##     #  #  #  #   #    #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #           #    #  #   #     #    #  #  ####  ##    #       ##   #  #  #  #   #     # #          #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #          #     ##   ###   ###    ##   ####   ##   #     ###     ##   #  #  ###     #          #
//                                                                                                                                             #
client.on("followersonly", (channel, enabled, length) => {
    const channelName = channel.substring(1);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}Followers only chat mode has been ${enabled ? "enabled" : "disabled"}.</span>`);
});

//       ##     #                 #                        #    # #  #                   #             #   # #   #
//        #                       #                       #     # #  #                   #             #   # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  ###    ##    ###   ###    ##    ###   # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #  #  #  #  ##      #    # ##  #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  #  #    ##    #    ##    #  #          #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         #  #   ##   ###      ##   ##    ###         #
client.on("hosted", (channel, username, viewers, autohost) => {
    const channelName = channel.substring(1);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}${username} has ${autohost ? "autohosted" : "hosted"} this channel${viewers && viewers > 0 ? ` with ${viewers} viewers` : ""}.</span>`);
});

//       ##     #                 #                        #    # #  #                   #     #                 # #   #
//        #                       #                       #     # #  #                   #                       # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  ###    ##    ###   ###   ##    ###    ###   # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #  #  #  #  ##      #     #    #  #  #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  #  #    ##    #     #    #  #   ##           #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         #  #   ##   ###      ##  ###   #  #  #            #
//                                                                                                         ###
client.on("hosting", (channel, target, viewers) => {
    const channelName = channel.substring(1);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}This channel is now hosting ${target}.</span>`);
});

//       ##     #                 #                        #    # #         ##   #     #            #           # #   #
//        #                       #                       #     # #        #  #  #     #            #           # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  ###   #  #  # #   ###    ##   ###    ###   # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #  #   ###  ##    #  #  # ##   #    #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #        #  # #   #  #  ##     #    # ##          #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         #      ##   #  #  ###    ##     ##   # #         #
client.on("r9kbeta", (channel, enabled) => {
    const channelName = channel.substring(1);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}R9K chat mode has been ${enabled ? "enabled" : "disabled"}.</span>`);
});

//       ##     #                 #                        #    # #                           #      # #   #
//        #                       #                       #     # #                           #      # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  ###    ##    ###   #  #  ###    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #  #  # ##  ##     #  #  #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #     ##      ##   #  #  #  #          #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         #      ##   ###     ###  ###          #
client.on("resub", (channel, username, months, message, userstate, methods) => {

});

//       ##     #                 #                        #    # #                                  #           #           # #   #
//        #                       #                       #     # #                                  #           #           # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  ###    ##    ##   # #    ###   ###    ###  ###    ##    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #  #  #  #  #  #  ####  ##      #    #  #   #    # ##          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #     #  #  #  #  #  #    ##    #    # ##   #    ##            #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         #      ##    ##   #  #  ###      ##   # #    ##   ##          #
// client.on("roomstate", (channel, state) => {
// TODO: Pending check to see if existing events are enough.
// });

//       ##     #                 #                        #    # #         ##                               #         # #   #
//        #                       #                       #     # #          #                               #         # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #   ###    #     ##   #  #  # #    ##    ###   ##    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          ##      #    #  #  #  #  ####  #  #  #  #  # ##          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #            ##    #    #  #  ####  #  #  #  #  #  #  ##            #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         ###    ###    ##   ####  #  #   ##    ###   ##          #
client.on("slowmode", (channel, enabled, length) => {
    const channelName = channel.substring(1);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}Slow chat mode has been ${enabled ? "enabled" : "disabled"}.</span>`);
});

//       ##     #                 #                        #    # #               #                         #    #                         # #   #
//        #                       #                       #     # #               #                              #                         # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #   ###   #  #  ###    ###    ##   ###   ##    ###    ##   ###    ###    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          ##     #  #  #  #  ##     #     #  #   #    #  #  # ##  #  #  ##             #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #            ##   #  #  #  #    ##   #     #      #    #  #  ##    #       ##           #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         ###     ###  ###   ###     ##   #     ###   ###    ##   #     ###           #
client.on("subscribers", (channel, enabled) => {
    const channelName = channel.substring(1);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}Subscribers only chat mode has been ${enabled ? "enabled" : "disabled"}.</span>`);
});

//       ##     #                 #                        #    # #               #                         #           #     #                 # #   #
//        #                       #                       #     # #               #                                     #                       # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #   ###   #  #  ###    ###    ##   ###   ##    ###   ###   ##     ##   ###    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          ##     #  #  #  #  ##     #     #  #   #    #  #   #     #    #  #  #  #          #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #            ##   #  #  #  #    ##   #     #      #    #  #   #     #    #  #  #  #          #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         ###     ###  ###   ###     ##   #     ###   ###     ##  ###    ##   #  #         #
//                                                                                                               #
client.on("subscription", (channel, username, method, message, userstate) => {

});

//       ##     #                 #                        #    # #   #     #                             #     # #   #
//        #                       #                       #     # #   #                                   #     # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  ###   ##    # #    ##    ##   #  #  ###    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #           #     #    ####  # ##  #  #  #  #   #            #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #           #     #    #  #  ##    #  #  #  #   #            #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #           ##  ###   #  #   ##    ##    ###    ##         #
client.on("timeout", (channel, username, reason, duration) => {
    const channelName = channel.substring(1);
    $(`#channel-${channelName} .text .user-${username}`).addClass("timeout");
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}${username} has been timed out for ${Index.getDuration(duration)}.</span>`);
});

//       ##     #                 #                        #    # #              #                   #     # #   #
//        #                       #                       #     # #              #                   #     # #    #
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  #  #  ###   ###    ##    ###   ###    # #    #
// #      #     #    # ##  #  #   #          #  #  #  #   #          #  #  #  #  #  #  #  #  ##      #            #
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  #  #  #  #  #  #    ##    #            #
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #          ###  #  #  #  #   ##   ###      ##         #
client.on("unhost", (channel, viewers) => {
    const channelName = channel.substring(1);
    Index.appendToChannel($(`#channel-${channelName} .text`), `<span class="info">${Index.timestamp()}Hosting mode ended.</span>`);
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

        $(ev.target).one("shown.bs.tab", () => {
            currentChannelName = $("#channels li.active").text().substring(1);
            $channel = $(`#channel-${currentChannelName} .text`);

            if (channels[`#${currentChannelName}`].isAtBottom) {
                $channel.scrollTop($channel.prop("scrollHeight"));
            }
        });

        $(ev.target).tab("show");

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

    $("#display").on("click", "a.external-link", (ev) => {
        electron.shell.openExternal($(ev.target).attr("href"));
        return false;
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
                    channels[channelName].channel = channelData.body;
                    Index.updateTitle(channelName);

                    if (editChannelWin) {
                        editChannelWin.emit("editchannel-ok");
                    }
                }).catch(() => {
                    if (editChannelWin) {
                        editChannelWin.emit("editchannel-invalidchannel");
                    }
                });
            });

            editChannelWin.on("closed", () => {
                editChannelWin = null;
            });
        }
    });
});
