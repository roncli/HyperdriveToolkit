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

//        #                                           #   #     #          #                             ##           #                      ##     #       #        #                             ##
//                                                    #         #          #                              #                                   #             #        #                              #
// #  #  ##    ###          ##   ###          ##    ###  ##    ###    ##   ###    ###  ###   ###    ##    #          ##    ###   # #    ###   #    ##     ###   ##   ###    ###  ###   ###    ##    #
// #  #   #    #  #        #  #  #  #        # ##  #  #   #     #    #     #  #  #  #  #  #  #  #  # ##   #    ####   #    #  #  # #   #  #   #     #    #  #  #     #  #  #  #  #  #  #  #  # ##   #
// ####   #    #  #        #  #  #  #        ##    #  #   #     #    #     #  #  # ##  #  #  #  #  ##     #           #    #  #  # #   # ##   #     #    #  #  #     #  #  # ##  #  #  #  #  ##     #
// ####  ###   #  #         ##   #  #         ##    ###  ###     ##   ##   #  #   # #  #  #  #  #   ##   ###         ###   #  #   #     # #  ###   ###    ###   ##   #  #   # #  #  #  #  #   ##   ###
win.on("editchannel-invalidchannel", () => {
    $(".error").text("You do not have permission to edit this channel.").addClass("text-danger");
});

//        #                                           #   #     #          #                             ##                #
//                                                    #         #          #                              #                #
// #  #  ##    ###          ##   ###          ##    ###  ##    ###    ##   ###    ###  ###   ###    ##    #           ##   # #
// #  #   #    #  #        #  #  #  #        # ##  #  #   #     #    #     #  #  #  #  #  #  #  #  # ##   #    ####  #  #  ##
// ####   #    #  #        #  #  #  #        ##    #  #   #     #    #     #  #  # ##  #  #  #  #  ##     #          #  #  # #
// ####  ###   #  #         ##   #  #         ##    ###  ###     ##   ##   #  #   # #  #  #  #  #   ##   ###          ##   #  #

win.on("editchannel-ok", () => {
    $(".error").text("Channel updated.").removeClass("text-danger");
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
        $(".error").text();
        win.emit("updatechannel", win.channel, $("#title").val(), $("#game").val());
    });
});
