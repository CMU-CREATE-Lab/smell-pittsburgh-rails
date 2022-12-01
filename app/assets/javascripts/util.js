function isOriginStaging() {
  var url_hostname = window.location.hostname;
  var index = url_hostname.indexOf("api.smellpittsburgh");
  if (index == 0) {
    return false;
  } else {
    // This includes all development environments (staging or localhost)
    return true;
  }
}

function roundTo(val, n) {
  var d = Math.pow(10, n);
  return Math.round(parseFloat(val) * d) / d;
}

function dateStringToObject(str) {
  var str_split = str.split("-");
  var year = parseInt(str_split[0]);
  var month = parseInt(str_split[1]);
  var day = parseInt(str_split[2]);
  return new Date(year, month - 1, day);
}

function dataObjectToString(date_obj) {
  var year = date_obj.getFullYear();
  var month = date_obj.getMonth() + 1;
  var day = date_obj.getDate();
  return year + "-" + month + "-" + day;
}

function isMobile() {
  var useragent = navigator.userAgent;
  return useragent.indexOf("iPhone") != -1 || useragent.indexOf("Android") != -1;
}

function addTouchHorizontalScroll(elem) {
  var scrollStartPos, startTime, endTime, newPos, startTouchX, endTouchX;
  $(elem).on("touchstart", function (e) {
    startTime = new Date().getTime();
    newPos = 0;
    endTouchX = null;
    startTouchX = e.originalEvent.touches[0].pageX;
    scrollStartPos = this.scrollLeft + startTouchX;
    e.preventDefault();
  }).on("touchmove", function (e) {
    endTouchX = e.originalEvent.touches[0].pageX;
    newPos = scrollStartPos - endTouchX;
    this.scrollLeft = newPos;
    e.preventDefault();
  }).on("touchend touchcancel", function (e) {
    // TODO: Flick/swip ability
    //endTime = new Date().getTime();
    //if (endTouchX && endTime - startTime < 100) {
    //  var flickVal = 200 * Math.abs(newPos - scrollStartPos) / (endTime - startTime);
    //  if (endTouchX > startTouchX) flickVal *= -1;
    //  this.scrollLeft = this.scrollLeft + flickVal;
    //}
  });
}

function unique(array) {
  return array.filter(function (item, i, ar) {
    return ar.indexOf(item) === i;
  })
}

// Is dictionary empty
function isDictEmpty(dict) {
  return Object.keys(dict).length === 0;
}

// Get the end day of the current month
function firstDayOfNextMonth(date_obj) {
  return new Date(date_obj.getFullYear(), date_obj.getMonth() + 1, 1);
}

// Get the first day of the previous month
function firstDayOfPreviousMonth(date_obj) {
  return new Date(date_obj.getFullYear(), date_obj.getMonth() - 1, 1);
}

// Get the first day of the current month
function firstDayOfCurrentMonth(date_obj) {
  return new Date(date_obj.getFullYear(), date_obj.getMonth(), 1);
}

// Correct the timestamp based on time zone differences
function correctTimestamp(original_timestamp_in_millisec, reverse, timezone_string) {
  // We need to consider the timezone offset difference between the browser and the US Eastern Time.
  // We want to show the data in Eastern Time (Pittsburgh).
  // But without the timezone offset correction, the data is displayed based on the browser's timezone.
  // For example, when Yen-Chia ran the animation on 7/7/2020 data in Pittsburgh (EST time zone), a lot of smell reports showed up in the morning.
  // But when he is in Taiwan, which is the UTC+8 time zone, a lot of the smell reports showed in the evening instead.
  // This is because there is a 13 hour difference between EST time and Taiwan time.
  var d = new Date(original_timestamp_in_millisec);
  timezone_string = safeGet(timezone_string, "America/New_York"); // default to US Eastern Time
  reverse = safeGet(reverse, false); // reverse offset direction or not
  d = moment.tz(d, timezone_string);

  // Daylight saving is automatically converted in JavaScript
  // We need to check if the browser's user is in a timezone that has daylight saving
  // And also if the original timestamp has daylight saving
  // If they both have or do not have daylight saving, then we are good
  // If one has daylight saving and another one does not have daylight saving, then we need to do extra offset
  // Notice that we only need to do the offset if the browser's user is in a place that enables daylight saving
  var jan_offset = moment({
    M: 0,
    d: 1
  }).utcOffset();
  var jul_offset = moment({
    M: 6,
    d: 1
  }).utcOffset();
  if (jan_offset != jul_offset) { // this means that the browser's user is in a place that enables daylight saving
    var is_browser_timezone_dst = moment().isDST();
    var is_original_timezone_dst = d.isDST();
    if (reverse) {
      if (!is_browser_timezone_dst && is_original_timezone_dst) {
        original_timestamp_in_millisec += 3600000;
      }
      if (is_browser_timezone_dst && !is_original_timezone_dst) {
        original_timestamp_in_millisec -= 3600000;
      }
    } else {
      if (!is_browser_timezone_dst && is_original_timezone_dst) {
        original_timestamp_in_millisec -= 3600000;
      }
      if (is_browser_timezone_dst && !is_original_timezone_dst) {
        original_timestamp_in_millisec += 3600000;
      }
    }
  }

  // Compute the time zone offset difference and make the correction
  var original_timezone_offset_in_min = d.utcOffset();
  var browser_timezone_offset_in_min = moment().utcOffset();
  var diff_timezone_offset_in_min = original_timezone_offset_in_min - browser_timezone_offset_in_min;
  if (reverse) {
    return original_timestamp_in_millisec - diff_timezone_offset_in_min * 60000;
  } else {
    return original_timestamp_in_millisec + diff_timezone_offset_in_min * 60000;
  }
}

// Correct the date object by timezone
function correctDateObj(original_date_obj, reverse, timezone_string) {
  return new Date(correctTimestamp(original_date_obj.getTime(), reverse, timezone_string));
}

// Check if a string yyyy-mm-dd is a valid date
function isValidDate(date_string) {
  var reg_ex = /^\d{4}-\d{2}-\d{2}$/;
  if (!date_string.match(reg_ex)) return false; // invalid format
  var d = new Date(date_string);
  var d_time = d.getTime();
  if (!d_time && d_time !== 0) return false; // NaN value, invalid date
  return d.toISOString().slice(0, 10) === date_string;
}

// Month here is 1-indexed (January is 1, February is 2, etc). This is
// because we are using 0 as the day so that it returns the last day
// of the last month, so you have to add 1 to the month number
// so it returns the correct amount of days
function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// Check if the date object is the current month in the real-world time
function isCurrentMonth(date_obj) {
  var now = new Date();
  if (now.getFullYear() == date_obj.getFullYear() && now.getMonth() == date_obj.getMonth()) {
    return true;
  } else {
    return false;
  }
}