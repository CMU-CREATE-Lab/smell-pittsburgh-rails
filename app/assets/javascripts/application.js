// Map variables
var map;
var infowindow;
var smell_reports;
var smell_reports_jump_index = [];
var smell_markers = [];
var smell_color = ["smell_1.png", "smell_2.png", "smell_3.png", "smell_4.png", "smell_5.png"];
var sensor_color = ["sensor_0.png", "sensor_1.png", "sensor_2.png", "sensor_3.png", "sensor_4.png", "sensor_5.png"];
var smell_value_text = ["Just fine!", "Barely noticeable", "Definitely noticeable",
  "It's getting pretty bad", "About as bad as it gets!"
];
var sensor_markers = [];
var staging_base_url = "http://staging.api.smellpittsburgh.org";
var month_names = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
var $calendar_dialog;
var $calendar;

// Timeline variables
var $timeline_index;
var $timeline_date;
var $dialog_ok_button;
var $timeline_container;
var esdr_root_url = "https://esdr.cmucreatelab.org/api/v1/";
var no_data_txt = "no data";

// tanh is not defined before Chrome 38
// which means that Android <= 4.4.x will
// throw an error when we attempt to use it;
// so here is a pollyfill.
var tanh_func = function (x) {
  if (x === Infinity) {
    return 1;
  } else if (x === -Infinity) {
    return -1;
  } else {
    var y = Math.exp(2 * x);
    return (y - 1) / (y + 1);
  }
};
Math.tanh = Math.tanh || tanh_func;

function init() {
  // Store objects
  $timeline_index = $("#timeline-index");
  $timeline_date = $("#timeline-date");
  $calendar = $("#calendar");
  $calendar_dialog = $("#calendar-dialog");
  $dialog_ok_button = $("#dialog-ok-button");
  $timeline_container = $("#timeline-container");

  // Create the page
  createGoogleMap();
  createToolbar();
  createCalendarDialog();
  loadSmellReports(new Date());
  loadCalendar();

  // Disable vertical bouncing effect on mobile browsers
  $(document).on("scrollstart", function (e) {
    e.preventDefault();
  });
}

function createGoogleMap() {
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

  // Set smell report information window
  infowindow = new google.maps.InfoWindow();
}

function createToolbar() {
  $("#home-btn").on("vclick", function () {
    map.setCenter(init_latlng);
    map.setZoom(isMobile() ? init_zoom_mobile : init_zoom_desktop);
  });
  $("#calendar-btn").on("vclick", function () {
    $calendar_dialog.dialog("open");
    $dialog_ok_button.focus();
  });
}

function createCalendarDialog() {
  $calendar_dialog.dialog({
    autoOpen: false,
    draggable: false,
    modal: true,
    width: 260,
    dialogClass: "custom-dialog noselect"
  });
  $calendar.on("change", function () {
    $calendar_dialog.dialog("close");
    var $selected = $calendar.find(":selected");
    var desired_index = smell_reports_jump_index[$selected.val()];
    if (typeof desired_index != "undefined") {
      selectTimelineBtn($timeline_index.find("div[data-value=" + desired_index + "]"), true);
    }
  });
  $dialog_ok_button.on("vclick", function () {
    $calendar_dialog.dialog("close");
  });
}

function loadCalendar() {
  $.ajax({
    url: genSmellURL(),
    success: function (data) {
      drawCalendar(data);
    },
    error: function (response) {
      console.log("server error:", response);
    }
  });
}

function loadSmellReports(date) {
  $.ajax({
    url: genSmellURL(date),
    success: function (data) {
      smell_reports = data;
      drawTimeline();
      selectMostRecentDate();
    },
    error: function (response) {
      console.log("server error:", response);
    }
  });
}

