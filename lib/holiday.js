/**
 * @function checkHoliday - Takes a JavaScript Date object or string,
 * and checks to see if it is one of the 11 standard holidays.
 *
 * @param {Date|string} dtDate - The date to check. Either a JavaScript
 * Date object, or a string in the format YYYY-MM-DD.
 *
 * @returns {boolean} - true if passed-in date is a holiday, false if
 * not.
 *
 * @reference - https://www.softcomplex.com/forum/viewthread_2814/
 */
function checkHoliday (dtDate) {
  // Accept either JavaScript Date, or Date-acceptable string
  if (typeof dtDate === 'string' || dtDate instanceof String) {
    var dateFields = dtDate.split(/[-]+/);
    var dtDate = new Date(parseInt(dateFields[0], 10), parseInt(dateFields[1], 10) - 1, parseInt(dateFields[2], 10));
  } else if (Object.prototype.toString.call(dtDate) !== '[object Date]') {
    return false;
  }

  // Holidays: Simple (month/date - no leading zeroes)

  var nDate = dtDate.getDate();
  var nMonth = dtDate.getMonth() + 1;
  var sDate1 = nMonth + '/' + nDate;

  if (sDate1 == '1/1' /* New Year's Day */ ||
    sDate1 == '7/4' /* Independence Day */ ||
    sDate1 == '7/24' /* Pioneer Day */ ||
    sDate1 == '12/24' /* Christmas Eve */ ||
    sDate1 == '12/25' /* Christmas Day */

  ) {
    return true;
  }

  // Holdays: Weekday from beginning of the month (month/num/day)

  var nWday = dtDate.getDay();
  var nWnum = Math.floor((nDate - 1) / 7) + 1;
  var sDate2 = nMonth + '/' + nWnum + '/' + nWday;

  if (sDate2 == '1/3/1' /* Birthday of Martin Luther King, third Monday in January */ ||
    sDate2 == '2/3/1' /* President's Day, third Monday in February */ ||
    sDate2 == '9/1/1' /* Labor Day, first Monday in September */ ||
    sDate2 == '11/4/4' /* Thanksgiving Day, fourth Thursday in November */ ||
    sDate2 == '11/4/5' /* Black Friday, fourth Friday in November */
  ) {
    return true;
  }

  // Holidays: Weekday number from end of the month (month/num/day)

  var dtTemp = new Date (dtDate);
  dtTemp.setDate(1);
  dtTemp.setMonth(dtTemp.getMonth() + 1);
  dtTemp.setDate(dtTemp.getDate() - 1);
  nWnum = Math.floor((dtTemp.getDate() - nDate - 1) / 7) + 1;

  var sDate3 = nMonth + '/' + nWnum + '/' + nWday;

  if (sDate3 == '5/1/1'  // Memorial Day, last Monday in May
  ) {
    return true;
  }

  // Date does match checked holidays
  return false;
}

module.exports = checkHoliday;