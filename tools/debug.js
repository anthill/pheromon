'use strict';

var DEBUG = process.env.NODE_ENV === 'development';

module.exports = function() {
    if (DEBUG) {
        [].unshift.call(arguments, '[DEBUG Pheromon] ');
        console.log.apply(console, arguments);
    }
};
