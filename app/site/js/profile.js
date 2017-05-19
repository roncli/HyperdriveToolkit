const electron = require("electron"),
    win = electron.remote.getCurrentWindow();

//        #                                                      #    #    ##                              #    
//                                                              # #         #                              #    
// #  #  ##    ###          ##   ###         ###   ###    ##    #    ##     #     ##          ###    ##   ###   
// #  #   #    #  #        #  #  #  #        #  #  #  #  #  #  ###    #     #    # ##  ####  ##     # ##   #    
// ####   #    #  #        #  #  #  #        #  #  #     #  #   #     #     #    ##            ##   ##     #    
// ####  ###   #  #         ##   #  #        ###   #      ##    #    ###   ###    ##         ###     ##     ##  
//                                           #                                                                  
win.on("profile-set", (channel, username) => {
    win.channel = channel;
    win.username = username;

    document.title = `Hyperdrive Toolkit - Profile - ${username} on ${channel}`;
    $(".username").text(username);
});

//         #      #                                       #     #                               #        
//  ###   #       #                                       #      #                              #        
// # #    #     ###   ##    ##   #  #  # #    ##   ###   ###     #         ###    ##    ###   ###  #  #  
//  ###   #    #  #  #  #  #     #  #  ####  # ##  #  #   #      #         #  #  # ##  #  #  #  #  #  #  
//   # #  #    #  #  #  #  #     #  #  #  #  ##    #  #   #      #    ##   #     ##    # ##  #  #   # #  
//  ###    #    ###   ##    ##    ###  #  #   ##   #  #    ##   #     ##   #      ##    # #   ###    #   
//                                                                                                  #    
$(document).ready(() => {
    win.emit("profile-get");

    $("#ban").on("click", () => {
        win.emit("command", "ban", win.channel, win.username, $("#ban-reason").val());
    });

    $("#unban").on("click", () => {
        win.emit("command", "unban", win.channel, win.username);
    });

    $("#timeout").on("click", () => {
        win.emit("command", "timeout", win.channel, win.username, $("#timeout-time").val(), $("#ban-reason").val());
    });

    $("#mod").on("click", () => {
        win.emit("command", "mod", win.channel, win.username);
    });

    $("#unmod").on("click", () => {
        win.emit("command", "unmod", win.channel, win.username);
    });

    $("#twitch").on("click", () => {
        electron.shell.openExternal(`http://twitch.tv/${win.username}`);
    });

    $("#join").on("click", () => {
        win.emit("command", "join", `#${win.username}`);
    });

    $("#follow").on("click", () => {
        win.emit("command", "follow", win.username);
    });

    $("#unfollow").on("click", () => {
        win.emit("command", "unfollow", win.username);
    });
});
