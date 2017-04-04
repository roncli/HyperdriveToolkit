var Twitch = require("./modules/chat/twitch"), // TODO: Load modules
    settings = require("./js/settings"),
    client = new Twitch(settings),
    channels = {};

client.on("connected", (address, port) => {
    document.getElementById("text").innerHTML += `Connected on address ${address} port ${port}<br />`;
});

client.on("message", (channel, username, displayname, text) => {
    document.getElementById("text").innerHTML += `<b>${displayname}</b>: ${text}<br />`;
});

client.on("join", (channel, username, self) => {
    channels[channel].users.push(username);
    document.getElementById("text").innerHTML += `<i>${(self ? "You have" : `${username} has`)} joined ${channel}<br />`;
    document.getElementById("users").innerHTML = channels[channel].users.join("<br />");
});

client.on("part", (channel, username, self) => {
    channels[channel].users.splice(channels[channel].users.indexOf(username), 1);
    document.getElementById("text").innerHTML += `<i>${(self ? "You have" : `${username} has`)} left ${channel}<br />`;
    document.getElementById("users").innerHTML = channels[channel].users.join("<br />");
});

client.on("mod", (channel, username) => {
    document.getElementById("text").innerHTML += `<i>${username} is now a moderator of ${channel}<br />`;
});

client.on("unmod", (channel, username) => {
    document.getElementById("text").innerHTML += `<i>${username} is no longer a moderator of ${channel}<br />`;
});

client.authorize().then(() => {
    client.connect().then(() => {
        channels["#roncli"] = {
            users: []
        };

        client.join("#roncli");
    });
});
