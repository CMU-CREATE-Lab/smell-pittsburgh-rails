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