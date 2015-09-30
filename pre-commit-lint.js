'use strict';

var CLIEngine = require('eslint').CLIEngine;
// 'git ls-files -om --exclude-standard' to list all files that were changed then filter out non-JS files

// process.chdir(__dirname);

var cli = new CLIEngine();

var report = cli.executeOnFiles(['./']);

var formatter = cli.getFormatter();

/*
 * Wait for the stdout buffer to drain.
 * See https://github.com/eslint/eslint/issues/317
 */
process.on('error', function() {
	// output to console
	console.log('Lint report', formatter(report.results));
	process.exit();
});

process.on('exit', function() {
	// output to console
	console.log('Lint report', formatter(report.results));
});

// "use strict";

// var eslint = require('eslint');
// // 'git ls-files -om --exclude-standard' to list all files that were changed then filter out non-JS files

// process.chdir(__dirname);

// var exitCode = eslint.cli.execute("./");

// /*
//  * Wait for the stdout buffer to drain.
//  * See https://github.com/eslint/eslint/issues/317
//  */
// process.on("exit", function() {
//     process.exit(exitCode);
// });