'use strict';

/*
    This gulpfile is an 'outer' gulpfile that manages starting docker containers and watching/rebuilding files for dev purposes
    
    
```bash
gulp dev # prepares the dev environment
```

*/

require('es6-shim');

var spawn = require('child_process').spawn;
var path = require('path'); 
var join = path.join;

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');



function bundleShare(b, name) {
    return new Promise(function(resolve, reject){
        b.bundle()
        .pipe(source( join('.', 'api', 'clients', name+'-browserify-bundle.js') ) )
        .pipe(gulp.dest('.'))
        .on('error', function (err) {
            console.error('bundleShare error', err.message);
            reject(err);
        })
        .on('end', function(){
            resolve();
        });
    });
}

function browserifyShare(name){
    var b = browserify({
        cache: {},
        packageCache: {},
        fullPaths: true
    });
    
    b.add( join('.', 'api', 'clients', name, 'src', 'main.js') );
    return bundleShare(b, name);
}




gulp.task('build-dashboard', function(){
    return browserifyShare('Dashboard');
});

gulp.task('build-admin', function(){
    return browserifyShare('Admin');
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

gulp.task('watch-tools', function() {
    console.log('Watching tools');

    var toolsWatcher = gulp.watch('./tools/**', ['build-admin', 'build-dashboard']);
    toolsWatcher.on('change', function(event) {
        console.log('** Tool ** File ' + path.relative(__dirname, event.path) + ' was ' + event.type);
    });
});

gulp.task('watch', ['watch-dashboard', 'watch-admin', 'watch-tools']);
gulp.task('build', ['build-dashboard', 'build-admin']);

gulp.task('start-containers-dev', ['build'], function(){
    spawn('docker-compose', ['-f', 'compose-dev.yml', 'up', '--force-recreate'], {stdio: 'inherit'});
});

gulp.task('start-containers-prod', ['build'], function(){
    spawn('docker-compose', ['-f', 'compose-prod.yml', 'up', '-d', '--force-recreate'], {stdio: 'inherit'});
});

/*
    Top-level tasks
*/

gulp.task('dev', ['start-containers-dev', 'watch']);
gulp.task('prod', ['start-containers-prod']);


gulp.task('init-db-dev', function(){
    spawn('docker-compose', ['-f', 'compose-init-db-dev.yml', 'up', '--force-recreate'], {stdio: 'inherit'});
});

gulp.task('init-db-prod', function(){
    spawn('docker-compose', ['-f', 'compose-init-db-prod.yml', 'up', '--force-recreate'], {stdio: 'inherit'});
});



