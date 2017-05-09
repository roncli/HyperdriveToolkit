var electron = require("electron"),
    NodeFonts = require("node-fonts"),
    win = electron.remote.getCurrentWindow();

//        #                                                     ##          #     #     #                                          #                                                            
//                                                             #  #         #     #                                                #                                                            
// #  #  ##    ###          ##   ###          ###  ###   ###    #     ##   ###   ###   ##    ###    ###   ###          ###   ##   ###         ###    ##    ###   ###    ##   ###    ###    ##   
// #  #   #    #  #        #  #  #  #        #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     ####  #  #  # ##   #    ####  #  #  # ##  ##     #  #  #  #  #  #  ##     # ##  
// ####   #    #  #        #  #  #  #        # ##  #  #  #  #  #  #  ##     #     #     #    #  #   ##     ##          ##   ##     #          #     ##      ##   #  #  #  #  #  #    ##   ##    
// ####  ###   #  #         ##   #  #         # #  ###   ###    ##    ##     ##    ##  ###   #  #  #     ###          #      ##     ##        #      ##   ###    ###    ##   #  #  ###     ##   
//                                                 #     #                                          ###                ###                                       #                              
win.on("appSettings-get-response", (appSettings) => {
    if (!win.data) {
        win.data = {};
    }
    win.data.appSettings = appSettings;

    $("#font-face").val(win.data.appSettings.chat.font.face);
    $("#font-size").val(win.data.appSettings.chat.font.size);
    $("#colors-chat-foreground").val(win.data.appSettings.chat.colors.chat.foreground);
    $("#colors-chat-background").val(win.data.appSettings.chat.colors.chat.background);
    $("#colors-chat-info").val(win.data.appSettings.chat.colors.chat.info);
    $("#colors-chat-join").val(win.data.appSettings.chat.colors.chat.join);
    $("#colors-chat-part").val(win.data.appSettings.chat.colors.chat.part);
    $("#colors-chat-highlight").val(win.data.appSettings.chat.colors.chat.highlight);
    $("#colors-input-foreground").val(win.data.appSettings.chat.colors.input.foreground);
    $("#colors-input-background").val(win.data.appSettings.chat.colors.input.background);
    $("#colors-userlist-foreground").val(win.data.appSettings.chat.colors.userList.foreground);
    $("#colors-userlist-background").val(win.data.appSettings.chat.colors.userList.background);
});

//         #      #                                       #     #                               #        
//  ###   #       #                                       #      #                              #        
// # #    #     ###   ##    ##   #  #  # #    ##   ###   ###     #         ###    ##    ###   ###  #  #  
//  ###   #    #  #  #  #  #     #  #  ####  # ##  #  #   #      #         #  #  # ##  #  #  #  #  #  #  
//   # #  #    #  #  #  #  #     #  #  #  #  ##    #  #   #      #    ##   #     ##    # ##  #  #   # #  
//  ###    #    ###   ##    ##    ###  #  #   ##   #  #    ##   #     ##   #      ##    # #   ###    #   
//                                                                                                  #    
$(document).ready(() => {
    new NodeFonts().getFonts().then((fonts) => {
        fonts.forEach((font) => {
            console.log(font);
        });
    });

    win.getParentWindow().emit("appSettings-get", win);

    //                                                              ##     #          #     
    //  # #                                                          #                #     
    // #####  ###    ###  # #    ##          ##   ###          ##    #    ##     ##   # #   
    //  # #  ##     #  #  # #   # ##        #  #  #  #        #      #     #    #     ##    
    // #####   ##   # ##  # #   ##          #  #  #  #        #      #     #    #     # #   
    //  # #  ###     # #   #     ##          ##   #  #         ##   ###   ###    ##   #  #  
    $("#save").on("click", () => {
        win.data.appSettings.chat.font.face = $("#font-face").val();
        win.data.appSettings.chat.font.size = $("#font-size").val();
        win.data.appSettings.chat.colors.chat.foreground = $("#colors-chat-foreground").val();
        win.data.appSettings.chat.colors.chat.background = $("#colors-chat-background").val();
        win.data.appSettings.chat.colors.chat.info = $("#colors-chat-info").val();
        win.data.appSettings.chat.colors.chat.join = $("#colors-chat-join").val();
        win.data.appSettings.chat.colors.chat.part = $("#colors-chat-part").val();
        win.data.appSettings.chat.colors.chat.highlight = $("#colors-chat-highlight").val();
        win.data.appSettings.chat.colors.input.foreground = $("#colors-input-foreground").val();
        win.data.appSettings.chat.colors.input.background = $("#colors-input-background").val();
        win.data.appSettings.chat.colors.userList.foreground = $("#colors-userlist-foreground").val();
        win.data.appSettings.chat.colors.userList.background = $("#colors-userlist-background").val();

        win.getParentWindow().emit("appSettings-set", win.data.appSettings);

        win.close();
    });
});
