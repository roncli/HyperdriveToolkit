const electron = require("electron"),
    win = electron.remote.getCurrentWindow(),
    Utilities = require("./js/utilities");

//        #                                                      #    #    ##                              #    
//                                                              # #         #                              #    
// #  #  ##    ###          ##   ###         ###   ###    ##    #    ##     #     ##          ###    ##   ###   
// #  #   #    #  #        #  #  #  #        #  #  #  #  #  #  ###    #     #    # ##  ####  ##     # ##   #    
// ####   #    #  #        #  #  #  #        #  #  #     #  #   #     #     #    ##            ##   ##     #    
// ####  ###   #  #         ##   #  #        ###   #      ##    #    ###   ###    ##         ###     ##     ##  
//                                           #                                                                  
win.on("profile-set", (channel, username, userChat) => {
    win.channel = channel;
    win.username = username;
    $("#user-chat").html(userChat);

    document.title = `Hyperdrive Toolkit - Profile - ${username} on ${channel}`;
    $(".username").text(username);
});

//        #                                        #            #                        #     #     #                       
//                                                 #            #                        #     #                             
// #  #  ##    ###          ##   ###          ##   ###    ###  ###          ###    ##   ###   ###   ##    ###    ###   ###   
// #  #   #    #  #        #  #  #  #        #     #  #  #  #   #    ####  ##     # ##   #     #     #    #  #  #  #  ##     
// ####   #    #  #        #  #  #  #        #     #  #  # ##   #            ##   ##     #     #     #    #  #   ##     ##   
// ####  ###   #  #         ##   #  #         ##   #  #   # #    ##        ###     ##     ##    ##  ###   #  #  #     ###    
//                                                                                                               ###         
win.on("chat-settings", (settings) => {
    Utilities.changeCss("#user-chat", `font-family: "${settings.font.face}"; font-size: ${settings.font.size}px; color: ${settings.colors.chat.foreground}; background-color: ${settings.colors.chat.background};`, $);
    Utilities.changeCss("#user-chat .info", `color: ${settings.colors.chat.info};`, $);
    Utilities.changeCss("#user-chat .join", `color: ${settings.colors.chat.join};`, $);
    Utilities.changeCss("#user-chat .part", `color: ${settings.colors.chat.part};`, $);
    Utilities.changeCss("#user-chat .highlight", `color: ${settings.colors.chat.highlight};`, $);
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
