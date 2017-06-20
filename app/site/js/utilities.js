//  #   #   #       #     ##      #     #       #                 
//  #   #   #              #            #                         
//  #   #  ####    ##      #     ##    ####    ##     ###    ###  
//  #   #   #       #      #      #     #       #    #   #  #     
//  #   #   #       #      #      #     #       #    #####   ###  
//  #   #   #  #    #      #      #     #  #    #    #          # 
//   ###     ##    ###    ###    ###     ##    ###    ###   ####  
class Utilities {
    //       #                              ##                 
    //       #                             #  #                
    //  ##   ###    ###  ###    ###   ##   #      ###    ###   
    // #     #  #  #  #  #  #  #  #  # ##  #     ##     ##     
    // #     #  #  # ##  #  #   ##   ##    #  #    ##     ##   
    //  ##   #  #   # #  #  #  #      ##    ##   ###    ###    
    //                          ###                            
    // Based on http://stackoverflow.com/a/19826393/214137
    static changeCss(cssName, cssValue, $) {
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
    }

}

module.exports = Utilities;
