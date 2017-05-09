var electron = require("electron"),
    remote = electron.remote,
    app = remote.app,
    win = remote.getCurrentWindow(),
    path = require("path"),
    Twitch = require("./modules/chat/twitch"), // TODO: Load modules
    settings = require("./js/apiSettings"),
    client = new Twitch(settings),
    File = require("./modules/datastore/file"),
    channels = {},

    //              #    ###         #     
    //              #     #          #     
    //  ###   ##   ###    #     ###  ###   
    // #  #  # ##   #     #    #  #  #  #  
    //  ##   ##     #     #    # ##  #  #  
    // #      ##     ##   #     # #  ###   
    //  ###                                
    getTab = (username) => {
        return `<li id="tab-${username}" class="channel-tab"><a data-toggle="tab" href="#channel-${username}">#${username}</a></li>`;
    },

    //              #    ###                     ##    
    //              #    #  #                     #    
    //  ###   ##   ###   #  #   ###  ###    ##    #    
    // #  #  # ##   #    ###   #  #  #  #  # ##   #    
    //  ##   ##     #    #     # ##  #  #  ##     #    
    // #      ##     ##  #      # #  #  #   ##   ###   
    //  ###                                            
    getPanel = (username) => {
        return `<div role="tabpanel" class="tab-pane" id="channel-${username}">
    <div class="chat">
        <div class="topic"></div>
        <div class="text"></div>
    </div>
    <div class="divider"></div>
    <div class="users"></div>
</div>`;
    },

    //                #         #           ##    #                            
    //                #         #          #  #   #                            
    // #  #  ###    ###   ###  ###    ##    #    ###   ###    ##    ###  # #   
    // #  #  #  #  #  #  #  #   #    # ##    #    #    #  #  # ##  #  #  ####  
    // #  #  #  #  #  #  # ##   #    ##    #  #   #    #     ##    # ##  #  #  
    //  ###  ###    ###   # #    ##   ##    ##     ##  #      ##    # #  #  #  
    //       #                                                                 
    updateStream = (channel) => {
        var channelName = channel.substring(1);
        client.getStream(channelName).then((stream) => {
            if (stream) {
                channels[channel].stream = stream;
                channels[channel].channel = stream.channel;
                updateTitle(channel);
            } else {
                delete channels[channel].stream;
                client.getChannel(channelName).then((channelData) => {
                    channels[channel].channel = channelData;
                    updateTitle(channel);
                });
            }
        });

        client.getChatters(channelName).then((chatters) => {
            channels[channel].chatters = chatters;
            updateTitle(channel);
        });
    },

    //              #    ###    #                 ##    #                      
    //              #     #                      #  #                          
    //  ###   ##   ###    #    ##    # #    ##    #    ##    ###    ##    ##   
    // #  #  # ##   #     #     #    ####  # ##    #    #    #  #  #     # ##  
    //  ##   ##     #     #     #    #  #  ##    #  #   #    #  #  #     ##    
    // #      ##     ##   #    ###   #  #   ##    ##   ###   #  #   ##    ##   
    //  ###                                                                    
    getTimeSince = (time) => {
        var diff = new Date().getTime() - new Date(time).getTime();

        return `${Math.floor(diff / 3600000)}:${("0" + Math.floor(diff % 3600000 / 60000)).slice(-2)}`;
    },

    //                #         #          ###    #     #    ##          
    //                #         #           #           #     #          
    // #  #  ###    ###   ###  ###    ##    #    ##    ###    #     ##   
    // #  #  #  #  #  #  #  #   #    # ##   #     #     #     #    # ##  
    // #  #  #  #  #  #  # ##   #    ##     #     #     #     #    ##    
    //  ###  ###    ###   # #    ##   ##    #    ###     ##  ###    ##   
    //       #                                                           
    updateTitle = (channel) => {
        var channelName = channel.substring(1);
        $(`#channel-${channelName} .topic`).html(
`<div style="position: relative;">
    ${channels[channel].channel && channels[channel].channel.profile_banner ? `<div class="topic-background" style="background-image: url('${channels[channel].channel.profile_banner}');"></div>` : ""}
    <div class="topic-foreground">
        ${channels[channel].channel && channels[channel].channel.logo ? `<img src="${channels[channel].channel.logo}" class="topic-logo">` : ""}
        ${channels[channel].channel ? `<div class="topic-text">
            ${channel} - ${channels[channel].channel.status} (${channels[channel].channel.game})<br />
            ${channels[channel].stream ? `Online: ${getTimeSince(channels[channel].stream.created_at)} - Viewers: ${channels[channel].stream.viewers} - ` : ""}${channels[channel].chatters ? `Chatters: ${channels[channel].chatters.chatter_count} - ` : ""}Followers: ${channels[channel].channel.followers} - Views: ${channels[channel].channel.views}
        </div>` : ""}
    </div>
</div>`);
    },

    //       #                              ##                 
    //       #                             #  #                
    //  ##   ###    ###  ###    ###   ##   #      ###    ###   
    // #     #  #  #  #  #  #  #  #  # ##  #     ##     ##     
    // #     #  #  # ##  #  #   ##   ##    #  #    ##     ##   
    //  ##   #  #   # #  #  #  #      ##    ##   ###    ###    
    //                          ###                            
    // Based on http://stackoverflow.com/a/19826393/214137
    changeCss = (cssName, cssValue) => {
        var cssMainContainer = $("#css-modifier-container"),
            classContainer = cssMainContainer.find(`div[data-class="${cssName}"]`);

        // Create hidden css main container if it doesn't exist.
        if (cssMainContainer.length === 0) {
            cssMainContainer = $("<div></div>").attr({id: "css-modifier-container"});
            cssMainContainer.hide();
            cssMainContainer.appendTo($("body"));
        }

        // Create div for the css if it doesn't exist.
        if (classContainer.length === 0) {
            classContainer = $("<div></div>").attr({"data-class": cssName});
            classContainer.appendTo(cssMainContainer);
        }

        // Replace style in the css div.
        classContainer.html(`<style>${cssName}{${cssValue}}</style>`);
    },

    //               #     #     #                        ##   #                                #  
    //               #     #                             #  #  #                                #  
    //  ###    ##   ###   ###   ##    ###    ###   ###   #     ###    ###  ###    ###   ##    ###  
    // ##     # ##   #     #     #    #  #  #  #  ##     #     #  #  #  #  #  #  #  #  # ##  #  #  
    //   ##   ##     #     #     #    #  #   ##     ##   #  #  #  #  # ##  #  #   ##   ##    #  #  
    // ###     ##     ##    ##  ###   #  #  #     ###     ##   #  #   # #  #  #  #      ##    ###  
    //                                       ###                                  ###              
    settingsChanged = () => {
        changeCss("#display", `font-family: "${win.data.appSettings.data.chat.font.face}"; font-size: ${win.data.appSettings.data.chat.font.size}px;`); // TODO: Potentially have a max size for title, input bo
        changeCss("#display div.chat", `color: ${win.data.appSettings.data.chat.colors.chat.foreground}; background-color: ${win.data.appSettings.data.chat.colors.chat.background};`);
        //changeCss("#display div.chat .text", `font-size: ${win.data.appSettings.data.chat.font.size}px;`);
        changeCss("#display div.chat .info", `color: ${win.data.appSettings.data.chat.colors.chat.info};`);
        changeCss("#display div.chat .join", `color: ${win.data.appSettings.data.chat.colors.chat.join};`);
        changeCss("#display div.chat .part", `color: ${win.data.appSettings.data.chat.colors.chat.part};`);
        changeCss("#display div.chat .highlight", `color: ${win.data.appSettings.data.chat.colors.chat.highlight};`);
        changeCss("#inputbox", `color: ${win.data.appSettings.data.chat.colors.input.foreground}; background-color: ${win.data.appSettings.data.chat.colors.input.background}; font-family: "${win.data.appSettings.data.chat.font.face}"; font-size: ${win.data.appSettings.data.chat.font.size}px;`);
        changeCss("#display div.users", `color: ${win.data.appSettings.data.chat.colors.userList.foreground}; background-color: ${win.data.appSettings.data.chat.colors.userList.background};`);
        setSize($("#inputbox"));
    },


    //               #     ##    #                
    //               #    #  #                    
    //  ###    ##   ###    #    ##    ####   ##   
    // ##     # ##   #      #    #      #   # ##  
    //   ##   ##     #    #  #   #     #    ##    
    // ###     ##     ##   ##   ###   ####   ##   
    setSize = ($el) => {
        setTimeout(() => {
            $el.css({height: "1px"});
            $el.css({height: `${$el.prop("scrollHeight") + 2}px`});
        }, 0);
    };

