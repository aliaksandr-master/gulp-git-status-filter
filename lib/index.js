/*eslint-disable prefer-template*/
/*eslint-disable no-console*/
'use strict';

const gift = require('gift');
const _ = require('lodash');
const gutil = require('gulp-util');
const path = require('path');
const streamfilter = require('streamfilter');

module.exports = (options) => {
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
    if (promise) {
      return promise;
    }

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

        resolve({ all, dirs, files });
      });
    });

    return promise;
  };

  return streamfilter((file, encoding, filterCallback) => {
    if (!options.enabled) {
      filterCallback(false);
      return;
    }

    gitStatus()
      .then((status) => {
        const filePath = path.relative(file.cwd, file.path);
        const gitFile = _.find(status.files, { path: filePath });

        if (!gitFile) {
          filterCallback(true);
          return;
        }

        if (!_.includes(options.type, gitFile.type)) {
          filterCallback(true);
          return;
        }

        if (!_.includes(options.staged, gitFile.staged)) {
          filterCallback(true);
          return;
        }

        if (!_.includes(options.tracked, gitFile.tracked)) {
          filterCallback(true);
          return;
        }

        filterCallback(false);
      })
      .catch((err) => {
        throw err;
      });
  }, {
    objectMode: true,
    passthrough: options.passthough !== false,
    restore: options.restore
  });
};
