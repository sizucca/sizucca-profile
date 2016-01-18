var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-ruby-sass');
var cssmin      = require('gulp-cssmin');
var plumber     = require('gulp-plumber');
var jade        = require('gulp-jade');

gulp.task('default', ['browser-sync'], function(){
  gulp.watch('./src/scss/**/*.scss', ['sass']);
  gulp.watch('./src/jade/**/*.jade', ['jade']);
  gulp.watch("./public/*.html",            ['bs-reload']);
  gulp.watch("./public/stylesheets/*.css", ['bs-reload']);
  gulp.watch("./public/javascripts/*.js",  ['bs-reload']);
});

gulp.task('browser-sync', function(){
  browserSync({
    server: {
      baseDir: "./public/",
      index  : "index.html"
    }
  });
});

gulp.task('bs-reload', function(){
  browserSync.reload();
});

gulp.task('sass', function(){
  return sass('./src/scss/**/*.scss', {
    style: 'expanded',
    bundleExec: true
  })
  .pipe(plumber())
  .pipe(cssmin())
  .pipe(gulp.dest('./public/stylesheets/'));
});

gulp.task('jade', function (){
  gulp.src(['./src/jade/**/*.jade', '!./src/jade/**/_*.jade'], {
    base: './src/jade'
  })
  .pipe(jade({
    pretty: true
  }))
  .pipe(gulp.dest('./public/'));
});
