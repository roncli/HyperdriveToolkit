JSON.tryParse = (str) => {
    var initialStr = str;
    return new Promise((resolve, reject) => {
        if (!str || str.length === 0) {
            reject();
        };
        str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, '');
        if ((/^[\],:{}\s]*$/).test(str)) {
            resolve(JSON.parse(initialStr));
        } else {
            reject();
        }
    });
};
