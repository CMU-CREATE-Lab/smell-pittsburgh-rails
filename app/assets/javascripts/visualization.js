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
var smell_reports_jump_index = [];
var zoom_level_to_smell_icon_size = [24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 36, 60, 90, 180, 240, 360];
var previous_icon_size;
var no_data_txt = "No data in last four hours.";
var infowindow_smell;
var infowindow_sensor;
var sensor_color_wind = ["sensor_0_wind.png", "sensor_1_wind.png", "sensor_2_wind.png", "sensor_3_wind.png", "sensor_4_wind.png", "sensor_5_wind.png"];
var sensor_color = ["sensor_0.png", "sensor_1.png", "sensor_2.png", "sensor_3.png", "sensor_4.png", "sensor_5.png"];
var smell_value_text = ["Just fine!", "Barely noticeable", "Definitely noticeable",
  "It's getting pretty bad", "About as bad as it gets!"
];
var smell_markers = [];
var selected_epochtime_milisec;

// Animation variables
var isPlaying = false;
var isDwelling = false;
var $playback_button;
var animate_smell_report_interval = null;
var smell_reports_cache_hist = {};
var $playback_txt;
var animation_labels;

// Calendar variables
var month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var $calendar_dialog;
var $calendar;
var $dialog_ok_button;

// Timeline variables
var timeline;

// Sensor variables
// NOTE: Put all sensors that are not drawn first.
// This is needed so that the data is available for the sensors that are drawn.
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

function init() {
  // Create the page
  initGoogleMapAndHomeButton();
  initCalendarButtonAndDialog();
  initAnimationUI();

  // Load data
  loadCalendar();
  loadTimeline();

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

  // Add events
  map.addListener('zoom_changed', function () {
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
      var desired_index = smell_reports_jump_index[$selected.val()];
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
      stopAnimation();
    } else {
      startAnimation();
    }
  });
  $playback_txt = $("#playback-txt");
}

function loadCalendar() {
  $.ajax({
    url: genSmellURL("month"),
    success: function (data) {
      drawCalendar(data);
    },
    error: function (response) {
      console.log("server error:", response);
    }
  });
}

function loadTimeline() {
  $.ajax({
    url: genSmellURL("day"),
    success: function (data) {
      drawTimeline(data);
      timeline.selectLastBlock();
    },
    error: function (response) {
      console.log("server error:", response);
    }
  });
}

function loadAndDrawSmellReports(epochtime_milisec) {
  selected_epochtime_milisec = epochtime_milisec;
  // Check if data exists in the cache
  var data = smell_reports_cache[epochtime_milisec];
  if (typeof data != "undefined") {
    // Draw smell reports
    for (var i = 0; i < data.length; i++) {
      drawSingleSmellReport(data[i]);
    }
  } else {
    // Load data from server
    $.ajax({
      url: genSmellURL(new Date(epochtime_milisec)),
      success: function (data) {
        // Cache data
        smell_reports_cache[epochtime_milisec] = data;
        // Draw smell reports
        for (var i = 0; i < data.length; i++) {
          drawSingleSmellReport(data[i]);
        }
        // Bin smell reports
        smell_reports_cache_hist[epochtime_milisec] = histSmellReport(data);
      },
      error: function (response) {
        console.log("server error:", response);
      }
    });
  }
}

function genSmellURL(date_obj) {
  var api_paras;
  if (date_obj == "month") {
    api_paras = "aggregate=month";
  } else if (date_obj == "day") {
    var min_smell_value = 3;
    var timezone_offset = new Date().getTimezoneOffset();
    api_paras = "aggregate=day&min_smell_value=" + min_smell_value + "&timezone_offset=" + timezone_offset;
  } else {
    date_obj = typeof date_obj == "undefined" ? new Date() : date_obj;
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
    api_paras += "&area=" + area + "&start_time=" + parseInt(init_date.getTime() / 1000);
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

function startAnimation() {
  if (isPlaying == true) return;
  isPlaying = true;
  isDwelling = false;

  var reports = smell_reports_cache[selected_epochtime_milisec];
  if (animate_smell_report_interval != null || reports.length == 0) return;

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
  deleteAllSmellReports();
  var label_idx = 0;
  $playback_txt.text(label[label_idx]["text"]);

  // Start animation
  animate_smell_report_interval = setInterval(function () {
    if (elapsed_milisec < 86400000) {
      // This condition means that we need to animate smell reports
      // Draw smell reports
      for (var i = r_idx; i < reports.length - 1; i++) {
        if ((reports[i]["created_at"] * 1000) <= (selected_epochtime_milisec + elapsed_milisec)) {
          var marker = drawSingleSmellReport(reports[i]);
          fadeGoogleMapMarker(marker, marker_fade_milisec);
        } else {
          r_idx = i;
          break;
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
      deleteAllSmellReports();
      label_idx = 0;
      $playback_txt.text(label[label_idx]["text"]);
    }
    elapsed_milisec += increments_per_frame;
  }, interval);
}

function stopAnimation() {
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
  deleteAllSmellReports();
  loadAndDrawSmellReports(selected_epochtime_milisec);
}

function getAnimationLabels() {
  if (typeof animation_labels != "undefined") return animation_labels;
  animation_labels = [];
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

function fadeGoogleMapMarker(marker, time) {
  setTimeout(function () {
    if (isPlaying == true && isDwelling == false) {
      marker.setZIndex(0);
      marker.setOpacity(0.3);
    }
  }, time);
}

function drawSingleSmellReport(report_i) {
  var latlng = {"lat": report_i.latitude, "lng": report_i.longitude};

  // Add marker
  var date = new Date(report_i.created_at * 1000);
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
    opacity: 1
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

  return marker;
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
        smell_reports_jump_index.push(td_count);
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
  deleteAllSmellReports();
  loadAndDrawSmellReports(epochtime_milisec);
  deleteAllSensors();
  loadAndDrawAllSensors(epochtime_milisec);
  stopAnimation();
}

function isMobile() {
  var useragent = navigator.userAgent;
  return useragent.indexOf("iPhone") != -1 || useragent.indexOf("Android") != -1;
}

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
      zIndex: color_idx,
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
  $(elem).on("touchstart", function (e) {
    startTime = new Date().getTime();
    newPos = 0;
    endTouchX = null;
    startTouchX = e.originalEvent.touches[0].pageX;
    scrollStartPos = this.scrollLeft + startTouchX;
    e.preventDefault();
  }).on("touchmove", function (e) {
    endTouchX = e.originalEvent.touches[0].pageX;
    newPos = scrollStartPos - endTouchX;
    this.scrollLeft = newPos;
    e.preventDefault();
  }).on("touchend touchcancel", function (e) {
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

$(function () {
  init();
});
