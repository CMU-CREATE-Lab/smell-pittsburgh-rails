// Adding analytics.js
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

/******** Disable real tracking now for debugging, need to fill out the XX **********/
var tracker_id = isOriginStaging() ? 'UA-84745384-1' : '';

// Initialize Tracker
ga('create', tracker_id, 'auto');
ga(function(tracker) {
    // Send user ID with every hit
    var search = parseSearch();
    if(typeof search["user_hash"] !== "undefined") {
      ga('set', 'dimension1', search["user_hash"]);
    }
    // Send client ID with every hit
    ga('set', 'dimension2', tracker.get('clientId'));
    // Send session ID with every hit
    ga('set', 'dimension3', new Date().getTime() + '.' + Math.random().toString(36).substring(5));
    ga('send', 'pageview');
});

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
  if ( typeof (ga) != "undefined") {
    ga('send', 'event', category, action, label);
  }
};
