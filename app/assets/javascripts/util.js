function isOriginStaging() {
  var url_hostname = window.location.origin;
  if (url_hostname.indexOf("api.smellpittsburgh") >= 0) {
    return true;
  } else {
    return false;
  }
}
