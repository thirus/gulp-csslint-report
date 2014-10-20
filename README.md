gulp-csslint-report
===================

> Generates HTML report from the csslint results

## Usage

First, do a install `gulp-csslint` as a development dependency:

```
npm install --save-dev gulp-csslint
```

Then, add it to your gulpfile.js:

```
var csslint = require('gulp-csslint');
var htmlReporter = require('gulp-csslint-report');

gulp.task('css', function() {
  gulp.src('client/css/*.css')
    .pipe(csslint())
    .pipe(htmlReporter());
});
```

## API

### htmlReporter(options)

Type: `Object`

You can pass the output filename (consolidated report) and individual css file reports location directory.

```javascript
gulp.src('client/css/*.css')
  .pipe(csslint())
  .pipe(reporter({'filename': 'consolidated-csslint-report.html', 'directory': './csslint-reports/'}));
```

Defaults are: {'filename': 'csslint-report.html', 'directory': './logs/'}
