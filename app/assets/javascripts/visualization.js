"use strict";

// URL variables
var api_url = "/api/v1/smell_reports?";
var esdr_root_url = "https://esdr.cmucreatelab.org/api/v1/";
var aqi_root_url = "http://api.smellpittsburgh.org/api/v1/get_aqi?city=";

// Google map variables
var map;
var area;
var init_latlng;
var init_date;
var init_zoom_desktop = 12;
var init_zoom_mobile = 11;

// Smell reports variables
var smell_reports_cache = {};
var current_epochtime_milisec;
var infowindow_smell;

// Animation variables
var isPlaying = false;
var isDwelling = false;
var animate_smell_report_interval = null;
var $playback_button;
var $playback_txt;
var animation_labels;

// Calendar variables
var month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var $calendar_dialog;
var $calendar;
var $dialog_ok_button;

// Timeline variables
var timeline;
var timeline_jump_index = [];

// Sensor variables
var sensors_cache = {};
var infowindow_sensor;
var sensors_list = [
  {
    name: "County AQ Monitor - Liberty",
    wind: {
      feed: 28,
      channels: [
        "SONICWS_MPH",
        "SONICWD_DEG"
      ]
    },
    PM25: {
      feed: 29,
      channel_max: "PM25_UG_M3_daily_max",
      channels: [
        "PM25_UG_M3"
      ]
    },
    latitude: 40.32377,
    longitude: -79.86806
  }, {
    name: "County AQ Monitor - Lawrenceville",
    wind: {
      feed: 26,
      channels: [
        "SONICWS_MPH",
        "SONICWD_DEG"
      ]
    },
    PM25: {
      feed: 26,
      channel_max: "PM25B_UG_M3_daily_max",
      channels: [
        "PM25B_UG_M3"
      ]
    },
    latitude: 40.46542,
    longitude: -79.960757
  }, {
    name: "County AQ Monitor - Parkway East",
    wind: {
      feed: 43,
      channels: [
        "SONICWS_MPH",
        "SONICWD_DEG"
      ]
    },
    PM25: {
      feed: 5975,
      channel_max: "PM2_5_daily_max",
      channels: [
        "PM2_5"
      ]
    },
    latitude: 40.43743,
    longitude: -79.86357
  }, {
    name: "County AQ Monitor - Avalon",
    wind: {
      feed: 1,
      channels: [
        "SONICWS_MPH",
        "SONICWD_DEG"
      ]
    },
    PM25: {
      feed: 1,
      channel_max: "PM25B_UG_M3_daily_max",
      channels: [
        "PM25B_UG_M3"
      ]
    },
    latitude: 40.49977,
    longitude: -80.07134
  }, {
    name: "County AQ Monitor - Lincoln",
    PM25: {
      feed: 30,
      channel_max: "PM25_UG_M3_daily_max",
      channels: [
        "PM25_UG_M3"
      ]
    },
    latitude: 40.30822,
    longitude: -79.86913
  }
];

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
var requests = [];
var sensor_markers = [];
var sensorLoadCount = 0;
var sensors = {};
var totalSensors = sensorList.length;
var sensor_and_wind_icons = ["sensor_0_wind.png", "sensor_1_wind.png", "sensor_2_wind.png", "sensor_3_wind.png", "sensor_4_wind.png", "sensor_5_wind.png"];
var sensor_icons = ["sensor_0.png", "sensor_1.png", "sensor_2.png", "sensor_3.png", "sensor_4.png", "sensor_5.png"];
var no_data_txt = "No data in last four hours.";

function init() {
  // Create the page
  initGoogleMapAndHomeButton();
  initCalendarButtonAndDialog();
  initAnimationUI();

  // Load data
  loadAndDrawCalendar();
  loadAndDrawTimeline();

  // Disable vertical bouncing effect on mobile browsers
  $(document).on("scrollstart", function (e) {
    e.preventDefault();
  });

  // Disable all href tags to prevent accidental link clicking on the map
  $('body').on("click", "a", function (e) {
    e.preventDefault();
  });
}

