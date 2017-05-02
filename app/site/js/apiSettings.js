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
        clientSecret: undefined,
        redirectUri: "http://127.0.0.1:65100/token",
        scopes: ["chat_login", "channel_editor", "channel_commercial", "user_read", "channel_subscriptions", "user_follows_edit"]
    }
};
