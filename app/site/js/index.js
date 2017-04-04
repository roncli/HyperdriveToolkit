var Twitch = require("./js/modules/chat/twitch"), // TODO: Load modules
    settings = require("./js/settings"),
    client = new Twitch(settings),
    channels = [];

client.on("connected", (address, port) => {
    document.getElementById("output").innerHTML += "Connected on address " + address + " port " + port + "<br />";
});

client.on("message", (channel, username, displayname, text) => {
    document.getElementById("text").innerHTML += "<b>" + displayname + "</b>: " + text + "<br />";
});

client.authorize().then(() => {
    client.connect();
});
