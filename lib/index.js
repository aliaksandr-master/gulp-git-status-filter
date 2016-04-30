/*eslint-disable prefer-template*/
/*eslint-disable no-console*/
'use strict';

const gift = require('gift');
const _ = require('lodash');
const gutil = require('gulp-util');
const path = require('path');
const streamfilter = require('streamfilter');

module.exports = function (options) {
  const AVAILABLE_TYPES = [ 'A', 'M', 'D', 'AM', 'MM', 'AD', 'MD', 'N' ];

  options = _.extend({
    enabled: true,
    repoPath: undefined,
    passthough: true,
    restore: false,

    type: AVAILABLE_TYPES,
    tracked: [ true, false ],
    staged: [ true, false ]
  }, options);

  /* options.type:                  *
   *--------------------------------*
   * type | index    | working tree *
   *------|----------|--------------*
   * N    | - new    | - new        *
   * A    | added    | -            *
   * M    | modified | -            *
   * D    | deleted  | -            *
   * AM   | added    | modified     *
   * MM   | modified | modified     *
   * AD   | staged   | deleted      *
   * MD   | modified | deleted      *
   *--------------------------------*/

  [ 'type', 'tracked', 'staged' ].forEach((prop) => {
    if (options[prop] == null) {
      options[prop] = [];
      return;
    }

    options[prop] = _.isArray(options[prop]) ? options[prop] : [ options[prop] ];
  });

  options.type = options.type.map((value) => value.toUpperCase());
  options.staged = options.staged.map((value) => Boolean(value));
  options.tracked = options.tracked.map((value) => Boolean(value));

  if (_.difference(options.type, AVAILABLE_TYPES).length) {
    throw new gutil.PluginError('gulp-git-status-filter', 'invalid types given [' + _.difference(options.type, AVAILABLE_TYPES).join(',') + '] , available [' + AVAILABLE_TYPES.join(',') + ']');
  }

  let promise = null;
  const gitStatus = () => {
    if (!promise) {
      promise = new Promise((resolve, reject) => {
          const repo = gift(options.repoPath);

      repo.status((err, status) => {
        if (err) {
          reject(err);
          return;
        }

        const all = _.map(status.files, (props, filePath) => ({
            path: filePath,
            type: props.type ? props.type.toUpperCase() : 'N',
            staged: Boolean(props.staged),
            tracked: Boolean(props.tracked)
          }));
      const dirs = all.filter((file) => /\/$/.test(file.path));
      const files = all.filter((file) => !/\/$/.test(file.path));

      resolve({
        all,
        dirs,
        files,
        allNames: _.pluck(all, 'path'),
        dirNames: _.pluck(dirs, 'path'),
        fileNames: _.pluck(files, 'path')
      });
    });
    });
    }

    return promise;
  };

  return streamfilter((file, encoding, filterCallback) => {
      if (!options.enabled) {
    filterCallback(true);
    return;
  }

  const callback = _.defer((err, result) => {
      if (err) {
        throw err;
      }

      filterCallback(result);
});

  gitStatus()
    .then((status) => {
    const filePath = path.relative(file.cwd, file.path);
  const gitFile = _.find(status.files, { path: filePath });

  if (!gitFile) {
    callback(null, false);
    return;
  }

  if (!_.contains(options.type, gitFile.type)) {
    callback(null, false);
    return;
  }

  if (!_.contains(options.staged, gitFile.staged)) {
    callback(null, false);
    return;
  }

  if (!_.contains(options.tracked, gitFile.tracked)) {
    callback(null, false);
    return;
  }

  callback(null, true);
})
  .catch((err) => callback(err, file));
}, {
    objectMode: true,
      passthrough: options.passthough !== false,
      restore: options.restore
  });
};