if (!win.data) {
    win.data = {};
}
win.data.userSettings = new File(path.join(app.getPath("userData"), "userSettings.js")),
win.data.appSettings = new File(path.join(app.getPath("userData"), "appSettings.js")),

//       ##     #                 #                        #    # #                                               # #   #    
//        #                       #                       #     # #                                               # #    #   
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  # #    ##    ###    ###    ###   ###   ##    # #    #   
// #      #     #    # ##  #  #   #          #  #  #  #   #          ####  # ##  ##     ##     #  #  #  #  # ##          #   
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  ##      ##     ##   # ##   ##   ##            #   
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         #  #   ##   ###    ###     # #  #      ##          #    
//                                                                                                    ###                    
client.on("message", (channel, username, usercolor, displayname, html, text) => {
    var channelName = channel.substring(1);

    if (text.indexOf(win.data.userSettings.data.twitch.username) === -1) {
        $(`#channel-${channelName} .text`).append(`<b style="color: ${usercolor}">${displayname}</b>: ${html}<br />`);
    } else {
        $(`#channel-${channelName} .text`).append(`<b style="color: ${usercolor}">${displayname}</b>: <span class="highlight">${html}</span><br />`);
    }
});

//       ##     #                 #                        #    # #    #          #           # #   #    
//        #                       #                       #     # #                           # #    #   
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #    #    ##   ##    ###    # #    #   
// #      #     #    # ##  #  #   #          #  #  #  #   #            #   #  #   #    #  #          #   
// #      #     #    ##    #  #   #     ##   #  #  #  #   #            #   #  #   #    #  #          #   
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         # #    ##   ###   #  #         #    
//                                                                    #                                  
client.on("join", (channel, username, self) => {
    var channelName = channel.substring(1);
    if (self) {
        channels[channel] = {
            users: [],
            interval: setInterval(() => updateStream(channel), 60000)
        };
        $("#channels").append(getTab(channelName));
        $("#display").append(getPanel(channelName));
        if (Object.keys(channels).length === 1) {
            $(`#tab-${channelName} > a`).tab("show");
        }
        updateStream(channel);
    }
    channels[channel].users.push(username);
    $(`#channel-${channelName} .text`).append(`<span class="join">${(self ? "You have" : `${username} has`)} joined ${channel}</span><br />`);
    $(`#channel-${channelName} .users`).html(channels[channel].users.join("<br />"));
});

