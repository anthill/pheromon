'use strict';

casper.test.begin('Title test', 1, function suite(test) {
    casper.start("http://pheromon:4000/admin", function() {
        test.assertTitle("Ants - Pheromon Admin", "Title is the one expected");
    });

    casper.run(function() {
        test.done();
    });
});