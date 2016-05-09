/*eslint-disable prefer-template*/
/*eslint-disable no-console*/
'use strict';

const gift = require('gift');
const _ = require('lodash');
const gutil = require('gulp-util');
const path = require('path');
const streamfilter = require('streamfilter');

const AVAILABLE_TYPES = [ 'A', 'M', 'D', 'AM', 'MM', 'AD', 'MD', 'N' ];

const compileOptions = (options) => {
  options = _.extend({
    enabled: true,
    repoPath: process.cwd(),
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

  return options;
};

const getStatusFiles = (options) =>
  new Promise((resolve, reject) => {
    const repo = gift(options.repoPath);

    repo.status((err, status) => {
      if (err) {
        reject(err);
        return;
      }

      const all = _.map(status.files, (props, filePath) => ({
        path: path.join(options.repoPath, filePath),
        type: props.type ? props.type.toUpperCase() : 'N',
        staged: Boolean(props.staged),
        tracked: Boolean(props.tracked)
      }));
      const dirs = all.filter((file) => /\/$/.test(file.path));
      const files = all.filter((file) => !/\/$/.test(file.path));

      resolve({ all, dirs, files });
    });
  });

const lazyInitiator = (constructor) => {
  let value = null;

  return (...args) => {
    if (value) {
      return value;
    }

    value = constructor(...args);

    return value;
  }
};

const filterStatusFiles = (files, options) =>
  files.filter((file) =>
    _.includes(options.tracked, file.tracked)
    &&
    _.includes(options.staged, file.staged)
    &&
    _.includes(options.type, file.type)
  );

module.exports = (options) => {
  options = compileOptions(options);

  const gitStatus = lazyInitiator(() =>
    getStatusFiles(options)
      .then((status) => filterStatusFiles(status.files, options))
      .then((files) => _.map(files, 'path'))
  );

  return streamfilter((file, encoding, needToSkipFromStream) => {
    if (!options.enabled) {
      needToSkipFromStream(false);
      return;
    }

    gitStatus().then((statusFiles) => {
      needToSkipFromStream(_.indexOf(statusFiles, file.path) === -1);
    });
  }, {
    objectMode: true,
    passthrough: options.passthough !== false,
    restore: options.restore
  });
};