//       ##     #                 #                        #    # #                     #     # #   #    
//        #                       #                       #     # #                     #     # #    #   
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  ###    ###  ###   ###    # #    #   
// #      #     #    # ##  #  #   #          #  #  #  #   #          #  #  #  #  #  #   #            #   
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  # ##  #      #            #   
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         ###    # #  #       ##         #    
//                                                                   #                                   
client.on("part", (channel, username, self) => {
    var channelName = channel.substring(1);
    if (self) {
        let index = $(`#tab-${channelName}`).index();
        $(`#tab-${channelName}`).remove();
        $(`#channel-${channelName}`).remove();
        clearInterval(channels[channel].interval);
        delete channels[channel];
        if ($(".channel-tab.active").length === 0) {
            $(`.channel-tab:nth-child(${index === Object.keys(channels).length ? index : index + 1}) > a`).tab("show");
        }
    } else {
        channels[channel].users.splice(channels[channel].users.indexOf(username), 1);
        $(`#channel-${channelName} .text`).append(`<span class="part">${`${username}`} has left ${channel}</span><br />`);
        $(`#channel-${channelName} .users`).html(channels[channel].users.join("<br />"));
    }
});

//       ##     #                 #                        #    # #                 #   # #   #    
//        #                       #                       #     # #                 #   # #    #   
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  # #    ##    ###   # #    #   
// #      #     #    # ##  #  #   #          #  #  #  #   #          ####  #  #  #  #          #   
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  #  #  #  #          #   
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #         #  #   ##    ###         #    
client.on("mod", (channel, username) => {
    var channelName = channel.substring(1);
    $(`#channel-${channelName} .text`).append(`<span class="info">${username} is now a moderator of ${channel}</span><br />`);
});

