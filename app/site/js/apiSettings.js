module.exports = {
    tmi: {
        options: {
            clientId: "xetz9cvboym6sr1iz19qr0kubr2nl1"
        },
        connection: {
            reconnect: true
        }
    },
    twitch: {
        clientId: "xetz9cvboym6sr1iz19qr0kubr2nl1",
        clientSecret: "-",
        redirectUri: "http://127.0.0.1:65100/token",
        scopes: [
            "channel_commercial",
            "channel_editor",
            "channel_read",
            "channel_subscriptions",
            "chat_login",
            "user_follows_edit",
            "user_read"
        ]
    }
};
