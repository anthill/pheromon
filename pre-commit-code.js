"use strict";

var CLIEngine = require('eslint').CLIEngine;
// 'git ls-files -om --exclude-standard' to list all files that were changed then filter out non-JS files

// process.chdir(__dirname);

var cli = new CLIEngine();

console.log('is ignored', cli.isPathIgnored("node_modules/**"));

var report = cli.executeOnFiles(["./"]);

var formatter = cli.getFormatter();

/*
 * Wait for the stdout buffer to drain.
 * See https://github.com/eslint/eslint/issues/317
 */
process.on("exit", function() {
	// output to console
	console.log('hey', formatter(report.results));
    // process.exit();
});