//       ##     #                 #                        #    # #                             #   # #   #    
//        #                       #                       #     # #                             #   # #    #   
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #  #  #  ###   # #    ##    ###   # #    #   
// #      #     #    # ##  #  #   #          #  #  #  #   #          #  #  #  #  ####  #  #  #  #          #   
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #  #  #  #  #  #  #  #  #  #          #   
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #          ###  #  #  #  #   ##    ###         #    
client.on("unmod", (channel, username) => {
    var channelName = channel.substring(1);
    $(`#channel-${channelName} .text`).append(`<span class="info">${username} is no longer a moderator of ${channel}</span><br />`);
});

//       ##     #                 #                        #    # #                       #               #     #          ##            # #   #    
//        #                       #                       #     # #                       #               #                 #            # #    #   
//  ##    #    ##     ##   ###   ###          ##   ###    #     # #   ##   ###    ##    ###   ##   ###   ###   ##     ###   #     ###    # #    #   
// #      #     #    # ##  #  #   #          #  #  #  #   #          #     #  #  # ##  #  #  # ##  #  #   #     #    #  #   #    ##             #   
// #      #     #    ##    #  #   #     ##   #  #  #  #   #          #     #     ##    #  #  ##    #  #   #     #    # ##   #      ##           #   
//  ##   ###   ###    ##   #  #    ##   ##    ##   #  #    #          ##   #      ##    ###   ##   #  #    ##  ###    # #  ###   ###           #    
client.on("credentials", (username, accessToken) => {
    if (!win.data.userSettings.data.twitch) {
        win.data.userSettings.data.twitch = {};
    }

    win.data.userSettings.queue(() => {
        win.data.userSettings.data.twitch.username = username;
        win.data.userSettings.data.twitch.accessToken = accessToken;
    }).then(() => {
        win.data.userSettings.save();
    });
});

//                           ##          #     #     #                             ##                   #  
//                          #  #         #     #                                    #                   #  
// #  #   ###    ##   ###    #     ##   ###   ###   ##    ###    ###   ###          #     ##    ###   ###  
// #  #  ##     # ##  #  #    #   # ##   #     #     #    #  #  #  #  ##            #    #  #  #  #  #  #  
// #  #    ##   ##    #     #  #  ##     #     #     #    #  #   ##     ##    ##    #    #  #  # ##  #  #  
//  ###  ###     ##   #      ##    ##     ##    ##  ###   #  #  #     ###     ##   ###    ##    # #   ###  
//                                                               ###                                       
win.data.userSettings.load().then(() => {
    new Promise((resolve) => {
        if (win.data.userSettings.data && win.data.userSettings.data.twitch) {
            client.authorize(win.data.userSettings.data.twitch.username, win.data.userSettings.data.twitch.accessToken).then(resolve);
        } else {
            client.authorize().then(resolve);
        }
    }).then(() => {
        client.connect().then(() => {
            client.join(`#${win.data.userSettings.data.twitch.username}`);
        });
    });
});

