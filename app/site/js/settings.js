var electron = require("electron"),
    NodeFonts = require("node-fonts"),
    win = electron.remote.getCurrentWindow(),
    fonts;

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
    win.data.appSettings = JSON.parse(JSON.stringify(appSettings));

    $("#colors-chat-foreground").colorpicker("setValue", win.data.appSettings.chat.colors.chat.foreground);
    $("#colors-chat-background").colorpicker("setValue", win.data.appSettings.chat.colors.chat.background);
    $("#colors-chat-info").colorpicker("setValue", win.data.appSettings.chat.colors.chat.info);
    $("#colors-chat-join").colorpicker("setValue", win.data.appSettings.chat.colors.chat.join);
    $("#colors-chat-part").colorpicker("setValue", win.data.appSettings.chat.colors.chat.part);
    $("#colors-chat-highlight").colorpicker("setValue", win.data.appSettings.chat.colors.chat.highlight);
    $("#font-face").val(win.data.appSettings.chat.font.face);
    $("#font-size").val(win.data.appSettings.chat.font.size);
    $("#colors-input-foreground").colorpicker("setValue", win.data.appSettings.chat.colors.input.foreground);
    $("#colors-input-background").colorpicker("setValue", win.data.appSettings.chat.colors.input.background);
    $("#colors-userlist-foreground").colorpicker("setValue", win.data.appSettings.chat.colors.userList.foreground);
    $("#colors-userlist-background").colorpicker("setValue", win.data.appSettings.chat.colors.userList.background);
    $("#chat-timestamps").prop("checked", win.data.appSettings.chat.timestamps)
});

Promise.all([
    new Promise((resolve, reject) => {
        new NodeFonts().getFonts().then((res) => {
            fonts = res.sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()));

            resolve();
        }).catch((err) => {
            reject(err);
        });
    }),

    new Promise((resolve) => {
        //         #      #                                       #     #                               #        
        //  ###   #       #                                       #      #                              #        
        // # #    #     ###   ##    ##   #  #  # #    ##   ###   ###     #         ###    ##    ###   ###  #  #  
        //  ###   #    #  #  #  #  #     #  #  ####  # ##  #  #   #      #         #  #  # ##  #  #  #  #  #  #  
        //   # #  #    #  #  #  #  #     #  #  #  #  ##    #  #   #      #    ##   #     ##    # ##  #  #   # #  
        //  ###    #    ###   ##    ##    ###  #  #   ##   #  #    ##   #     ##   #      ##    # #   ###    #   
        //                                                                                                  #    
        $(document).ready(() => {
            // Setup color pickers
            $("#colors-chat-foreground").colorpicker();

            win.getParentWindow().emit("appSettings-get", win);

            //                                                              ##     #          #     
            //  # #                                                          #                #     
            // #####  ###    ###  # #    ##          ##   ###          ##    #    ##     ##   # #   
            //  # #  ##     #  #  # #   # ##        #  #  #  #        #      #     #    #     ##    
            // #####   ##   # ##  # #   ##          #  #  #  #        #      #     #    #     # #   
            //  # #  ###     # #   #     ##          ##   #  #         ##   ###   ###    ##   #  #  
            $("#save").on("click", () => {
                win.data.appSettings.chat.colors.chat.foreground = $("#colors-chat-foreground").colorpicker("getValue");
                win.data.appSettings.chat.colors.chat.background = $("#colors-chat-background").colorpicker("getValue");
                win.data.appSettings.chat.colors.chat.info = $("#colors-chat-info").colorpicker("getValue");
                win.data.appSettings.chat.colors.chat.join = $("#colors-chat-join").colorpicker("getValue");
                win.data.appSettings.chat.colors.chat.part = $("#colors-chat-part").colorpicker("getValue");
                win.data.appSettings.chat.colors.chat.highlight = $("#colors-chat-highlight").colorpicker("getValue");
                win.data.appSettings.chat.font.face = $("#font-face").val();
                win.data.appSettings.chat.font.size = $("#font-size").val();
                win.data.appSettings.chat.colors.input.foreground = $("#colors-input-foreground").colorpicker("getValue");
                win.data.appSettings.chat.colors.input.background = $("#colors-input-background").colorpicker("getValue");
                win.data.appSettings.chat.colors.userList.foreground = $("#colors-userlist-foreground").colorpicker("getValue");
                win.data.appSettings.chat.colors.userList.background = $("#colors-userlist-background").colorpicker("getValue");
                win.data.appSettings.chat.timestamps = $("#chat-timestamps").is(":checked");

                win.getParentWindow().emit("appSettings-set", win.data.appSettings);

                win.close();
            });

            resolve();
        });
    })
]).then(() => {
    var $fontFace = $("#font-face");

    fonts.forEach((font) => {
        $fontFace.append($("<option></option>").text(font));
    });

    $("#font-face").val(win.data.appSettings.chat.font.face);
}).catch((err) => {
    console.log(err);
});
