"use strict";

// Map variables
var map;
var infowindow_smell;
var infowindow_sensor;
var smell_reports;
var smell_reports_jump_index = [];
var smell_markers = [];
var sensor_color_wind = ["sensor_0_wind.png", "sensor_1_wind.png", "sensor_2_wind.png", "sensor_3_wind.png", "sensor_4_wind.png", "sensor_5_wind.png"];
var sensor_color = ["sensor_0.png", "sensor_1.png", "sensor_2.png", "sensor_3.png", "sensor_4.png", "sensor_5.png"];
var smell_value_text = ["Just fine!", "Barely noticeable", "Definitely noticeable",
  "It's getting pretty bad", "About as bad as it gets!"
];

// Calendar
var month_names = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
var $calendar_dialog;
var $calendar;

// Map parameters
var init_zoom_desktop = 12;
var init_zoom_mobile = 11;
var init_latlng = {"lat": 40.42, "lng": -79.94};

// Marker parameters
var zoom_level_to_smell_icon_size = [24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 36, 60, 90, 180, 240, 360];
var previous_icon_size;

// Timeline variables
var $timeline_index;
var $timeline_date;
var $dialog_ok_button;
var $timeline_container;
var esdr_root_url = "https://esdr.cmucreatelab.org/api/v1/";
var aqi_root_url = "http://api.smellpittsburgh.org/api/v1/get_aqi?city=";
var staging_base_url = "http://api.smellpittsburgh.org";
var api_url = "/api/v1/smell_reports?";
var no_data_txt = "No data in last four hours.";
var timelineTouched = false;
var timelineTouchedPosition = {};

var requests = [];

// Sensors
// NOTE: Put all sensors that are not drawn first.
// This is needed so that the data is available for the sensors
// that are drawn.
var sensorList = [
  {
    feed: 28,
    name: "County AQ Monitor - Liberty",
    channels: [
      "SONICWS_MPH",
      "SONICWD_DEG"
    ],
    doDraw: false
  }, {
    feed: 29,
    name: "County AQ Monitor - Liberty",
    channel_max: "PM25_UG_M3_daily_max",
    channels: [
      "PM25_UG_M3"
    ],
    doDraw: true
  }, {
    feed: 26,
    name: "County AQ Monitor - Lawrenceville",
    channel_max: "PM25B_UG_M3_daily_max",
    channels: [
      "PM25B_UG_M3",
      "SONICWS_MPH",
      "SONICWD_DEG"
    ],
    doDraw: true
  }, {
    feed: 43,
    name: "County AQ Monitor - Parkway East",
    channels: [
      "SONICWS_MPH",
      "SONICWD_DEG"
    ],
    doDraw: false
  }, {
    feed: 5975,
    name: "County AQ Monitor - Parkway East",
    channel_max: "PM2_5_daily_max",
    channels: [
      "PM2_5"
    ],
    doDraw: true
  }, {
    feed: 30,
    name: "County AQ Monitor - Lincoln",
    channel_max: "PM25_UG_M3_daily_max",
    channels: [
      "PM25_UG_M3"
    ],
    doDraw: true
  }, {
    feed: 1,
    name: "County AQ Monitor - Avalon",
    channel_max: "PM25B_UG_M3_daily_max",
    channels: [
      "PM25B_UG_M3",
      "SONICWS_MPH",
      "SONICWD_DEG"
    ],
    doDraw: true
  }
];
var sensor_markers = [];
var sensorLoadCount = 0;
var sensors = {};
var totalSensors = sensorList.length;


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
  loadCalendar();
  loadSmellReports(new Date());

  // Disable vertical bouncing effect on mobile browsers
  $(document).on("scrollstart", function (e) {
    e.preventDefault();
  });

  // Disable all href tags to prevent accidental link clicking on the map
  $('body').on("click", "a", function(e) {
    e.preventDefault();
  });

  // Add horizontal scrolling to the timeline
  // Needed because Android <= 4.4 won't scroll without this
  addTouchHorizontalScroll($("#timeline-container"));
}