function initGoogleMapAndHomeButton() {
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

  //default to Pittsburgh
  area = "PGH";
  init_latlng = {"lat": 40.45, "lng": -79.93};
  init_date = new Date(2016, 5, 4);

  //get user location
  var query = window.location.search.slice(1).split("&");
  for (var i = 0; i < query.length; i++) {
    var queryVar = query[i];
    if (queryVar.indexOf("user_hash") != -1 && queryVar.match(/[A-Z]{2,}/)) {
      area = queryVar.match(/[A-Z]{2,}/)[0];
    }
  }
  if (area == "BA") {
    init_latlng = {"lat": 38.004472, "lng": -122.260693};
    init_date = new Date(2017, 0, 1);
  }

  // Set Google map
  map = new google.maps.Map(document.getElementById("map"), {
    center: init_latlng,
    styles: styleArray,
    zoom: isMobile() ? init_zoom_mobile : init_zoom_desktop,
    disableDefaultUI: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  // Set smell report information window
  infowindow_smell = new google.maps.InfoWindow({
    pixelOffset: new google.maps.Size(-1, 0)
  });
  infowindow_sensor = new google.maps.InfoWindow({
    pixelOffset: new google.maps.Size(0, 37)
  });

  // Add event to the home button
  $("#home-btn").on("click", function () {
    map.setCenter(init_latlng);
    map.setZoom(isMobile() ? init_zoom_mobile : init_zoom_desktop);
  });
}

function initCalendarButtonAndDialog() {
  $calendar = $("#calendar");
  $calendar_dialog = $("#calendar-dialog");
  $dialog_ok_button = $("#dialog-ok-button");
  $calendar_dialog.dialog({
    autoOpen: false,
    draggable: false,
    modal: true,
    width: 260,
    dialogClass: "custom-dialog noselect",
    closeText: '<i class=\"fa fa-times\"></i>'
  });
  $calendar.on("change", function () {
    $calendar_dialog.dialog("close");
    var $selected = $calendar.find(":selected");
    if ($selected.val() == -1) {
      timeline.selectLastBlock();
    } else {
      var desired_index = timeline_jump_index[$selected.val()];
      if (typeof desired_index != "undefined") {
        timeline.selectBlockByIndex(desired_index);
        // Google Analytics
        var data_time = (new Date($selected.data("year"), $selected.data("month") - 1)).getTime();
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
  $("#calendar-btn").on("click", function () {
    $calendar_dialog.dialog("open");
    $dialog_ok_button.focus();
  });
}

function initAnimationUI() {
  $playback_button = $("#playback-btn");
  $playback_button.on("click", function () {
    if (isPlaying) {
      stopAnimation(current_epochtime_milisec, current_epochtime_milisec);
    } else {
      startAnimation(current_epochtime_milisec);
    }
  });
  $playback_txt = $("#playback-txt");
}

function loadAndDrawCalendar() {
  $.ajax({
    "url": genSmellURL({"aggregate": "month"}),
    "success": function (data) {
      drawCalendar(data);
    },
    "error": function (response) {
      console.log("server error:", response);
    }
  });
}

function loadAndDrawTimeline() {
  $.ajax({
    "url": genSmellURL({"aggregate": "day"}),
    "success": function (data) {
      drawTimeline(data);
      timeline.selectLastBlock();
    },
    "error": function (response) {
      console.log("server error:", response);
    }
  });
}

function showSmellMarkers(epochtime_milisec) {
  if (typeof epochtime_milisec == "undefined") return;

  // Check if data exists in the cache
  var r = smell_reports_cache[epochtime_milisec];
  if (typeof r != "undefined") {
    // Make smell markers visible on the map
    var markers = r["markers"];
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
  } else {
    smell_reports_cache[epochtime_milisec] = {"markers": []};
    // Load data from server and create all smell markers
    loadAndCreateSmellMarkers(epochtime_milisec);
  }
}

function loadAndCreateSmellMarkers(epochtime_milisec) {
  $.ajax({
    "url": genSmellURL({"epochtime_milisec": epochtime_milisec}),
    "success": function (data) {
      // Create all smell report markers
      for (var i = 0; i < data.length; i++) {
        createAndShowSmellMarker(data[i], epochtime_milisec);
      }
      // Update marker size when users zoom the map
      map.addListener("zoom_changed", function () {
        var current_markers = smell_reports_cache[current_epochtime_milisec]["markers"];
        var current_zoom_level = map.getZoom();
        for (var i = 0; i < current_markers.length; i++) {
          current_markers[i].updateIconByZoomLevel(current_zoom_level);
        }
      });
    },
    "error": function (response) {
      console.log("server error:", response);
    }
  });
}

function createAndShowSmellMarker(data, epochtime_milisec) {
  return new CustomMapMarker({
    "type": "smell",
    "data": data,
    "initZoomLevel": map.getZoom(),
    "click": function (marker) {
      handleSmellMarkerClicked(marker);
    },
    "complete": function (marker) {
      // Make the maker visible on the map when the maker is created
      marker.setMap(map);
      // Cache markers
      smell_reports_cache[epochtime_milisec]["markers"].push(marker);
    }
  });
}

function handleSmellMarkerClicked(marker) {
  infowindow_sensor.close();
  infowindow_smell.setContent(marker.getContent());
  infowindow_smell.open(map, marker.getGoogleMapMarker());

  // Add google analytics event
  var marker_data = marker.getData();
  var label = {
    "dimension5": (marker_data["created_at"] * 1000).toString(),
    "metric1": marker_data["smell_value"]
  };
  addGoogleAnalyticEvent("smell", "click", label);
}

function hideSmellMarkers(epochtime_milisec) {
  var r = smell_reports_cache[epochtime_milisec];
  if (typeof r == "undefined") return;
  var current_markers = r["markers"];
  for (var i = 0; i < current_markers.length; i++) {
    current_markers[i].setMap(null);
    current_markers[i].reset();
  }
}

function genSmellURL(method) {
  var api_paras;
  if (typeof method != "undefined" && method["aggregate"] == "month") {
    api_paras = "aggregate=month";
  } else if (typeof method != "undefined" && method["aggregate"] == "day") {
    var min_smell_value = 3;
    var timezone_offset = new Date().getTimezoneOffset();
    api_paras = "aggregate=day&min_smell_value=" + min_smell_value + "&timezone_offset=" + timezone_offset;
  } else {
    var date_obj = typeof method == "undefined" ? new Date() : new Date(method["epochtime_milisec"]);
    // Get only the smell reports for one day
    var y = date_obj.getFullYear();
    var m = date_obj.getMonth();
    var d = date_obj.getDate();
    var first_day_epochtime = parseInt((new Date(y, m, d).getTime()) / 1000);
    var last_day_epochtime = first_day_epochtime + 86399;
    api_paras = "start_time=" + first_day_epochtime + "&end_time=" + last_day_epochtime;
  }
  if (area != "PGH") {
    //specify default start time
    api_paras += "&area=" + area;
  }
  var root_url = window.location.origin;
  return root_url + api_url + api_paras;
}

function histSmellReport(r) {
  if (r.length == 0) {
    return [];
  }
  // Bin smell reports according to 30 mins time frame
  // There are totally 48 bins for one day
  var histogram = new Array(48);
  for (var i = 0; i < histogram.length; i++) {
    histogram[i] = {
      data: [],
      hour: Math.floor(i / 2),
      minute: i % 2 * 30
    };
  }
  for (var i = 0; i < r.length; i++) {
    var d = new Date(r[i]["created_at"] * 1000);
    var hour = d.getHours();
    var minute = d.getMinutes();
    var idx = hour * 2;
    if (minute > 30) {
      idx += 1;
    }
    histogram[idx]["data"].push(r[i]);
  }
  return histogram;
}

function startAnimation(epochtime_milisec) {
  if (isPlaying == true) return;
  isPlaying = true;
  isDwelling = false;

  var smell_markers = smell_reports_cache[epochtime_milisec]["markers"];
  if (animate_smell_report_interval != null || smell_markers.length == 0) return;

  // Handle UI
  if ($playback_button.hasClass("ui-icon-custom-play")) {
    $playback_button.removeClass("ui-icon-custom-play");
    $playback_button.addClass("ui-icon-custom-pause");
  }
  $playback_txt.show();

  // Animation variables
  var frames_per_sec = 60;
  var secs_to_animate_one_day = 20;
  var increments_per_frame = Math.round(86400000 / (secs_to_animate_one_day * frames_per_sec));
  var interval = 1000 / frames_per_sec;
  var marker_fade_milisec = 1000;
  var dwell_sec = 2;
  var dwell_increments = dwell_sec * frames_per_sec * increments_per_frame;
  var label = getAnimationLabels();

  // Initialize animation
  var r_idx = 0;
  var elapsed_milisec = 0;
  hideSmellMarkers(epochtime_milisec);
  var label_idx = 0;
  $playback_txt.text(label[label_idx]["text"]);

  // Start animation
  animate_smell_report_interval = setInterval(function () {
    if (elapsed_milisec < 86400000) {
      // This condition means that we need to animate smell reports
      // Check all smell reports that are not on the map
      // Draw a smell report only if it has time less than the current elapsed time
      if (r_idx < smell_markers.length) {
        for (var i = r_idx; i < smell_markers.length; i++) {
          var marker = smell_markers[i];
          var marker_data = marker.getData();
          var smell_epochtime_milisec = marker_data["created_at"] * 1000;
          if (smell_epochtime_milisec <= (current_epochtime_milisec + elapsed_milisec)) {
            marker.setMap(map);
            fadeMarker(marker, marker_fade_milisec);
            r_idx += 1;
          } else {
            break;
          }
        }
      }
      // Display label
      if (elapsed_milisec >= label[label_idx]["milisec"]) {
        label_idx += 1;
        $playback_txt.text(label[label_idx]["text"]);
      }
    } else {
      isDwelling = true;
    }
    if (elapsed_milisec > 86400000 + dwell_increments) {
      isDwelling = false;
      // This condition means that we already animated all smell reports in one day
      r_idx = 0;
      elapsed_milisec = 0;
      hideSmellMarkers(epochtime_milisec);
      label_idx = 0;
      $playback_txt.text(label[label_idx]["text"]);
    }
    elapsed_milisec += increments_per_frame;
  }, interval);
}

function stopAnimation(epochtime_milisec, previous_epochtime_milisec) {
  if (isPlaying == false) return;
  isPlaying = false;
  isDwelling = false;

  // Handle UI
  if ($playback_button.hasClass("ui-icon-custom-pause")) {
    $playback_button.removeClass("ui-icon-custom-pause");
    $playback_button.addClass("ui-icon-custom-play");
  }
  $playback_txt.text("");
  $playback_txt.hide();

  // Stop animation
  if (animate_smell_report_interval != null) {
    clearInterval(animate_smell_report_interval);
    animate_smell_report_interval = null;
  }

  // Draw all smell reports to the map
  hideSmellMarkers(previous_epochtime_milisec);
  showSmellMarkers(epochtime_milisec);
}

function getAnimationLabels() {
  if (typeof animation_labels != "undefined") return animation_labels;
  animation_labels = [];
  // One bin is equal to 30 minutes
  var increments = 86400000 / 48;
  var milisec = increments;
  for (var i = 0; i < 48; i++) {
    var hour = Math.floor(i / 2);
    var minute = (i % 2) * 30;
    animation_labels.push({
      text: ("0" + hour).slice(-2) + ":" + ("0" + minute).slice(-2),
      milisec: milisec
    });
    milisec += increments;
  }
  return animation_labels;
}

function fadeMarker(marker, time) {
  setTimeout(function () {
    if (isPlaying == true && isDwelling == false) {
      marker.setZIndex(0);
      marker.setOpacity(0.5);
    }
  }, time);
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

function drawTimeline(data) {
  // Collect the data for drawing the timeline
  var pts = [];
  var td_count = 0;
  var last_month;
  var day = data["day"];
  var count = data["count"];
  for (var i = 0; i < day.length; i++) {
    var date_i = dateStringToObject(day[i]);
    var date_array = [date_i];
    var count_array = [count[i]];
    // Check if we need to pad missing days
    var date_ii;
    if (i < day.length - 1) {
      date_ii = dateStringToObject(day[i + 1]);
    } else {
      date_ii = new Date();
    }
    var diff_days = Math.floor(date_ii.getTime() - date_i.getTime()) / 86400000;
    if (diff_days > 1) {
      var date_i_time = date_i.getTime();
      for (var j = 1; j < diff_days; j++) {
        date_array.push(new Date(date_i_time + 86400000 * j));
        count_array.push(0);
      }
    }
    // Push a data point
    for (var k = 0; k < date_array.length; k++) {
      var date = date_array[k];
      var date_str = date.toDateString().split(" ");
      var label = date_str[1] + " " + date_str[2];
      pts.push([label, count_array[k], date.getTime()]);
      // Save the index if necessary (the calendar will use this)
      var month = date.getMonth();
      if (last_month != month) {
        timeline_jump_index.push(td_count);
        last_month = month;
      }
      td_count++;
    }
  }

  // Use the charting library to draw the timeline
  var chart_settings = {
    click: function ($e) {
      handleTimelineButtonClicked(parseInt($e.data("epochtime_milisec")));
    },
    select: function ($e) {
      handleTimelineButtonSelected(parseInt($e.data("epochtime_milisec")));
    },
    data: pts,
    format: ["label", "value", "epochtime_milisec"],
    dataIndexForLabels: 0,
    dataIndexForValues: 1
  };
  timeline = new EdaVizJS.FlatBlockChart("timeline-container", chart_settings);

  // Add horizontal scrolling to the timeline
  // Needed because Android <= 4.4 won't scroll without this
  addTouchHorizontalScroll($("#timeline-container"));
}

function handleTimelineButtonClicked(epochtime_milisec) {
  // Add google analytics
  var label = {
    "dimension5": epochtime_milisec.toString()
  };
  addGoogleAnalyticEvent("timeline", "click", label);
}

function handleTimelineButtonSelected(epochtime_milisec) {
  infowindow_smell.close();
  infowindow_sensor.close();
  hideSmellMarkers(current_epochtime_milisec);
  hideSensorMarkers(current_epochtime_milisec); // Will be added
  showSmellMarkers(epochtime_milisec);
  showSensorMarkers(epochtime_milisec); // Will be added
  //deleteAllSensors(); // Will be deprecated
  //loadAndDrawAllSensors(epochtime_milisec); // Will be deprecated
  stopAnimation(epochtime_milisec, current_epochtime_milisec);
  current_epochtime_milisec = epochtime_milisec;
}

function showSensorMarkers(epochtime_milisec) {
  if (typeof epochtime_milisec == "undefined") return;

  // Check if data exists in the cache
  var r = sensors_cache[epochtime_milisec];
  if (typeof r != "undefined") {
    // Make sensors markers visible on the map
    var markers = r["markers"];
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
    showOrHideAQI(r["data"]["is_current_day"]);
  } else {
    sensors_cache[epochtime_milisec] = {"markers": []};
    // For each sensor, load data from server and create a marker
    for (var i = 0; i < sensors_list.length; i++) {
      loadAndCreateSensorMarkers(epochtime_milisec, sensors_list[i], i);
    }
  }
}

function loadAndCreateSensorMarkers(epochtime_milisec, info, i) {
  var urls = genSensorDataURL(epochtime_milisec, info);
  var data = {"info": info, "is_current_day": urls["is_current_day"]};
  $.when(
    $.getJSON(urls["PM25_channels"], function (json) {
      data["PM25_channels"] = json["data"];
    }), $.getJSON(urls["PM25_channel_max"], function (json) {
      data["PM25_channel_max"] = json["data"];
    })
  ).then(function () {
    if (typeof urls["wind_channels"] != "undefined") {
      $.getJSON(urls["wind_channels"], function (json) {
        data["wind_channels"] = json["data"];
        createAndShowSensorMarker(data, epochtime_milisec, i);
        showOrHideAQI(data["is_current_day"]);
      });
    } else {
      createAndShowSensorMarker(data, epochtime_milisec, i);
      showOrHideAQI(data["is_current_day"]);
    }
  });
}

function showOrHideAQI(is_current_day) {
  // Show current Pittsburgh AQI if on current day and user is in Pittsburgh
  if (is_current_day && area == "PGH") {
    $.getJSON(aqi_root_url + "Pittsburgh", function (response) {
      if (response) {
        $(".aqi-td").text(response);
        $(".aqi-tr").show();
      }
    });
  } else {
    $(".aqi-tr").hide();
  }
}

function createAndShowSensorMarker(data, epochtime_milisec, i) {
  return new CustomMapMarker({
    "type": "sensor",
    "data": parseSensorMarkerData(data),
    "click": function (marker) {
      handleSensorMarkerClicked(marker);
    },
    "complete": function (marker) {
      // Make the maker visible on the map when the maker is created
      marker.setMap(map);
      // Cache data and markers
      sensors_cache[epochtime_milisec]["markers"][i] = marker;
      sensors_cache[epochtime_milisec]["data"] = data;
    }
  });
}

function parseSensorMarkerData(data) {
  var is_current_day = data["is_current_day"];
  var marker_data = {
    "is_current_day": is_current_day,
    "name": data["info"]["name"],
    "latitude": data["info"]["latitude"],
    "longitude": data["info"]["longitude"],
    "PM25_feed_id": data["info"]["PM25"]["feed"]
  };

  if (is_current_day) {
    ///////////////////////////////////////////////////////////////////////////////
    // If the selected day is the current day, check if the latest data is too old
    var current_time = Date.now();
    // For PM25 data
    var PM25_all = data["PM25_channels"];
    var PM25_latest = PM25_all[PM25_all.length - 1];
    var PM25_data_time = PM25_latest[0] * 1000;
    var PM25_diff_hour = (current_time - PM25_data_time) / 3600000;
    if (typeof PM25_latest == "undefined" || PM25_diff_hour > 4 || isNaN(PM25_latest[1])) {
      marker_data["PM25_value"] = -1;
    } else {
      marker_data["PM25_value"] = Math.max(-1, roundTo(parseFloat(PM25_latest[1]), 2));
    }
    marker_data["PM25_data_time"] = PM25_data_time;
    // For wind data
    var wind_all = data["wind_channels"];
    if (typeof wind_all != "undefined") {
      var wind_latest = wind_all[wind_all.length - 1];
      var wind_data_time = wind_latest[0] * 1000;
      var wind_diff_hour = (current_time - wind_data_time) / 3600000;
      if (typeof wind_latest != "undefined" && wind_diff_hour <= 4 && !isNaN(wind_latest[1]) && !isNaN(wind_latest[2])) {
        marker_data["wind_speed"] = roundTo(parseFloat(wind_latest[1]), 2);
        marker_data["wind_direction"] = roundTo(parseFloat(wind_latest[2]), 2);
      }
      marker_data["wind_data_time"] = wind_data_time;
    }
  } else {
    ///////////////////////////////////////////////////////////////////////////////
    // If the selected day is not the current day, just use the max
    // For PM25 data
    var PM25_max = data["PM25_channel_max"][0];
    if (typeof PM25_max == "undefined" || isNaN(PM25_max[1])) {
      marker_data["PM25_value"] = -1;
    } else {
      marker_data["PM25_value"] = Math.max(-1, roundTo(parseFloat(PM25_max[1]), 2));
    }
  }

  return marker_data;
}

function handleSensorMarkerClicked(marker) {
  infowindow_smell.close();
  infowindow_sensor.setContent(marker.getContent());
  infowindow_sensor.open(map, marker.getGoogleMapMarker());

  // Add google analytics
  var marker_data = marker.getData();
  var PM25_data_time = marker_data["PM25_data_time"];
  if (typeof PM25_data_time != "undefined") {
    PM25_data_time = PM25_data_time.toString();
  }
  var PM25_feed_id = marker_data["PM25_feed_id"];
  if (typeof PM25_feed_id != "undefined") {
    PM25_feed_id = PM25_feed_id.toString();
  }
  var PM25_value = marker_data["PM25_value"];
  var label = {
    "dimension5": PM25_data_time,
    "dimension6": PM25_feed_id,
    "metric2": PM25_value
  };
  addGoogleAnalyticEvent("sensor", "click", label);
}

function hideSensorMarkers(epochtime_milisec) {
  var r = sensors_cache[epochtime_milisec];
  if (typeof r == "undefined") return;
  var current_markers = r["markers"];
  for (var i = 0; i < current_markers.length; i++) {
    current_markers[i].setMap(null);
    current_markers[i].reset();
  }
}

function genSensorDataURL(epochtime_milisec, info) {
  var epochtime = parseInt(epochtime_milisec / 1000);
  var time_range_url_part = "/export?format=json&from=" + epochtime + "&to=" + (epochtime + 86399);

  // For PM25
  var data_url_PM25_channels;
  var data_url_PM25_channel_max;
  if (typeof info["PM25"] != "undefined") {
    var data_url_PM25 = esdr_root_url + "feeds/" + info["PM25"]["feed"] + "/channels/";
    data_url_PM25_channels = data_url_PM25 + info["PM25"]["channels"].toString() + time_range_url_part;
    data_url_PM25_channel_max = data_url_PM25 + info["PM25"]["channel_max"] + time_range_url_part;
  }

  // For wind
  var data_url_wind_channels;
  if (typeof info["wind"] != "undefined") {
    var data_url_wind = esdr_root_url + "feeds/" + info["wind"]["feed"] + "/channels/";
    data_url_wind_channels = data_url_wind + info["wind"]["channels"].toString() + time_range_url_part;
  }

  // Channel max values are not calculated until 3am, so to be safe we wait until 4.
  var date_str_sensor = (new Date(epochtime_milisec)).toDateString();
  var date_str_now = (new Date()).toDateString();
  var date_hour_now = (new Date()).getHours();
  var is_current_day = false;
  if (date_str_sensor == date_str_now && date_hour_now >= 4) {
    is_current_day = true;
  }

  return {
    "PM25_channels": data_url_PM25_channels,
    "PM25_channel_max": data_url_PM25_channel_max,
    "wind_channels": data_url_wind_channels,
    "is_current_day": is_current_day
  };
}

$(function () {
  init();
});

////////////////////////////////////////////////////////////////////////
// The below part of code will be deprecated

function loadAndDrawAllSensors(epochtime_milisec) {
  sensorLoadCount = 0;
  loadAndDrawSingleSensor(epochtime_milisec);
}

function loadAndDrawSingleSensor(epochtime_milisec) {
  var info = sensorList[sensorLoadCount];
  var sensor = {};
  var date_str_sensor = (new Date(epochtime_milisec)).toDateString();
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
  var epochtime = parseInt(epochtime_milisec / 1000);
  if (date_str_sensor == date_str_now || date_hour_now < 4) {
    data_url = feed_url + "/channels/" + info.channels.toString() + "/export?format=json&from=" + epochtime + "&to=" + (epochtime + 86399);
    use_PM25_now = true;
  } else if (info["channel_max"]) {
    data_url = feed_url + "/channels/" + info["channel_max"] + "/export?format=json&from=" + epochtime + "&to=" + (epochtime + 86399);
    use_PM25_now = false;
  }

  // Show current Pittsburgh AQI if on current day and user is in Pittsburgh
  if (use_PM25_now && area == "PGH") {
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
  (function () {
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
  })().then(function () {
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
      loadAndDrawSingleSensor(epochtime_milisec, info[sensorLoadCount]);
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

  var icon_idx = sensorValToIconIndex(val);
  var markerArray, rotation = 0;
  if (typeof(sensor["wind_speed"]) !== "undefined" && typeof(sensor["wind_direction"]) !== "undefined") {
    markerArray = sensor_and_wind_icons;
    // The direction given by ACHD is the direction _from_ which the wind is coming.
    // We reverse it to show where the wind is going to. (+180)
    // Also, the arrow we start with is already rotated 90 degrees, so we need to account for this. (-90)
    // This means we add 90 to the sensor wind direction value for the correct angle of the wind arrow.
    rotation = sensor["wind_direction"] + 90;
  } else {
    markerArray = sensor_icons;
  }

  // Add marker
  var image = new Image();
  image.addEventListener("load", function () {
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
      zIndex: icon_idx,
      opacity: 1
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

  image.src = "/img/" + markerArray[icon_idx];
}

function sensorValToIconIndex(val) {
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
