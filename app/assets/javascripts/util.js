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