var electron = require("electron"),
    express = require("express"),
    app = express(),
    server, accessToken;

app.use(express.static(`${__dirname}/public`, {index: "index.htm"}));

app.get("/token-redirect", function(req, res) {
    accessToken = req.query.access_token;
    res.sendFile(`${__dirname}/close.htm`);
    electron.remote.getCurrentWindow().emit("access-token", accessToken);
    window.close();
});

console.log("Listening on port 65100.");
app.listen(65100);

window.addEventListener("beforeunload", function(ev) {
    if (!accessToken) {
        if (!confirm("Are you sure you want to exit now?")) {
            ev.returnValue = true;
            return;
        }
    }
});

window.addEventListener("unload", function() {
    server.close();
});

electron.remote.getCurrentWindow().setMenu(null);
