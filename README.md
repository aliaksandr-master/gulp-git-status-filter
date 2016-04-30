[![npm](http://img.shields.io/npm/v/gulp-git-status-filter.svg?style=flat-square)](https://www.npmjs.com/package/gulp-git-status-filter)
![npm](http://img.shields.io/npm/l/gulp-git-status-filter.svg?style=flat-square)
[![Dependency Status](https://david-dm.org/aliaksandr-pasynkau/gulp-git-status-filter.svg?style=flat-square)](https://david-dm.org/aliaksandr-pasynkau/gulp-git-status-filter)
[![devDependency Status](https://david-dm.org/aliaksandr-pasynkau/gulp-git-status-filter/dev-status.svg?style=flat-square)](https://david-dm.org/aliaksandr-pasynkau/gulp-git-status-filter#info=devDependencies)

# gulp-git-status-filter
Filter files by git status

## Getting started 

To install `gulp-git-status-filter` from npm, run:
```shell
npm install gulp-git-status-filter --save
```

## Use the library:

```js
const gulpGitStatusFilter = require('gulp-git-status-filter');

const filter = gulpGitStatusFilter(options);
```

```js
const gulpGitStatusFilter = require('gulp-git-status-filter');

const filterOnlyNewUnTrackedUnStagedFiles = gulpGitStatusFilter({ type: [ 'N' ] });

gulp.task('lint', () => {
  return gulp.src('**/*')
    .pipe(filterOnlyNewUnTrackedUnStagedFiles)
    .pipe(gulpESLint())
    .pipe(filterOnlyNewUnTrackedUnStagedFiles.restore)
    .pipe(doSomething())
});

// do something helpful
```

## Options

### options.enabled
Type `Boolean`, Default `true`

If `options.enabled` eq `false` - filter disabled, all files will pass through

### options.repoPath
Type `String`, Default `undefined`

Absolute path to repository

### options.passthough
Type `Boolean`, Default `true`

When set to `true` filtered files are restored with a PassThrough stream, otherwise, when set to `false`, filtered files are restored as a Readable stream.
When the stream is Readable it ends by itself, but when PassThrough, you are responsible of ending the stream.

### options.restore
Type `Boolean`, Default `false`

Restore filtered files

### options.type
Type `Array|String`, Default `[ 'A', 'M', 'D', 'AM', 'MM', 'AD', 'MD', 'N' ]`

Each file has the following properties:

| _type_   | index     | working tree |
| :---     | :-------: | :-----------:|
| `A `     | added     | -            |
| `M `     | modified  | -            |
| `D `     | deleted   | -            |
| `AM`     | added     | modified     |
| `MM`     | modified  | modified     |
| `AD`     | staged    | deleted      |
| `MD`     | modified  | deleted      |

`N` - new files without tracking and staging

### options.tracked
Type `Array|Boolean`, Default `[ true, false ]`

### options.staged
Type `Array|Boolean`, Default `[ true, false ]`

### Enjoy!

## Support
If you have any problems, you cached a bug, or you have any suggestion - please [find an existing issue or create new](https://github.com/aliaksandr-pasynkau/gulp-git-status-filter/issues)

## Contributing
If you want to develop this library do not be shy - Do that! [How to contribute open-source projects](https://guides.github.com/activities/contributing-to-open-source/)