//                    ##          #     #     #                             ##                   #  
//                   #  #         #     #                                    #                   #  
//  ###  ###   ###    #     ##   ###   ###   ##    ###    ###   ###          #     ##    ###   ###  
// #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##            #    #  #  #  #  #  #  
// # ##  #  #  #  #  #  #  ##     #     #     #    #  #   ##     ##    ##    #    #  #  # ##  #  #  
//  # #  ###   ###    ##    ##     ##    ##  ###   #  #  #     ###     ##   ###    ##    # #   ###  
//       #     #                                          ###                                       
win.data.appSettings.load().then(() => {
    if (!win.data.appSettings.data.chat) {
        win.data.appSettings.data.chat = {
            font: {
                face: "",
                size: 14
            },
            colors: {
                chat: {
                    foreground: "#000000",
                    background: "#ffffff",
                    info: "#0080ff",
                    join: "#333333",
                    part: "#333333",
                    highlight: "#ff0000"
                },
                input: {
                    foreground: "#000000",
                    background: "#ffffff"
                },
                userList: {
                    foreground: "#000000",
                    background: "#ffffff"
                }
            }
        };
    }

    settingsChanged();
});

//                    ##          #     #     #                                                                           #  
//                   #  #         #     #                                                                                 #  
//  ###  ###   ###    #     ##   ###   ###   ##    ###    ###   ###          ##   ###          ###    ###  # #    ##    ###  
// #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##           #  #  #  #        ##     #  #  # #   # ##  #  #  
// # ##  #  #  #  #  #  #  ##     #     #     #    #  #   ##     ##         #  #  #  #          ##   # ##  # #   ##    #  #  
//  # #  ###   ###    ##    ##     ##    ##  ###   #  #  #     ###           ##   #  #        ###     # #   #     ##    ###  
//       #     #                                          ###                                                                
win.data.appSettings.on("saved", () => {
    settingsChanged();
});

//        #                                                     ##          #     #     #                                          #    
//                                                             #  #         #     #                                                #    
// #  #  ##    ###          ##   ###          ###  ###   ###    #     ##   ###   ###   ##    ###    ###   ###          ###   ##   ###   
// #  #   #    #  #        #  #  #  #        #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     ####  #  #  # ##   #    
// ####   #    #  #        #  #  #  #        # ##  #  #  #  #  #  #  ##     #     #     #    #  #   ##     ##          ##   ##     #    
// ####  ###   #  #         ##   #  #         # #  ###   ###    ##    ##     ##    ##  ###   #  #  #     ###          #      ##     ##  
//                                                 #     #                                          ###                ###              
win.on("appSettings-get", (remoteWin) => {
    remoteWin.emit("appSettings-get-response", win.data.appSettings.data);
});

//        #                                                     ##          #     #     #                                           #    
//                                                             #  #         #     #                                                 #    
// #  #  ##    ###          ##   ###          ###  ###   ###    #     ##   ###   ###   ##    ###    ###   ###          ###    ##   ###   
// #  #   #    #  #        #  #  #  #        #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     ####  ##     # ##   #    
// ####   #    #  #        #  #  #  #        # ##  #  #  #  #  #  #  ##     #     #     #    #  #   ##     ##           ##   ##     #    
// ####  ###   #  #         ##   #  #         # #  ###   ###    ##    ##     ##    ##  ###   #  #  #     ###          ###     ##     ##  
//                                                 #     #                                          ###                                  
win.on("appSettings-set", (newAppSettings) => {
    console.log(newAppSettings);
    win.data.appSettings.data.chat = newAppSettings.chat;
    win.data.appSettings.save();
});

