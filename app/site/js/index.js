var electron = require("electron"),
    path = require("path"),
    Twitch = require("./modules/chat/twitch"), // TODO: Load modules
    settings = require("./js/apiSettings"),
    client = new Twitch(settings),
    File = require("./modules/datastore/file"),
    userSettings = new File(path.join(electron.remote.app.getPath("userData"), "userSettings.js")),
    channels = {},
    getTab = (username) => {
        return `<li id="tab-${username}" class="channel-tab"><a data-toggle="tab" href="#channel-${username}">#${username}</a></li>`;
    },
    getPanel = (username) => {
        return `<div role="tabpanel" class="tab-pane" id="channel-${username}">
    <div class="chat">
        <div class="topic"></div>
        <div class="text"></div>
    </div>
    <div class="divider"></div>
    <div class="users"></div>
</div>`;
    },
    updateStream = (channel) => {
        var channelName = channel.substring(1);
        client.getStream(channelName).then((stream) => {
            if (stream) {
                channels[channel].stream = stream;
                channels[channel].channel = stream.channel;
                updateTitle(channel);
            } else {
                delete channels[channel].stream;
                client.getChannel(channelName).then((channelData) => {
                    channels[channel].channel = channelData;
                    updateTitle(channel);
                });
            }
        });

        client.getChatters(channelName).then((chatters) => {
            channels[channel].chatters = chatters;
            updateTitle(channel);
        });
    },
    getTimeSince = (time) => {
        var diff = new Date().getTime() - new Date(time).getTime();

        return `${Math.floor(diff / 3600000)}:${("0" + Math.floor(diff % 3600000 / 60000)).slice(-2)}`;
    },
    updateTitle = (channel) => {
        var channelName = channel.substring(1);
        $(`#channel-${channelName} .topic`).html(
`<div style="position: relative;">
    ${channels[channel].channel && channels[channel].channel.profile_banner ? `<div class="topic-background" style="background-image: url('${channels[channel].channel.profile_banner}');"></div>` : ""}
    <div class="topic-foreground">
        ${channels[channel].channel && channels[channel].channel.logo ? `<img src="${channels[channel].channel.logo}" class="topic-logo">` : ""}
        ${channels[channel].channel ? `<div class="topic-text">
            ${channel} - ${channels[channel].channel.status} (${channels[channel].channel.game})<br />
            ${channels[channel].stream ? `Online: ${getTimeSince(channels[channel].stream.created_at)} - Viewers: ${channels[channel].stream.viewers} - ` : ""}${channels[channel].chatters ? `Chatters: ${channels[channel].chatters.chatter_count} - ` : ""}Followers: ${channels[channel].channel.followers} - Views: ${channels[channel].channel.views}
        </div>` : ""}
    </div>
</div>`);
    };

client.on("message", (channel, username, usercolor, displayname, html) => {
    var channelName = channel.substring(1);
    $(`#channel-${channelName} .text`).append(`<b style="color: ${usercolor}">${displayname}</b>: ${html}<br />`);
});

client.on("join", (channel, username, self) => {
    var channelName = channel.substring(1);
    if (self) {
        channels[channel] = {
            users: [],
            interval: setInterval(() => updateStream(channel), 60000)
        };
        $("#channels").append(getTab(channelName));
        $("#display").append(getPanel(channelName));
        if (Object.keys(channels).length === 1) {
            $(`#tab-${channelName} > a`).tab("show");
        }
        updateStream(channel);
    }
    channels[channel].users.push(username);
    $(`#channel-${channelName} .text`).append(`<i>${(self ? "You have" : `${username} has`)} joined ${channel}<br />`);
    $(`#channel-${channelName} .users`).html(channels[channel].users.join("<br />"));
});

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
        $(`#channel-${channelName} .text`).append(`<i>${`${username}`} has left ${channel}<br />`);
        $(`#channel-${channelName} .users`).html(channels[channel].users.join("<br />"));
    }
});

client.on("mod", (channel, username) => {
    var channelName = channel.substring(1);
    $(`#channel-${channelName} .text`).append(`<i>${username} is now a moderator of ${channel}<br />`);
});

client.on("unmod", (channel, username) => {
    var channelName = channel.substring(1);
    $(`#channel-${channelName} .text`).append(`<i>${username} is no longer a moderator of ${channel}<br />`);
});

client.on("credentials", (username, accessToken) => {
    if (!userSettings.data.twitch) {
        userSettings.data.twitch = {};
    }

    userSettings.queue(() => {
        userSettings.data.twitch.username = username;
        userSettings.data.twitch.accessToken = accessToken;
    }).then(() => {
        userSettings.save();
    });
});

userSettings.load().then(() => {
    new Promise((resolve, reject) => {
        if (userSettings.data && userSettings.data.twitch) {
            client.authorize(userSettings.data.twitch.username, userSettings.data.twitch.accessToken).then(resolve);
        } else {
            client.authorize().then(resolve);
        }
    }).then(() => {
        client.connect().then(() => {
            client.join("#roncli"); // TODO: Ask to join a channel?
        });
    });
});

$(document).ready(() => {
    var $inputbox = $("#inputbox"),
        patterns = {
            join: /^\/join #?([a-z0-9_]+)$/i,
            part: /^\/part$/i
        },
        setSize = ($el) => {
            setTimeout(() => {
                $el.css({height: "1px"});
                $el.css({height: `${$el.prop("scrollHeight") + 2}px`});
            }, 0);
        };

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

    $inputbox.on("change", () => setSize($inputbox));
    $inputbox.on("cut", () => setSize($inputbox));
    $inputbox.on("paste", () => setSize($inputbox));
    $inputbox.on("drop", () => setSize($inputbox));
    $inputbox.on("keydown", () => setSize($inputbox));
    $inputbox.on("keyup", () => setSize($inputbox));

    // Setup channel tabs.
    $("#channels").on("click", "a", (ev) => {
        ev.preventDefault();
        $(this).tab("show");
    });

    // Setup user list divider.
    $("#display").on("mousedown", "div.divider", (ev) => {
        var pageX = ev.pageX,
            $users = $(ev.target).next("div.users"),
            width = $users.width();
        
        $("#display").on("mousemove", (ev) => {
            width += pageX - ev.pageX;
            $users.width(width);
            pageX = ev.pageX;
        });
        $("#display").on("mouseup", () => {
            $("#display").off("mousemove");
        });

        ev.preventDefault();
    });
});
