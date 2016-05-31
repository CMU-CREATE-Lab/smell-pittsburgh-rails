var map;
var infowindow;
var smell_reports;
var smell_markers = [];
var smell_color = ["smell_1.png", "smell_2.png", "smell_3.png", "smell_4.png", "smell_5.png"];
var smell_value_text = ["Just fine!", "Barely noticeable", "Definitely noticeable", "It's getting pretty bad", "About as bad as it gets!"];

function init() {
  initMap();

  // Disable vertical bouncing effect on mobile browsers
  $(document).on("scrollstart", function(e) {
    e.preventDefault();
  });
}

// This function initializes the Google Map
function initMap() {
  // Parameters
  init_zoom_desktop = 12;
  init_zoom_mobile = 11;
  init_latlng = {"lat": 40.42, "lng": -79.94};
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
  var api_paras = "aggregate=created_at&timezone_offset=" + timezone_offset + "&start_time=1462075200&end_time=1464753600";
  $.ajax({
    url: api_url + api_paras,
    success: function(data) {
      smell_reports = data;
      drawAllSmellReports();
      drawTimeline();
    },
    error: function(response) {
      console.log("server error:", response);
    }
  });
}

function drawSingleSmellReport(report_i) {
  var latlng = {"lat": report_i.latitude, "lng": report_i.longitude};

  // Add marker
  var date = new Date(report_i.created_at).toLocaleString();
  var smell_value = report_i.smell_value;
  var feelings_symptoms = report_i.feelings_symptoms ? report_i.feelings_symptoms : "no data";
  var smell_description = report_i.smell_description ? report_i.smell_description : "no data";
  var marker = new google.maps.Marker({
    position: latlng,
    map: map,
    content: '<b>Date:</b> ' + date + '<br>'
    + '<b>Smell Value:</b> ' + smell_value + " (" + smell_value_text[smell_value - 1] + ")" + '<br>'
    + '<b>Feelings Symptoms:</b> ' + feelings_symptoms + '<br>'
    + '<b>Smell Description:</b> ' + smell_description,
    icon: {
      url: "/img/" + smell_color[report_i.smell_value - 1],
      size: new google.maps.Size(18, 18),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(9, 9)
    },
    zIndex: report_i.smell_value,
    opacity: 0.7
  });

  // Add marker event
  marker.addListener("click", function() {
    map.panTo(this.getPosition());
    infowindow.setContent(this.content);
    infowindow.open(map, this);
  });

  // Save markers
  smell_markers.push(marker);
}

function drawAllSmellReports() {
  for (var k = 0; k < smell_reports.length; k++) {
    var report_k = smell_reports[k];
    if (report_k.length == 0) {
      continue;
    }
    for (var i = 0; i < report_k.length; i++) {
      drawSingleSmellReport(report_k[i]);
    }
  }
}

function drawSmellReportsByDay(day) {
  var report_k = smell_reports[day];
  for (var i = 0; i < report_k.length; i++) {
    drawSingleSmellReport(report_k[i]);
  }
}

function deleteAllSmellReports() {
  for (var i = 0; i < smell_markers.length; i++) {
    smell_markers[i].setMap(null);
  }
  smell_markers = [];
}

function drawTimeline() {
  var $index = $("#timeline-index");
  var $date = $("#timeline-date");
  var is_first_date = true;
  for (var k = 0; k < smell_reports.length; k++) {
    var report_k = smell_reports[k];
    if (report_k.length == 0) {
      continue;
    }
    var color = Math.round((0.95 - Math.tanh(report_k.length / 10)) * 255);
    var color_str = "rgb(" + color + "," + color + "," + color + ")";
    var date = new Date(report_k[0].created_at);
    var date_str = date.toDateString();
    var date_str_seg = date_str.split(" ");
    if (is_first_date) {
      is_first_date = false;
      // Add the month block and text
      $index.append($('<td id="timeline-td-month"><div class="custom-td-button selected-td-btn"><p id="timeline-month-txt">' + date_str_seg[1] + '</p></div></td>'));
      $date.append($('<td></td>'));
    }
    // Add the day block and text
    $index.append($('<td><div style="background-color: ' + color_str + '" class="custom-td-button" data-day="' + parseInt(date_str_seg[2]) + '"></div></td>'));
    $date.append($('<td>' + date_str_seg[2] + '</td>'));
  }

  // Add clicking events
  $("#timeline-index .custom-td-button").on("click", function() {
    if (!$(this).hasClass("selected-td-btn")) {
      clearTimelineBtnSelection();
      $(this).addClass("selected-td-btn");
      var day = $(this).data("day");
      if (day) {
        deleteAllSmellReports();
        drawSmellReportsByDay(parseInt(day) - 1);
      } else {
        deleteAllSmellReports();
        drawAllSmellReports();
      }
    }
  });
}

function clearTimelineBtnSelection() {
  var $ctb = $("#timeline-index .custom-td-button");
  if ($ctb.hasClass("selected-td-btn")) {
    $ctb.removeClass("selected-td-btn");
  }
}

function isMobile() {
  var useragent = navigator.userAgent;
  return useragent.indexOf("iPhone") != -1 || useragent.indexOf("Android") != -1;
}

$(document).on("pageinit", init);