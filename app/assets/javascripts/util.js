function isOriginStaging() {
  var url_hostname = window.location.hostname;
  if (url_hostname.indexOf("api.smellpittsburgh") > 0) {
    return true;
  } else {
    return false;
  }
}

function roundTo(val, n) {
  var d = Math.pow(10, n);
  return Math.round(parseFloat(val) * d) / d;
}