function genSmellURL(date_obj) {
  var api_paras;
  if (typeof date_obj == "undefined") {
    api_paras = "aggregate=month";
  } else {
    var timezone_offset = new Date().getTimezoneOffset();
    api_paras = "aggregate=created_at&timezone_offset=" + timezone_offset;
    // An alternative usage is to add starting time, ending time, and timezone offset
    // (see the following code)
    //var timezone_offset = new Date().getTimezoneOffset();
    //var y = date_obj.getFullYear();
    //var m = date_obj.getMonth();
    //var first_day = new Date(y, m, 1).getTime() / 1000;
    //var last_day = new Date(y, m + 1, 0).getTime() / 1000;
    //api_paras = "aggregate=created_at&timezone_offset=" + timezone_offset + "&start_time=" + first_day + "&end_time=" + last_day;
  }

  var url_hostname = window.location.origin;
  var api_url = "/api/v1/smell_reports?";
  if (url_hostname.indexOf("api.smellpittsburgh") >= 0) {
    api_url = url_hostname + api_url;
  } else {
    api_url = staging_base_url + api_url;
  }
  return api_url + api_paras;
}

function selectMostRecentDate() {
  selectTimelineBtn($timeline_index.children().last().children().first(), true);
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
      scaledSize: new google.maps.Size(24, 24),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(12, 12)
    },
    zIndex: report_i.smell_value,
    opacity: 0.85
  });

  // Add marker event
  marker.addListener("click", function () {
    //map.panTo(this.getPosition());
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

function drawSmellReportsByIndex(idx) {
  if (idx) {
    var report_k = smell_reports[idx];
    for (var i = 0; i < report_k.length; i++) {
      drawSingleSmellReport(report_k[i]);
    }
  }
}

function deleteAllSmellReports() {
  for (var i = 0; i < smell_markers.length; i++) {
    smell_markers[i].setMap(null);
  }
  smell_markers = [];
}

function drawCalendar(data) {
  var month_arr = data.month;
  for (var i = 0; i < month_arr.length; i++) {
    var year = month_arr[i][0];
    var month = month_arr[i][1];
    $calendar.append($('<option value="' + i + '" data-year="' + year + '" data-month="' + month + '">' + month_names[month - 1] + ' ' + year + '</option>'));
  }
}

function deleteTimeline() {
  $timeline_index.children().remove();
  $timeline_date.children().remove();
}

function drawTimeline() {
  var last_month;
  var td_count = 0;
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
    // Add the day block and text
    $timeline_index.append($('<td><div style="background-color: ' + color_str + '" class="custom-td-button" data-value="' + td_count + '" data-index="' + k + '" data-time="' + (new Date(date_str)).getTime()/1000 + '"></div></td>'));
    $timeline_date.append($('<td>' + date_str_seg[1] + " " + date_str_seg[2] + '</td>'));
    // Save the index if necessary
    var month = date.getMonth();
    if (last_month != month) {
      smell_reports_jump_index.push(td_count);
      last_month = month;
    }
    td_count++;
  }

  // Add clicking events
  $("#timeline-index .custom-td-button").on("vclick", function () {
    selectTimelineBtn($(this));
  });
}

function selectTimelineBtn($ele, auto_scroll) {
  if ($ele && !$ele.hasClass("selected-td-btn")) {
    clearTimelineBtnSelection();
    $ele.addClass("selected-td-btn");
    infowindow.close();
    deleteAllSmellReports();
    drawSmellReportsByIndex(parseInt($ele.data("index")));
    deleteAllSensors();
    loadAndDrawAllSensors(parseInt($ele.data("time")));
    // Scroll to the position
    if (auto_scroll) {
      $timeline_container.scrollLeft(Math.round($ele.parent().position().left - $timeline_container.width() / 5));
    }
  }
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

function loadAndDrawAllSensors(time) {
  var info = [{
    feed: 29,
    channel_now: "PM25_UG_M3",
    channel_max: "PM25_UG_M3_daily_max"
  }, {
    feed: 26,
    channel_now: "PM25B_UG_M3",
    channel_max: "PM25B_UG_M3_daily_max"
  }, {
    feed: 5975,
    channel_now: "PM2_5",
    channel_max: "PM2_5_daily_max"
  }, {
    feed: 30,
    channel_now: "PM25_UG_M3",
    channel_max: "PM25_UG_M3_daily_max"
  }, {
    feed: 1,
    channel_now: "PM25B_UG_M3",
    channel_max: "PM25B_UG_M3_daily_max"
  }];

  for (var i = 0; i < info.length; i++) {
    loadAndDrawSingleSensor(time, info[i]);
  }
}

function loadAndDrawSingleSensor(time, info) {
  var sensor = {};
  var date_str_sensor = (new Date(time*1000)).toDateString();
  var date_str_now = (new Date()).toDateString();
  var feed_url = esdr_root_url + "feeds/" + info["feed"];
  var PM25_url;
  var use_PM25_now;

  if (date_str_sensor == date_str_now) {
    PM25_url = feed_url + "/channels/" + info["channel_now"] + "/most-recent";
    use_PM25_now = true;
  } else {
    PM25_url = feed_url + "/channels/" + info["channel_max"] + "/export?format=json&from=" + time + "&to=" + (time+86400);
    use_PM25_now = false;
  }

  // Load sensor data simultaneously
  $.when(
      $.getJSON(feed_url, function (response) {
        var data = response["data"];
        sensor["lat"] = data["latitude"];
        sensor["lng"] = data["longitude"];
        sensor["name"] = data["name"];
      }),
      $.getJSON(PM25_url, function (response) {
        if (use_PM25_now) {
          var data = response["data"]["channels"][info["channel_now"]];
          if (data) {
            var val = roundTo2(data["mostRecentDataSample"]["value"]);
            sensor["PM25_now"] = val < 0 ? no_data_txt : val + " μg/m3";
          } else {
            sensor["PM25_now"] = no_data_txt;
          }
        } else {
          var data = response["data"][0];
          if (data) {
            var val = roundTo2(data[1]);
            sensor["PM25_max"] = val < 0 ? no_data_txt : val + " μg/m3";
          } else {
            sensor["PM25_max"] = no_data_txt;
          }
        }
      })
  ).then(function () {
    drawSingleSensor(sensor);
  });
}

function roundTo2(val) {
  return Math.round(parseFloat(val) * 100) / 100;
}

function drawSingleSensor(sensor) {
  var latlng = {"lat": sensor.lat, "lng": sensor.lng};
  var html = '';
  var val;
  
  html += "<b>Name:</b> " + sensor.name + "<br>";

  if (sensor["PM25_now"]) {
    val = sensor.PM25_now;
    html += '<b>PM2.5 now:</b> ' + sensor.PM25_now + '<br>';
  }
  if (sensor["PM25_max"]) {
    val = sensor.PM25_max;
    html += '<b>PM2.5 max:</b> ' + sensor.PM25_max + '<br>';
  }

  var color_idx = sensorValToColorIndex(val);

  // Add marker
  var marker = new google.maps.Marker({
    position: latlng,
    map: map,
    content: html,
    icon: {
      url: "/img/" + sensor_color[color_idx],
      scaledSize: new google.maps.Size(24, 24),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(12, 12)
    },
    zIndex: color_idx,
    opacity: 0.85
  });

  // Add marker event
  marker.addListener("click", function () {
    //map.panTo(this.getPosition());
    infowindow.setContent(this.content);
    infowindow.open(map, this);
  });

  // Save markers
  sensor_markers.push(marker);
}

function sensorValToColorIndex(val) {
  var scale = [12, 35.4, 55.4, 150.4];
  if (val == no_data_txt) {
    return 0;
  } else {
    val = parseFloat(val);
    if (val >= 0 && val <= scale[0]) {
      return 1;
    } else if (val > scale[0] && val <= scale[1]) {
      return 2;
    } else if (val > scale[1] && val <= scale[2]) {
      return 3;
    } else if (val > scale[2] && val <= scale[3]) {
      return 4;
    } else {
      return 5;
    }
  }
}

function deleteAllSensors() {
  for (var i = 0; i < sensor_markers.length; i++) {
    sensor_markers[i].setMap(null);
  }
  sensor_markers = [];
}

$(document).on("pageinit", init);