function createGoogleMap() {
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

  // Add events
  map.addListener('zoom_changed', function() {
    var zoom_level = map.getZoom();
    var icon_size = zoom_level_to_smell_icon_size[zoom_level];
    if (icon_size != previous_icon_size) {
      var icon_size_half = icon_size / 2;
      for (var i = 0; i < smell_markers.length; i++) {
        var icon = smell_markers[i]["icon"];
        icon["url"] = getSmellColor(smell_markers[i]["smell_value"] - 1);
        icon["scaledSize"] = new google.maps.Size(icon_size, icon_size);
        icon["anchor"] = new google.maps.Point(icon_size_half, icon_size_half);
        icon["size"] = new google.maps.Size(icon_size, icon_size);
        smell_markers[i].setIcon(icon);
      }
      previous_icon_size = icon_size;
    }
  });

  // Set smell report information window
  infowindow_smell = new google.maps.InfoWindow({
    pixelOffset: new google.maps.Size(-1, 0)
  });
  infowindow_sensor = new google.maps.InfoWindow({
    pixelOffset: new google.maps.Size(0, 37)
  });
}

function createToolbar() {
  $("#home-btn").on("click", function () {
    map.setCenter(init_latlng);
    map.setZoom(isMobile() ? init_zoom_mobile : init_zoom_desktop);
  });
  $("#calendar-btn").on("click", function () {
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
    dialogClass: "custom-dialog noselect",
    closeText:'<i class=\"fa fa-times\"></i>'
  });
  $calendar.on("change", function () {
    $calendar_dialog.dialog("close");
    var $selected = $calendar.find(":selected");
    if ($selected.val() == -1) {
      selectMostRecentDate();
    } else {
      var desired_index = smell_reports_jump_index[$selected.val()];
      if (typeof desired_index != "undefined") {
        selectTimelineBtn($timeline_index.find("div[data-value=" + desired_index + "]"), true, false);
        var data_time = (new Date($selected.data("year"), $selected.data("month")-1)).getTime();
        var label = {
          "dimension5": data_time.toString()
        };
        addGoogleAnalyticEvent("calendar", "click", label);
      }
    }
    // Have selector go back to showing default option
    $(this).prop('selectedIndex', 0);
  });
  $dialog_ok_button.on("click", function () {
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

  var root_url = window.location.origin;
  return root_url + api_url + api_paras;
}

function selectMostRecentDate() {
  selectTimelineBtn($timeline_index.children().last().children().first(), true, false);
}

function drawSingleSmellReport(report_i) {
  var latlng = {"lat": report_i.latitude, "lng": report_i.longitude};

  // Add marker
  var date = new Date(report_i.created_at);
  var date_str = date.toLocaleString();
  var smell_value = report_i.smell_value;
  var feelings_symptoms = report_i.feelings_symptoms ? report_i.feelings_symptoms : "No data.";
  var smell_description = report_i.smell_description ? report_i.smell_description : "No data.";
  var icon_size = zoom_level_to_smell_icon_size[map.getZoom()];
  previous_icon_size = icon_size;
  var icon_size_half = icon_size / 2;
  var marker = new google.maps.Marker({
    position: latlng,
    map: map,
    created_date: date.getTime(),
    smell_value: report_i.smell_value,
    content: '<b>Date:</b> ' + date_str + '<br>'
      + '<b>Smell Rating:</b> ' + smell_value + " (" + smell_value_text[smell_value - 1] + ")" + '<br>'
      + '<b>Symptoms:</b> ' + feelings_symptoms + '<br>'
      + '<b>Smell Description:</b> ' + smell_description,
    icon: {
      url: getSmellColor(report_i.smell_value - 1),
      scaledSize: new google.maps.Size(icon_size, icon_size),
      size: new google.maps.Size(icon_size, icon_size),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(icon_size_half, icon_size_half)
    },
    zIndex: report_i.smell_value,
    opacity: 0.85
  });

  // Add marker event
  marker.addListener("click", function () {
    //map.panTo(this.getPosition());
    infowindow_sensor.close();
    infowindow_smell.setContent(this.content);
    infowindow_smell.open(map, this);
    // Add google analytics event
    var label = {
      "dimension5": this.created_date.toString(),
      "metric1": this.smell_value
    };
    addGoogleAnalyticEvent("smell", "click", label);
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
  var today = new Date();
  $calendar.append($('<option value="' + -1 + '" data-year="' + today.getFullYear() + '" data-month="' + today.getMonth() + '">Today</option>'));
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
  // June 04 2016
  var date = new Date(1465012800000);
  for (var k = 0; k < smell_reports.length; k++) {
    var report_k = smell_reports[k];
    //if (report_k.length == 0) {
    //  continue;
    //}
    //var color = Math.round((0.95 - Math.tanh(report_k.length / 10)) * 255);
    var smell_average = 0;
    for (var i = 0; i < report_k.length; i++) {
      smell_average += report_k[i].smell_value;
    }
    if (smell_average > 0)
      smell_average /= report_k.length;
    var color = Math.round((0.95 - Math.tanh(smell_average / 5)) * 255);
    var color_str = "rgb(" + color + "," + color + "," + color + ")";
    if (report_k[0])
      date = new Date(report_k[0].created_at);
    else
      date = new Date(date.setDate(date.getDate() + 1));
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
  $("#timeline-index .custom-td-button").on("click touchend", function (e) {
    if (e.type == "click") timelineTouched = true;
    if (timelineTouched)
      selectTimelineBtn($(this), false, true);
  });

  $("#timeline-index .custom-td-button").on('touchstart', function(e) {
    timelineTouchedPosition = {x: e.originalEvent.touches[0].pageX, y: e.originalEvent.touches[0].pageY};
    timelineTouched = true;
  });

  $("#timeline-index .custom-td-button").on('touchmove', function(e) {
    if (Math.abs(timelineTouchedPosition.x - e.originalEvent.touches[0].pageX) >= 2 || Math.abs(timelineTouchedPosition.y - e.originalEvent.touches[0].pageY) >= 2)
      timelineTouched = false;
  });
}

function selectTimelineBtn($ele, auto_scroll, from_click_event) {
  if ($ele && !$ele.hasClass("selected-td-btn")) {
    clearTimelineBtnSelection();
    $ele.addClass("selected-td-btn");
    infowindow_smell.close();
    infowindow_sensor.close();
    deleteAllSmellReports();
    drawSmellReportsByIndex(parseInt($ele.data("index")));
    deleteAllSensors();
    var data_time = parseInt($ele.data("time"));
    loadAndDrawAllSensors(data_time);
    // Scroll to the position
    if (auto_scroll) {
      $timeline_container.scrollLeft(Math.round($ele.parent().position().left - $timeline_container.width() / 5));
    }
    if (from_click_event) {
      // Add google analytics
      var label = {
        "dimension5": (data_time*1000).toString()
      };
      addGoogleAnalyticEvent("timeline", "click", label);
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
  sensorLoadCount = 0;
  loadAndDrawSingleSensor(time);
}

function loadAndDrawSingleSensor(time) {
  var info = sensorList[sensorLoadCount];
  var sensor = {};
  var date_str_sensor = (new Date(time * 1000)).toDateString();
  var date_hour_now = (new Date()).getHours();
  var date_str_now = (new Date()).toDateString();
  var feed_url = esdr_root_url + "feeds/" + info.feed;
  var data_url;
  var data;
  var val;
  var use_PM25_now;

  sensor["name"] = info.name;
  sensor["doDraw"] = info.doDraw;
  sensor["feed"] = info.feed;

  // Channel max values are not calculated until 3am, so to be safe we wait until 4.
  if (date_str_sensor == date_str_now || date_hour_now < 4) {
    data_url = feed_url + "/channels/" + info.channels.toString() + "/export?format=json&from=" + time + "&to=" + (time + 86399);
    use_PM25_now = true;
  } else if (info["channel_max"]) {
    data_url = feed_url + "/channels/" + info["channel_max"] + "/export?format=json&from=" + time + "&to=" + (time + 86399);
    use_PM25_now = false;
  }

  // Show current Pittsburgh AQI if on current day
  if (use_PM25_now) {
    if (sensorLoadCount == 0) {
      $.getJSON(aqi_root_url + "Pittsburgh", function (response) {
        if (response) {
          $(".aqi-td").text(response);
          $(".aqi-tr").show();
        }
      });
    }
  } else {
    $(".aqi-tr").hide();
  }

  // Load sensor data simultaneously
  (function() {
    // If we do not need to draw or already have lat/lng then immediately return a resolved Promise
    if (!sensor.doDraw || (sensors[sensor.name] && sensors[sensor.name].lat && sensors[sensor.name].lng))
      return $().promise();

    var xhr = $.getJSON(feed_url, function (response) {
      data = response.data;
      sensor.lat = data.latitude;
      sensor.lng = data.longitude;
    });
    requests.push(xhr);
    return xhr;
  })().then(function(){
    if (!use_PM25_now && !sensor.doDraw) return;
    var xhr = $.getJSON(data_url, function (response) {
      if (use_PM25_now) {
        data = response.data;
        var latest_data = data[data.length - 1];
        var windStartIdx = 2;

        if (data && latest_data) {
          // Compute the difference between the timestamp and current time.
          // If it is more than 4 hours, consider it no data.
          var data_time = data[data.length - 1][0] * 1000;
          // IMPORTANT: only report data time when latest data exist
          // This is done intentionally for Google Analytics to know
          // if the reported PM25 value is now or max
          sensor["data_time"] = data_time;
          var current_time = Date.now();
          var diff_hour = (current_time - data_time) / 3600000;
          if (diff_hour > 4) {
            sensor["PM25_now"] = -1;
          } else {
            val = roundTo(latest_data[1], 2);
            sensor["PM25_now"] = Math.max(-1, val);

            if (!sensor.doDraw)
              windStartIdx = 1;

            if (!sensor["wind_speed"])
              sensor["wind_speed"] = latest_data[windStartIdx];
            if (!sensor["wind_direction"])
              sensor["wind_direction"] = latest_data[windStartIdx + 1];
          }
        } else {
          sensor["PM25_now"] = -1;
        }
      } else {
        data = response.data[0];
        // IMPORTANT: do not report data time here
        // This is done intentionally for Google Analytics to know
        // if the reported PM25 value is now or max
        if (data) {
          val = roundTo(data[1], 2);
          sensor["PM25_max"] = Math.max(-1, val);
        } else {
          sensor["PM25_max"] = -1;
        }
      }
      var tmp = $.extend(true, {}, sensors[sensor.name], sensor);
      sensors[sensor.name] = tmp;
    });
    requests.push(xhr);
    return xhr;
  }).done(function () {
    if (sensor.doDraw)
      drawSingleSensor(sensors[sensor.name]);
    sensorLoadCount++;
    if (sensorLoadCount < totalSensors)
      loadAndDrawSingleSensor(time, info[sensorLoadCount]);
  });
}

function drawSingleSensor(sensor) {
  var latlng = {"lat": sensor.lat, "lng": sensor.lng};
  var html = '';
  var val;

  html += "<b>Name:</b> " + sensor.name + "<br>";

  if (typeof(sensor["PM25_now"]) !== "undefined") {
    val = sensor["PM25_now"];
    var txt = (isNaN(val) || val < 0) ? no_data_txt : val + " &mu;g/m<sup>3</sup>";
    html += '<b>Latest PM<sub>2.5</sub>:</b> ' + txt + '<br>';
  }
  if (typeof(sensor["PM25_max"]) !== "undefined") {
    val = sensor["PM25_max"];
    var txt = (isNaN(val) || val < 0) ? no_data_txt : val + " &mu;g/m<sup>3</sup>";
    html += '<b>Maximum PM<sub>2.5</sub>:</b> ' + txt + '<br>';
  }

  if (typeof(sensor["PM25_now"]) !== "undefined" && typeof(sensor["wind_speed"]) !== "undefined") {
    var windVal = sensor["wind_speed"];
    var txt = (isNaN(windVal) || windVal < 0) ? no_data_txt : windVal + " MPH";
    html += '<b>Latest Wind Speed:</b> ' + txt + '<br>';
  }

  var color_idx = sensorValToColorIndex(val);
  var markerArray, rotation = 0;
  if (typeof(sensor["wind_speed"]) !== "undefined" && typeof(sensor["wind_direction"]) !== "undefined") {
    markerArray = sensor_color_wind;
    // The direction given by ACHD is the direction _from_ which the wind is coming.
    // We reverse it to show where the wind is going to. (+180)
    // Also, the arrow we start with is already rotated 90 degrees, so we need to account for this. (-90)
    // This means we add 90 to the sensor wind direction value for the correct angle of the wind arrow.
    rotation = sensor["wind_direction"] + 90;
  } else {
    markerArray = sensor_color;
  }

  // Add marker
  var image = new Image();
  image.addEventListener("load", function() {
    var marker = new google.maps.Marker({
      position: latlng,
      map: map,
      content: html,
      feed: sensor["feed"],
      data_time: typeof sensor["data_time"] !== "undefined" ? sensor["data_time"] : -1,
      PM25_now: typeof sensor["PM25_now"] !== "undefined" ? sensor["PM25_now"] : -1,
      PM25_max: typeof sensor["PM25_max"] !== "undefined" ? sensor["PM25_max"] : -1,
      icon: {
        url: getRotatedMarker(image, rotation),
        scaledSize: new google.maps.Size(100, 100),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(50, 50)
      },
      shape: {coords: [50, 50, 12.5], type: "circle"}, /* Modify click region */
      zIndex: color_idx,
      opacity: 0.85
    });

    // Add marker event
    marker.addListener("click", function () {
      infowindow_smell.close();
      infowindow_sensor.setContent(this.content);
      infowindow_sensor.open(map, this);
      // Add google analytics
      var label = {
        "dimension5": this.data_time.toString(),
        "dimension6": this.feed.toString(),
        "metric2": this.PM25_now != -1 ? this.PM25_now : this.PM25_max
      };
      addGoogleAnalyticEvent("sensor", "click", label);
    });

    // Save markers
    sensor_markers.push(marker);
  });

  image.src = "/img/" + markerArray[color_idx];
}

function sensorValToColorIndex(val) {
  var scale = [12, 35.4, 55.4, 150.4];
  if (val == no_data_txt) {
    return 0;
  } else {
    val = parseFloat(val);
    if (isNaN(val) || val < 0) {
      return 0;
    } else if (val >= 0 && val <= scale[0]) {
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
  // Abort all pending ajax requests
  for (var ri = 0; ri < requests.length; ri++) {
    requests[ri].abort();
  }
  requests = [];
  // Delete all sensor properties except for name and location,
  // which allows us to cache the first ESDR request.
  for (var sensor in sensors) {
    for (var prop in sensors[sensor]) {
      if (prop !== "lat" && prop !== "lng" && prop !== "name") {
        delete sensors[sensor][prop];
      }
    }
  }
  for (var mi = 0; mi < sensor_markers.length; mi++) {
    sensor_markers[mi].setMap(null);
  }
  sensor_markers = [];
}

function addTouchHorizontalScroll(elem) {
  var scrollStartPos, startTime, endTime, newPos, startTouchX, endTouchX;
  $(elem).on("touchstart", function(e) {
    startTime = new Date().getTime();
    newPos = 0;
    endTouchX = null;
    startTouchX = e.originalEvent.touches[0].pageX;
    scrollStartPos = this.scrollLeft + startTouchX;
    e.preventDefault();
  }).on("touchmove", function(e) {
    endTouchX = e.originalEvent.touches[0].pageX;
    newPos = scrollStartPos - endTouchX;
    this.scrollLeft = newPos;
    e.preventDefault();
  }).on("touchend touchcancel", function(e) {
    // TODO: Flick/swip ability
    //endTime = new Date().getTime();
    //if (endTouchX && endTime - startTime < 100) {
    //  var flickVal = 200 * Math.abs(newPos - scrollStartPos) / (endTime - startTime);
    //  if (endTouchX > startTouchX) flickVal *= -1;
    //  this.scrollLeft = this.scrollLeft + flickVal;
    //}
  });
}

function getRotatedMarker(image, deg) {
  var angle = deg * Math.PI / 180;
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = image.width;
  canvas.height = image.height;
  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
  return canvas.toDataURL('image/png');
}

function getSmellColor(idx) {
  var path = "/img/";
  var smell_color = ["smell_1.png", "smell_2.png", "smell_3.png", "smell_4.png", "smell_5.png"];
  var smell_color_med = ["smell_1_med.png", "smell_2_med.png", "smell_3_med.png", "smell_4_med.png", "smell_5_med.png"];
  var smell_color_big = ["smell_1_big.png", "smell_2_big.png", "smell_3_big.png", "smell_4_big.png", "smell_5_big.png"];
  var map_zoom = map.getZoom();
  if (map_zoom >= 20) {
    return path + smell_color_big[idx];
  } else if (map_zoom < 20 && map_zoom >= 17) {
    return path + smell_color_med[idx];
  } else {
    return path + smell_color[idx];
  }
}

$(function() {
  init();
});
