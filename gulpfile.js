"use strict";

/*
    This gulpfile is an "outer" gulpfile that manages starting docker containers and watching/rebuilding files for dev purposes
    
    
```bash
gulp dev # prepares the dev environment
```

*/

require('es6-shim');

var spawn = require('child_process').spawn;
var fs = require("fs");
var path = require('path'); 
var join = path.join;

var gulp = require('gulp');
var browserify = require('browserify');
var source = require("vinyl-source-stream");



function bundleShare(b, name) {
    b.bundle()
        .pipe(source( join('.', 'api', 'clients', name+'-browserify-bundle.js') ) )
        .pipe(gulp.dest('.'))
        .on('error', function (err) {
            console.error('bundleShare error', err.message);
        });
}

function browserifyShare(name){
    var b = browserify({
        cache: {},
        packageCache: {},
        fullPaths: true
    });
    
    b.add( join('.', 'api', 'clients', name, 'src', 'main.js') );
    bundleShare(b, name);
}




gulp.task('build-dashboard', function(){
    browserifyShare('Dashboard');
});

gulp.task('build-admin', function(){
    browserifyShare('Admin');
});



gulp.task('watch-dashboard', function() {
    console.log('Watching dashboard');
    
    var dashboardWatcher = gulp.watch('./api/clients/Dashboard/src/**', ['build-dashboard']);
    dashboardWatcher.on('change', function(event) {
        console.log('** Dashboard ** File ' + path.relative(__dirname, event.path) + ' was ' + event.type);
    });
});

gulp.task('watch-admin', function() {
    console.log('Watching admin');

    var adminWatcher = gulp.watch('./api/clients/Admin/src/**', ['build-admin']);
    adminWatcher.on('change', function(event) {
        console.log('** Admin ** File ' + path.relative(__dirname, event.path) + ' was ' + event.type);
    });
});


var dockerComposeProcess;
gulp.task('start-containers-dev', function(){
    dockerComposeProcess = spawn('docker-compose', ['-f', 'compose-dev.yml', 'up'], {stdio: 'inherit'});
});

gulp.task('watch', ['watch-dashboard', 'watch-admin']);

/*
    Top-level tasks
*/

gulp.task('dev', ['start-containers-dev', 'watch']);

gulp.task('prod', function(){
    spawn('docker-compose', ['-f', 'compose-prod.yml', 'up', '-d'], {stdio: 'inherit'});
});

gulp.task('init-db-dev', function(){
    spawn('docker-compose', ['-f', 'compose-init-db-dev.yml', 'up'], {stdio: 'inherit'});
});

gulp.task('init-db-prod', function(){
    spawn('docker-compose', ['-f', 'compose-init-db-prod.yml', 'up'], {stdio: 'inherit'});
});



