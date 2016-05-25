var map;
var infowindow;

function init() {
  initMap();
}

// This function initializes the Google Map
function initMap() {
  // Parameters
  init_zoom_desktop = 14;
  init_zoom_mobile = 13;
  init_latlng = {"lat": 40.443, "lng": -79.99};

  // Set Google map style
  var styleArray = [
    {
      featureType: "all",
      stylers: [
        {saturation: -80}
      ]
    }, {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [
        {hue: "#00ffee"},
        {saturation: 50}
      ]
    }, {
      featureType: "poi.business",
      elementType: "labels",
      stylers: [
        {visibility: "off"}
      ]
    }
  ];

  // Set Google map
  map = new google.maps.Map(document.getElementById("map"), {
    center: init_latlng,
    styles: styleArray,
    zoom: isMobile() ? init_zoom_mobile : init_zoom_desktop,
    disableDefaultUI: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  // Set customized map controls
  $("#home-btn").button().on("click", function() {
    map.setCenter(init_latlng);
    map.setZoom(isMobile() ? init_zoom_mobile : init_zoom_desktop);
  });

  // Set information window
  infowindow = new google.maps.InfoWindow();

  // Get smell reports
  var timezone_offset = new Date().getTimezoneOffset();
  var api_url = "http://api.smellpittsburgh.org/api/v1/smell_reports?"
  var api_paras = "aggregate=created_at&timezone_offset=" + timezone_offset + "&start_time=1462060800&end_time=1464652800";
  //var api_paras = "aggregate=created_at&start_time=1462060800&end_time=1464652800";
  $.ajax({
    url: api_url + api_paras,
    success: function(report) {
      drawSmellReports(report);
      drawTimeline(report);
    },
    error: function(response) {
      console.log("server error:", response);
    }
  });
}

function drawSmellReports(report) {
  var color = ["00ff00", "f8e540", "da8800", "99004C", "7a003c"]
  for (var k = 0; k < report.length; k++) {
    var report_k = report[k];
    if (report_k.length == 0) {
      continue;
    }
    for (var i = 0; i < report_k.length; i++) {
      var report_i = report_k[i];
      // Add marker
      var marker = new google.maps.Marker({
        position: {"lat": report_i.latitude, "lng": report_i.longitude},
        map: map,
        content: '<b>Date:</b> ' + report_i.created_at + '<br>'
        + '<b>Smell Value:</b> ' + report_i.smell_value + '<br>'
        + '<b>Feelings Symptoms:</b> ' + report_i.feelings_symptoms + '<br>'
        + '<b>Smell Description:</b> ' + report_i.smell_description,
        // TODO: save images, do not use 3rd-party api
        icon: "http://www.googlemapsmarkers.com/v1/" + color[report_i.smell_value - 1]
      });
      // Add marker event
      marker.addListener("click", function() {
        map.panTo(this.getPosition());
        infowindow.setContent(this.content);
        infowindow.open(map, this);
      });
    }
  }
}

function drawTimeline(report) {
  var $index = $("#timeline-index");
  var $date = $("#timeline-date");
  var is_first_date = true;
  for (var k = 0; k < report.length; k++) {
    var report_k = report[k];
    if (report_k.length == 0) {
      continue;
    }
    var opacity = Math.tanh(report_k.length / 10);
    $index.append($('<td style="opacity: ' + opacity + '"></td>'));
    var date = new Date(report_k[0].created_at);
    var date_str = date.toDateString();
    var date_str_seg = date_str.split(" ");
    if (is_first_date) {
      is_first_date = false;
    } else {
      date_str_seg[1] = "";
    }
    $date.append($('<td>' + date_str_seg[1] + " " + date_str_seg[2] + '</td>'));
  }
}

function isMobile() {
  var useragent = navigator.userAgent;
  return useragent.indexOf("iPhone") != -1 || useragent.indexOf("Android") != -1;
}

$(document).on("pageinit", init);