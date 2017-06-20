const electron = require("electron"),
    win = electron.remote.getCurrentWindow();

//        #                                           #   #     #          #                             ##                        #    
//                                                    #         #          #                              #                        #    
// #  #  ##    ###          ##   ###          ##    ###  ##    ###    ##   ###    ###  ###   ###    ##    #           ###    ##   ###   
// #  #   #    #  #        #  #  #  #        # ##  #  #   #     #    #     #  #  #  #  #  #  #  #  # ##   #    ####  ##     # ##   #    
// ####   #    #  #        #  #  #  #        ##    #  #   #     #    #     #  #  # ##  #  #  #  #  ##     #            ##   ##     #    
// ####  ###   #  #         ##   #  #         ##    ###  ###     ##   ##   #  #   # #  #  #  #  #   ##   ###         ###     ##     ##  
win.on("editchannel-set", (channel, title, game) => {
    win.channel = channel;

    document.title = `Hyperdrive Toolkit - Edit Channel - #${channel}`;

    $("#title").val(title);
    $("#game").val(game);
    $(".channel").text(channel);
});

//         #      #                                       #     #                               #        
//  ###   #       #                                       #      #                              #        
// # #    #     ###   ##    ##   #  #  # #    ##   ###   ###     #         ###    ##    ###   ###  #  #  
//  ###   #    #  #  #  #  #     #  #  ####  # ##  #  #   #      #         #  #  # ##  #  #  #  #  #  #  
//   # #  #    #  #  #  #  #     #  #  #  #  ##    #  #   #      #    ##   #     ##    # ##  #  #   # #  
//  ###    #    ###   ##    ##    ###  #  #   ##   #  #    ##   #     ##   #      ##    # #   ###    #   
//                                                                                                  #    
$(document).ready(() => {
    win.emit("editchannel-get");

    $("#update").on("click", () => {
        win.emit("updatechannel", win.channel, $("#title").val(), $("#game").val());
    });
});