//    #       #       #                                             #      #                                     #        
//   ###     #        #                                             #       #                                    #        
//  # #     #      ## #   ###    ###   #   #  ## #    ###   # ##   ####      #          # ##    ###    ###    ## #  #   # 
//   ###    #     #  ##  #   #  #   #  #   #  # # #  #   #  ##  #   #        #          ##  #  #   #      #  #  ##  #   # 
//    # #   #     #   #  #   #  #      #   #  # # #  #####  #   #   #        #          #      #####   ####  #   #  #  ## 
//   ###     #    #  ##  #   #  #   #  #  ##  # # #  #      #   #   #  #    #      #    #      #      #   #  #  ##   ## # 
//    #       #    ## #   ###    ###    ## #  #   #   ###   #   #    ##    #      ###   #       ###    ####   ## #      # 
//                                                                                 #                                #   # 
//                                                                                                                   ###  
$(document).ready(() => {
    var $inputbox = $("#inputbox"),
        patterns = {
            join: /^\/join #?([a-z0-9_]+)$/i,
            part: /^\/part$/i
        };

    //        #                       #    #                                         #                                                 
    //  # #                           #    #                                         #                                                 
    // ##### ##    ###   ###   #  #  ###   ###    ##   #  #         ##   ###         # #    ##   #  #  ###   ###    ##    ###    ###   
    //  # #   #    #  #  #  #  #  #   #    #  #  #  #   ##         #  #  #  #        ##    # ##  #  #  #  #  #  #  # ##  ##     ##     
    // #####  #    #  #  #  #  #  #   #    #  #  #  #   ##         #  #  #  #        # #   ##     # #  #  #  #     ##      ##     ##   
    //  # #  ###   #  #  ###    ###    ##  ###    ##   #  #         ##   #  #        #  #   ##     #   ###   #      ##   ###    ###    
    //                   #                                                                        #    #                               
    // Setup input box resizing
    $inputbox.on("keypress", (ev) => {
        if (ev.keyCode === 13 && client.connected) {
            let input = $inputbox.val(),
                matches;

            if (matches = patterns.join.exec(input)) {
                let channel = matches[1].toLowerCase();
                client.join(`#${channel}`);
            } else if (matches = patterns.part.exec(input)) {
                client.part($("#channels li.active").text());
            } else {
                client.send($("#channels li.active").text(), $inputbox.val());
            }

            $inputbox.val("");
            
            ev.preventDefault();
            return false;
        }
    });

    $inputbox.on("change", () => setSize($inputbox));
    $inputbox.on("cut", () => setSize($inputbox));
    $inputbox.on("paste", () => setSize($inputbox));
    $inputbox.on("drop", () => setSize($inputbox));
    $inputbox.on("keydown", () => setSize($inputbox));
    $inputbox.on("keyup", () => setSize($inputbox));

    //             #                             ##                                         ##     #          #     
    //  # #        #                              #                                          #                #     
    // #####  ##   ###    ###  ###   ###    ##    #     ###          ##   ###          ##    #    ##     ##   # #   
    //  # #  #     #  #  #  #  #  #  #  #  # ##   #    ##           #  #  #  #        #      #     #    #     ##    
    // ##### #     #  #  # ##  #  #  #  #  ##     #      ##         #  #  #  #        #      #     #    #     # #   
    //  # #   ##   #  #   # #  #  #  #  #   ##   ###   ###           ##   #  #         ##   ###   ###    ##   #  #  
    // Setup channel tabs.
    $("#channels").on("click", "a", (ev) => {
        ev.preventDefault();
        $(this).tab("show");
    });

    //          #   #                 ##                                                                          #                    
    //  # #     #                      #                                                                          #                    
    // #####  ###  ##     ###   ###    #     ###  #  #         ##   ###         # #    ##   #  #   ###    ##    ###   ##   #  #  ###   
    //  # #  #  #   #    ##     #  #   #    #  #  #  #        #  #  #  #        ####  #  #  #  #  ##     # ##  #  #  #  #  #  #  #  #  
    // ##### #  #   #      ##   #  #   #    # ##   # #        #  #  #  #        #  #  #  #  #  #    ##   ##    #  #  #  #  ####  #  #  
    //  # #   ###  ###   ###    ###   ###    # #    #          ##   #  #        #  #   ##    ###  ###     ##    ###   ##   ####  #  #  
    //                          #                  #                                                                                   
    // Setup user list divider.
    $("#display").on("mousedown", "div.divider", (ev) => {
        var pageX = ev.pageX,
            $users = $(ev.target).next("div.users"),
            width = $users.width();
        
        $("#display").on("mousemove", (ev) => {
            width += pageX - ev.pageX;
            $users.width(width);
            pageX = ev.pageX;
        });
        $("#display").on("mouseup", () => {
            $("#display").off("mousemove");
        });

        ev.preventDefault();
    });
});
