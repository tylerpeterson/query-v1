const debug = require('debug')('query-v1');
const utils = require('../lib/utils');

/*
 * Read the stories and tasks for a team's iteration and give some feedback on how sound
 * they were from a process standpoint.
 *
 * CHECK: Well Planned -- That most tasks were written in the first day and a half of the sprint.
 *   Tasks should be planned on the first day of the sprint, up until noon the next day.
 *
 * CHECK: Committed -- That most tasks were marked "Today" before completed.
 *   Tasks should be committed to, publicly, before completed.
 *
 * CHECK: Converted -- That most tasks spent no more than 24 hours in the "Today" status.
 *   Tasks should be a day or smaller, and completed quickly after being committed to.
 *
 */

const teamName = 'TW 1 - Teflon';
const iterationId = 'Timebox:668084';

function report(req, res) {
  res.render('lintSprint', {rows: null});
};

module.exports = report;
