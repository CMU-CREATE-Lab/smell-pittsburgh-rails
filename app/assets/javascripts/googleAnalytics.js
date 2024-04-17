var tag_id = isOriginStaging() ? 'G-R2L5VQ0EGQ' : 'G-4ZSSXKMWSS';
var session_id = new Date().getTime() + '.' + Math.random().toString(36).substring(5);
var client_id;
var user_id;
// These are parameter names obtained from the 'Custom definitions' section of the GA dashboard.
var gtagCustomParamMapping = {
  'ua_dimension_1': 'userId',
  'ua_dimension_2': 'clientId',
  'ua_dimension_3': 'sessionId',
  'ua_dimension_4': 'hitTimestamp',
  'ua_dimension_5': 'dataTimestamp',
  'ua_dimension_6': 'esdrFeedId',
  'ua_metric_1': 'smellValue',
  'ua_metric_2': 'pm25'
};
var isGtagInitialized = false;
var gtag;

// Initialize Tag
(function() {
  var head = document.getElementsByTagName("head")[0];
  var scriptTag = document.createElement('script');
  scriptTag.setAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=' + tag_id);
  scriptTag.onload = async function() {
    window.dataLayer = window.dataLayer || [];

    gtag = function(){ dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', tag_id, {
      'send_page_view': false,
      'custom_map': gtagCustomParamMapping
    });

    // Get user ID to send with every hit
    var search = parseSearch();
    if(typeof search["user_hash"] !== "undefined") {
      user_id = search["user_hash"];
    }

    // Get client ID to send with every hit
    client_id = await new Promise(resolve => {
      gtag('get', tag_id, 'client_id', resolve)
    });

    // We generate our own session_id, but here is
    // how we can get it from gtag.
    /*session_id = await new Promise(resolve => {
      gtag('get', tag_id, 'session_id', resolve)
    });*/


    // The initial 'config' call above by default sends a page view, but we tell it not to
    // with 'send_page_view' set to false. We instead manually send our own page event,
    // so that we can include the extra parameters we want.

    // Make sure to do this last, so that we have access to the client_id/user_id/etc
    // Also, there does not seem to be a good way to determine when gtag is ready, so we track it
    // ourselves, based on other things we want run beforehand above.
    gtag('event', 'page_view', verifyGoogleAnalyticsParams({"hitTimestamp": Date.now().toString()}));
    isGtagInitialized = true;
  }
  head.insertBefore(scriptTag, head.children[1]);
})();

// This function parses the search query string in the url
function parseSearch() {
  var re = /\??(.*?)=([^\&]*)&?/gi;
  var search = {}
  var match;
  while (match = re.exec(document.location.search)) {
    search[match[1]] = match[2];
  }
  return search;
}

// This function is used for adding Google Analytic events
function addGoogleAnalyticEvent(category, action, label) {
  if (isGtagInitialized) {
    var labels = verifyGoogleAnalyticsParams(label);
    var params = Object.assign({}, {'event_category' : category}, labels);
    // In gtag, the second param is 'eventName', which is required and if not overridden
    // in the parameters object (via 'event_action' param), will be used as the event's action.
    gtag('event', action, params);
  }
};

// This function check if all custom dimensions and metrics are reported
// so that all reports can be shown on google analytics
function verifyGoogleAnalyticsParams(label) {
  var num_of_dimensions = 6;
  var num_of_metrics = 2;
  label["userId"] = user_id;
  label["clientId"] = client_id;
  label["sessionId"] = session_id;
  label["hitTimestamp"] = Date.now().toString();

  // TODO (20230630): Not sure if it is necessary anymore (or ever was) to set missing
  // dimensions to 'undefined' and metrics to -1.  For now, we keep same behavior but
  // change the logic to handle the mapping gtag now requires.

  // These values are the keys of our label object
  gtagCustomParamMappingValues = Object.values(gtagCustomParamMapping);
  // These keys are indicate whether a dimension or metric
  gtagCustomParamMappingKeys = Object.keys(gtagCustomParamMapping);

  gtagCustomParamMappingValues.forEach(function(labelKey) {
    if (typeof label[labelKey] === "undefined") {
      var tmp = gtagCustomParamMappingKeys.find(key => gtagCustomParamMapping[key] === labelKey);
      if (tmp.indexOf("dimension") >= 0) {
        label[labelKey] = "undefined";
      } else if (tmp.indexOf("metric") >= 0) {
        label[labelKey] = -1;
      }
    }
  });

  return label;
}
