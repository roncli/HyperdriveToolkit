var electron = require("electron"),
    path = require("path"),
    Twitch = require("./modules/chat/twitch"), // TODO: Load modules
    File = require("./modules/datastore/file"),
    settings = require("./js/settings"),
    client = new Twitch(settings),
    userSettings = new File(path.join(electron.remote.app.getPath("userData"), "userSettings.js"));
    channels = {},
    getTab = (username) => {
        return `<li id="tab-${username}"><a data-toggle="tab" href="#channel-${username}">#${username}</a></li>`;
    },
    getPanel = (username) => {
        return `<div role="tabpanel" class="tab-pane" id="channel-${username}">
    <div class="chat" class="chat">
        <div class="topic"></div>
        <div class="text"></div>
    </div>
    <div class="users" class="users"></div>
</div>`;
    };

client.on("message", (channel, username, displayname, text) => {
    console.log("message", channel, username, text);
    $(`#channel-${channel.substring(1)} .text`).append(`<b>${displayname}</b>: ${text}<br />`);
});

client.on("join", (channel, username, self) => {
    console.log("join", channel, username);
    if (self) {
        channels[channel] = {
            users: []
        };
        $("#channels").append(getTab(channel.substring(1)));
        $("#display").append(getPanel(channel.substring(1)));
    }
    channels[channel].users.push(username);
    $(`#channel-${channel.substring(1)} .text`).append(`<i>${(self ? "You have" : `${username} has`)} joined ${channel}<br />`);
    $(`#channel-${channel.substring(1)} .users`).html(channels[channel].users.join("<br />"));
});

client.on("part", (channel, username, self) => {
    channels[channel].users.splice(channels[channel].users.indexOf(username), 1);
    if (self) {
        $(`#tab-${channel.substring(1)}`).remove();
        $(`#channel-${channel.substring(1)}`).remove();
    }
    $(`#channel-${channel.substring(1)} .text`).append(`<i>${(self ? "You have" : `${username} has`)} left ${channel}<br />`);
    $(`#channel-${channel.substring(1)} .users`).html(channels[channel].users.join("<br />"));
});

client.on("mod", (channel, username) => {
    $(`#channel-${channel.substring(1)} .text`).append(`<i>${username} is now a moderator of ${channel}<br />`);
});

client.on("unmod", (channel, username) => {
    $(`#channel-${channel.substring(1)} .text`).append(`<i>${username} is no longer a moderator of ${channel}<br />`);
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
            client.join("#roncli");
        });
    });
});

$(document).ready(() => {
    var $inputbox = $("#inputbox");

    $inputbox.on("keypress", (ev) => {
        if (ev.keyCode === 13 && client.connected) {
            let input = $inputbox.val(),
                matches;

            matches = /^\/join #?([a-z0-9_]+)$/i.exec(input);

            if (matches) {
                let channel = matches[1].toLowerCase();
                client.join(`#${channel}`);
                return;
            }

            matches = /^\/part$/i.exec(input);

            if (matches) {
                client.part($("#channels li.active").text());
                return;
            }

            client.send($("#channels li.active").text(), $inputbox.val());
            $inputbox.val("");
        }
    });

    $("#channels").on("click", "a", (ev) => {
        ev.preventDefault();
        $(this).tab("show");
    });
});
