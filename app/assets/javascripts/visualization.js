"use strict";

// Staging testing features
var animate_smell_text = true; // This is for animating smell descriptions
var show_voc_sensors = true; // This is for showing VOC sensors on the map

// URL variables
var api_url = "/api/v1/smell_reports?";
var aqi_root_url = "http://api.smellpittsburgh.org/api/v1/get_aqi?city=";

// Google map variables
var map;
var area;
var init_latlng = {};
var default_latLng = {"lat": at_latitude, "lng": at_longitude};
var init_date;
var init_zoom_desktop = at_zoom+1;
var init_zoom_mobile = at_zoom;

// Smell reports variables
var smell_reports_cache = {};
var current_epochtime_milisec;
var infowindow_smell;

// Animation variables
var isPlaying = false;
var isDwelling = false;
var isPaused = false;
var animate_interval = null;
var $playback_button;
var $stop_button;
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
var infowindow_PM25;
var infowindow_VOC;
var sensors_list = [
  {
    name: "County AQ Monitor - Liberty",
    sensors: {
      wind_speed: {
        sources: [{
          feed: 28,
          channel: "SONICWS_MPH"
        }]
      },
      wind_direction: {
        sources: [{
          feed: 28,
          channel: "SONICWD_DEG"
        }]
      },
      PM25: {
        sources: [{
          feed: 29,
          channel: "PM25_UG_M3"
        }]
      }
    },
    latitude: 40.32377,
    longitude: -79.86806
  }, {
    name: "County AQ Monitor - Lawrenceville",
    sensors: {
      wind_speed: {
        sources: [{
          feed: 26,
          channel: "SONICWS_MPH"
        }]
      },
      wind_direction: {
        sources: [{
          feed: 26,
          channel: "SONICWD_DEG"
        }]
      },
      PM25: {
        sources: [{
          feed: 26,
          channel: "PM25B_UG_M3"
        }]
      }
    },
    latitude: 40.46542,
    longitude: -79.960757
  }, {
    name: "County AQ Monitor - Parkway East",
    sensors: {
      wind_speed: {
        sources: [{
          feed: 43,
          channel: "SONICWS_MPH"
        }, {
          feed: 11067,
          channel: "SONICWD_DEG"
        }]
      },
      wind_direction: {
        sources: [{
          feed: 43,
          channel: "SONICWD_DEG"
        }, {
          feed: 11067,
          channel: "SONICWD_DEG"
        }]
      },
      PM25: {
        sources: [{
          feed: 43,
          channel: "PM25T_UG_M3"
        }, {
          feed: 11067,
          channel: "PM25T_UG_M3"
        }]
      }
    },
    latitude: 40.43743,
    longitude: -79.86357
  }, {
    name: "County AQ Monitor - Avalon",
    sensors: {
      wind_speed: {
        sources: [{
          feed: 1,
          channel: "SONICWS_MPH"
        }]
      },
      wind_direction: {
        sources: [{
          feed: 1,
          channel: "SONICWD_DEG"
        }]
      },
      PM25: {
        sources: [{
          feed: 1,
          channel: "PM25B_UG_M3"
        }, {
          feed: 1,
          channel: "PM25T_UG_M3"
        }]
      }
    },
    latitude: 40.49977,
    longitude: -80.07134
  }, {
    name: "County AQ Monitor - Lincoln",
    sensors: {
      PM25: {
        sources: [{
          feed: 30,
          channel: "PM25_UG_M3"
        }]
      }
    },
    latitude: 40.30822,
    longitude: -79.86913
  }
];

function init() {
  // Check if enabling staging features or not
  if (show_voc_sensors) {
    $(".voc-legend-row").show();
    sensors_list.push({
      name: "Lloyd Ave at Chestnut St Outdoors AWAIR",
      sensors: {
        VOC: {
          sources: [{
            feed: 11079,
            channel: "voc"
          }]
        }
      },
      latitude: 40.427418,
      longitude: -79.882734
    });
    sensors_list.push({
      name: "Dawson St at Frazier St AWAIR",
      sensors: {
        VOC: {
          sources: [{
            feed: 7715,
            channel: "voc"
          }]
        }
      },
      latitude: 40.429782,
      longitude: -79.954246
    });
    sensors_list.push({
      name: "Ludwick St at Landview Rd AWAIR",
      sensors: {
        VOC: {
          sources: [{
            feed: 7713,
            channel: "voc"
          }]
        }
      },
      latitude: 40.421608,
      longitude: -79.925038
    });
    sensors_list.push({
      name: "Monroe Ave at Upston St AWAIR",
      sensors: {
        VOC: {
          sources: [{
            feed: 7768,
            channel: "voc"
          }]
        }
      },
      latitude: 40.344799,
      longitude: -79.875582
    });
  }

  // // Listen to hash var changes
  // $(window).on('hashchange', onHashChange).trigger('hashchange');

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
  if (!init_latlng.lat && !init_latlng.lng) {
    init_latlng = default_latLng;
  }
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
    clickableIcons: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    gestureHandling: "greedy"
  });

  // Update marker size when users zoom the map
  map.addListener("zoom_changed", function () {
    var current_markers = smell_reports_cache[current_epochtime_milisec]["markers"];
    var current_zoom_level = map.getZoom();
    for (var i = 0; i < current_markers.length; i++) {
      current_markers[i].updateIconByZoomLevel(current_zoom_level);
    }
  });

  // Set information window
  infowindow_smell = new google.maps.InfoWindow({
    pixelOffset: new google.maps.Size(-1, 0),
    maxWidth: 250
  });
  infowindow_PM25 = new google.maps.InfoWindow({
    pixelOffset: new google.maps.Size(0, 37),
    maxWidth: 250
  });
  infowindow_VOC = new google.maps.InfoWindow({
    pixelOffset: new google.maps.Size(0, 0),
    maxWidth: 250
  });

  // Change the style of the info window
  infowindow_smell.addListener("domready", function () {
    styleInfoWindowCloseButton();
  });
  infowindow_PM25.addListener("domready", function () {
    styleInfoWindowCloseButton();
  });
  infowindow_VOC.addListener("domready", function () {
    styleInfoWindowCloseButton();
  });

  // Add event to the home button
  $("#home-btn").on("click", function () {
    map.setCenter(init_latlng);
    map.setZoom(isMobile() ? init_zoom_mobile : init_zoom_desktop);
  });

  // Add event to the terrain button
  $("#terrain-btn").on("click", function () {
    var $this = $(this);
    var label = {
      "dimension5": current_epochtime_milisec.toString()
    };
    if ($this.hasClass("button-pressed")) {
      map.setMapTypeId("roadmap");
      $this.removeClass("button-pressed");
      addGoogleAnalyticEvent("set-to-roadmap-view", "click", label);
    } else {
      map.setMapTypeId("terrain");
      $this.addClass("button-pressed");
      addGoogleAnalyticEvent("set-to-terrain-view", "click", label);
    }
  });
}

function onHashChange() {
  // // we used to handle latLng on hashchange, but since this wasn't needed we let it get handled in the rails controller
  // var hash = window.location.hash.slice(1).split("&");
}

function styleInfoWindowCloseButton() {
  $(".gm-style-iw").next().css({
    "-ms-transform": "scale(1.3, 1.3)",
    "-webkit-transform": "scale(1.3, 1.3)",
    "transform": "scale(1.3, 1.3)"
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
  $playback_txt = $("#playback-txt");
  $playback_button = $("#playback-btn");
  $stop_button = $("#stop-btn");

  $playback_button.on("click", function () {
    var label = {
      "dimension5": current_epochtime_milisec.toString()
    };
    if (isPlaying) {
      if (isPaused) {
        resumeAnimation();
        addGoogleAnalyticEvent("resume-animation", "click", label);
      } else {
        pauseAnimation();
        addGoogleAnalyticEvent("pause-animation", "click", label);
      }
    } else {
      startAnimation(current_epochtime_milisec);
      addGoogleAnalyticEvent("start-animation", "click", label);
    }
  });

  $stop_button.on("click", function () {
    var label = {
      "dimension5": current_epochtime_milisec.toString()
    };
    if (isPlaying) {
      stopAnimation(current_epochtime_milisec, current_epochtime_milisec);
      addGoogleAnalyticEvent("stop-animation", "click", label);
    }
  });
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
    //"url": genSmellURL({"aggregate": "day_and_smell_value"}), // this is used for colored timeline
    "success": function (data) {
      drawTimeline(data);
      //drawTimelineWithColor(data); // this is used for colored timeline
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
    // Load data from server and create all smell markers
    smell_reports_cache[epochtime_milisec] = {"markers": []};
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
      // Make sure that the desired time matches the current time
      // (if user selects the time block too fast, they will be different)
      if (epochtime_milisec == current_epochtime_milisec) {
        marker.setMap(map);
      }
      // Cache markers
      smell_reports_cache[epochtime_milisec]["markers"].push(marker);
    }
  });
}

function handleSmellMarkerClicked(marker) {
  if (isPlaying) return;

  infowindow_PM25.close();
  infowindow_VOC.close();
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
  var api_paras = "";
  if (typeof method != "undefined" && method["aggregate"] == "month") {
    api_paras += "aggregate=month";
  } else if (typeof method != "undefined" && method["aggregate"] == "day") {
    var min_smell_value = 3;
    var timezone_offset = new Date().getTimezoneOffset();
    api_paras += "aggregate=day";
    api_paras += "&min_smell_value=" + min_smell_value;
    api_paras += "&timezone_offset=" + timezone_offset;
  } else if (typeof method != "undefined" && method["aggregate"] == "day_and_smell_value") {
    var timezone_offset = new Date().getTimezoneOffset();
    api_paras += "aggregate=day_and_smell_value";
    api_paras += "&timezone_offset=" + timezone_offset;
  } else {
    // Get only the smell reports for one day
    var date_obj = typeof method == "undefined" ? new Date() : new Date(method["epochtime_milisec"]);
    var y = date_obj.getFullYear();
    var m = date_obj.getMonth();
    var d = date_obj.getDate();
    var start_time = parseInt((new Date(y, m, d).getTime()) / 1000);
    var end_time = start_time + 86399;
    api_paras += "start_time=" + start_time;
    api_paras += "&end_time=" + end_time;
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

function drawCalendar(data) {
  var month_arr = data.month;
  var today = new Date();
  $calendar.append($('<option value="' + -1 + '" data-year="' + today.getFullYear() + '" data-month="' + today.getMonth() + '">Today</option>'));
  for (var i = month_arr.length - 1; i >= 0; i--) {
    var year = month_arr[i][0];
    var month = month_arr[i][1];
    $calendar.append($('<option value="' + i + '" data-year="' + year + '" data-month="' + month + '">' + month_names[month - 1] + ' ' + year + '</option>'));
  }
}

function drawTimelineWithColor(data) {
  // Compute the weighted mean of smell reports
  var day_and_smell_value = data["day_and_smell_value"];
  var count = data["count"];
  var sum = {};
  var n = {};
  for (var i = 0; i < day_and_smell_value.length; i++) {
    var d_i = day_and_smell_value[i];
    if (typeof sum[d_i[0]] == "undefined") {
      sum[d_i[0]] = d_i[1] * count[i];
    } else {
      sum[d_i[0]] += d_i[1] * count[i];
    }
    if (typeof n[d_i[0]] == "undefined") {
      n[d_i[0]] = count[i];
    } else {
      n[d_i[0]] += count[i];
    }
  }
  var weighted_mean = {};
  var num_reports = {};
  for (var key in sum) {
    // Convert all keys to epochtime
    weighted_mean[dateStringToObject(key).getTime()] = roundTo(sum[key] / n[key], 2);
    num_reports[dateStringToObject(key).getTime()] = n[key]
  }

  // Pad missing dates
  var t_all = Object.keys(weighted_mean).map(Number);
  var min_dt = new Date(Math.min.apply(null, t_all));
  var max_dt = new Date(Math.max.apply(null, t_all));
  var current_dt = min_dt;
  while (current_dt <= max_dt) {
    var t_str = current_dt.getTime().toString();
    if (typeof weighted_mean[t_str] == "undefined") {
      weighted_mean[t_str] = 0;
      num_reports[t_str] = 0;
    }
    current_dt.setDate(current_dt.getDate() + 1);
  }

  // Construct data points
  var t_all = Object.keys(weighted_mean).map(Number).sort(function (a, b) {
    return a - b
  });
  var pts = [];
  var td_count = 0;
  var last_month;
  for (var i = 0; i < t_all.length; i++) {
    var t = t_all[i];
    var dt = new Date(t);
    var dt_str = dt.toDateString().split(" ");
    var label = dt_str[1] + " " + dt_str[2];
    pts.push([label, weighted_mean[t.toString()], num_reports[t.toString()], t]);
    // Save the index if necessary (the calendar will use this)
    var month = dt.getMonth();
    if (typeof last_month == "undefined" || last_month != month) {
      timeline_jump_index.push(td_count);
      last_month = month;
    }
    td_count++;
  }
  timeline_jump_index.push(td_count);

  // Use the charting library to draw the timeline
  var chart_settings = {
    click: function ($e) {
      handleTimelineButtonClicked(parseInt($e.data("epochtime_milisec")));
    },
    select: function ($e) {
      handleTimelineButtonSelected(parseInt($e.data("epochtime_milisec")));
    },
    data: pts,
    format: ["label", "color", "height", "epochtime_milisec"],
    dataIndexForLabels: 0, // format[0] is for the label of the block
    dataIndexForColors: 1, // format[1] is for the color of the block
    dataIndexForHeights: 2, // format[2] is for the height of the block
    useColorQuantiles: true, // use quantile color scale instead of the default linear one
    colorBin: [1, 2, 2.5, 3, 3.5],
    colorRange: ["#dcdcdc", "#52b947", "#f3ec19", "#f57e20", "#ed1f24", "#991b4f"],
    heightBin: [30],
    heightRange: ["50%", "100%"]
  };
  timeline = new EdaVizJS.FlatBlockChart("timeline-container", chart_settings);

  // Add horizontal scrolling to the timeline
  // Needed because Android <= 4.4 won't scroll without this
  addTouchHorizontalScroll($("#timeline-container"));
}

function drawTimeline(data) {
  // Collect the data for drawing the timeline
  var batches = [];
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
    // when checking for gaps in time, subtract timezone offset
    var diff_days = Math.floor((date_ii.getTime() - date_ii.getTimezoneOffset()*60000) - (date_i.getTime() - date_i.getTimezoneOffset()*60000)) / 86400000;
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
      if (typeof last_month == "undefined") {
        last_month = month;
        timeline_jump_index.push(td_count);
      }
      if (last_month != month) {
        batches.push(pts);
        pts = [];
        timeline_jump_index.push(td_count);
        last_month = month;
      }
      td_count++;
    }
  }
  batches.push(pts);
  timeline_jump_index.push(td_count);

  // Use the charting library to draw the timeline
  var chart_settings = {
    click: function ($e) {
      handleTimelineButtonClicked(parseInt($e.data("epochtime_milisec")));
    },
    select: function ($e) {
      handleTimelineButtonSelected(parseInt($e.data("epochtime_milisec")));
    },
    data: batches,
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
  infowindow_PM25.close();
  infowindow_VOC.close();
  hideSmellMarkers(current_epochtime_milisec);
  showSmellMarkers(epochtime_milisec);
  hideSensorMarkers(current_epochtime_milisec);
  showSensorMarkers(epochtime_milisec);
  stopAnimation(epochtime_milisec, current_epochtime_milisec);
  current_epochtime_milisec = epochtime_milisec;
}

function showSensorMarkers(epochtime_milisec) {
  if (typeof epochtime_milisec == "undefined") return;

  // Check if data exists in the cache
  var r = sensors_cache[epochtime_milisec];
  if (typeof r != "undefined") {
    // Show the AQI if needed
    showOrHideAQI(r["is_current_day"]);
    // Make sensors markers visible on the map
    var markers = r["markers"];
    for (var i = 0; i < markers.length; i++) {
      if (typeof markers[i] != "undefined") {
        markers[i].setMap(map);
      }
    }
  } else {
    // Check if current day
    var date_str_sensor = (new Date(epochtime_milisec)).toDateString();
    var date_str_now = (new Date()).toDateString();
    var is_current_day = date_str_sensor === date_str_now;
    // Show the AQI if needed
    showOrHideAQI(is_current_day);
    // For each sensor, load data from server and create a marker
    sensors_cache[epochtime_milisec] = {"markers": [], "marker_table": []};
    for (var i = 0; i < sensors_list.length; i++) {
      loadAndCreateSensorMarkers(epochtime_milisec, sensors_list[i], is_current_day, i);
    }
  }
}

function loadAndCreateSensorMarkers(epochtime_milisec, info, is_current_day, i) {
  // Generate a list of urls that we need to request
  var urls = generateSensorDataUrlList(epochtime_milisec, info);

  // Request urls and load all sensor data
  loadSensorData(urls, function (responses) {
    // Merge all sensor data
    var data = formatAndMergeSensorData(responses, info);
    // Roll the sensor data to fill in some missing values
    data = rollSensorData(data, info);
    // For VOC sensors with faster sampling rates, we need to average data points
    data = aggregateSensorData(data, info);
    // Create markers
    createAndShowSensorMarker(data, epochtime_milisec, is_current_day, info, i);
    createMarkerTableFromSensorData(data, epochtime_milisec, info, i);
  });
}

function createAndShowSensorMarker(data, epochtime_milisec, is_current_day, info, i) {
  return new CustomMapMarker({
    "type": getSensorType(info),
    "data": parseSensorMarkerData(data, is_current_day, info),
    "click": function (marker) {
      handleSensorMarkerClicked(marker);
    },
    "complete": function (marker) {
      // Make the maker visible on the map when the maker is created
      // Make sure that the desired time matches the current time
      // (if user selects the time block too fast, they will be different)
      if (epochtime_milisec == current_epochtime_milisec) {
        marker.setMap(map);
      }
      // Cache markers
      sensors_cache[epochtime_milisec]["is_current_day"] = is_current_day;
      sensors_cache[epochtime_milisec]["markers"][i] = marker;
    }
  });
}

function parseSensorMarkerData(data, is_current_day, info, i) {
  var sensor_type = getSensorType(info);
  var marker_data = {
    "is_current_day": is_current_day,
    "name": info["name"],
    "latitude": info["latitude"],
    "longitude": info["longitude"],
    "feed_id": info["sensors"][sensor_type]["sources"][0]["feed"]
  };

  if (is_current_day) {
    ///////////////////////////////////////////////////////////////////////////////
    // If the selected day is the current day
    if (typeof i === "undefined") {
      i = data["data"].length - 1;
    }
    var d = data["data"][i];
    if (typeof d === "undefined") return marker_data;
    // For PM25 or VOC (these two types cannot both show up in info)
    if (typeof d[sensor_type] !== "undefined") {
      if (typeof d[sensor_type] === "object") {
        marker_data["sensor_value"] = roundTo(d[sensor_type]["value"], 2);
        marker_data["sensor_data_time"] = d[sensor_type]["time"] * 1000;
      } else {
        marker_data["sensor_value"] = roundTo(d[sensor_type], 2);
        marker_data["sensor_data_time"] = d["time"] * 1000;
      }
    }
    // For wind direction
    if (typeof d["wind_direction"] !== "undefined") {
      if (typeof d["wind_direction"] === "object") {
        marker_data["wind_direction"] = roundTo(d["wind_direction"]["value"], 2);
        marker_data["wind_data_time"] = d["wind_direction"]["time"] * 1000;
      } else {
        marker_data["wind_direction"] = roundTo(d["wind_direction"], 2);
        marker_data["wind_data_time"] = d["time"] * 1000;
      }
    }
    // For wind speed
    if (typeof d["wind_speed"] !== "undefined") {
      if (typeof d["wind_speed"] === "object") {
        marker_data["wind_speed"] = roundTo(d["wind_speed"]["value"], 2);
      } else {
        marker_data["wind_speed"] = roundTo(d["wind_speed"], 2);
      }
    }
  } else {
    ///////////////////////////////////////////////////////////////////////////////
    // If the selected day is not the current day, use the max
    var data_max = data["summary"]["max"];
    if (typeof data_max[sensor_type] !== "undefined") {
      marker_data["sensor_value"] = roundTo(data_max[sensor_type]["value"], 2);
      marker_data["sensor_data_time"] = data_max[sensor_type]["time"] * 1000;
    }
  }

  return marker_data;
}

function handleSensorMarkerClicked(marker) {
  infowindow_smell.close();

  var marker_type = marker.getMarkerType();
  if (marker_type == "PM25") {
    infowindow_VOC.close();
    infowindow_PM25.setContent(marker.getContent());
    infowindow_PM25.open(map, marker.getGoogleMapMarker());
  } else if (marker_type == "VOC") {
    infowindow_PM25.close();
    infowindow_VOC.setContent(marker.getContent());
    infowindow_VOC.open(map, marker.getGoogleMapMarker());
  }

  // Add google analytics
  var marker_data = marker.getData();
  var sensor_data_time = marker_data["sensor_data_time"];
  if (typeof sensor_data_time != "undefined") {
    sensor_data_time = sensor_data_time.toString();
  }
  var feed_id = marker_data["feed_id"];
  if (typeof feed_id != "undefined") {
    feed_id = feed_id.toString();
  }
  var sensor_value = marker_data["sensor_value"];
  var label = {
    "dimension5": sensor_data_time,
    "dimension6": feed_id,
    "metric2": sensor_value
  };
  addGoogleAnalyticEvent("sensor", "click", label);
}

function createMarkerTableFromSensorData(data, epochtime_milisec, info, i) {
  // When animating, we are actually hiding and showing all pre-created markers
  // Create a table of sensor markers that correspond to different timestamps for animation
  // One dimension is the marker itself
  // One dimension is the timestamp
  sensors_cache[epochtime_milisec]["marker_table"][i] = [];
  for (var j = 0; j < data["data"].length; j++) {
    var marker_data = parseSensorMarkerData(data, true, info, j);
    createSensorMarkerForAnimation(marker_data, epochtime_milisec, info, i, j);
  }
}

function createSensorMarkerForAnimation(marker_data, epochtime_milisec, info, i, j) {
  return new CustomMapMarker({
    "type": getSensorType(info),
    "data": marker_data,
    "complete": function (marker) {
      // Cache markers
      sensors_cache[epochtime_milisec]["marker_table"][i][j] = marker;
    }
  });
}

function getSensorType(info) {
  var sensor_type;
  if (Object.keys(info["sensors"]).indexOf("PM25") > -1) {
    sensor_type = "PM25";
  } else if (Object.keys(info["sensors"]).indexOf("VOC") > -1) {
    sensor_type = "VOC";
  }
  return sensor_type;
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

function hideSensorMarkerTable(epochtime_milisec) {
  var r = sensors_cache[epochtime_milisec];
  if (typeof r == "undefined") return;
  var current_marker_table = r["marker_table"];
  for (var i = 0; i < current_marker_table.length; i++) {
    var current_markers = current_marker_table[i];
    for (var j = 0; j < current_markers.length; j++) {
      current_markers[j].setMap(null);
    }
  }
}

function hideSensorMarkers(epochtime_milisec) {
  // Hide markers
  var r = sensors_cache[epochtime_milisec];
  if (typeof r == "undefined") return;
  var current_markers = r["markers"];
  for (var i = 0; i < current_markers.length; i++) {
    if (typeof current_markers[i] != "undefined") {
      current_markers[i].setMap(null);
    }
  }
}

function generateSensorDataUrlList(epochtime_milisec, info) {
  var esdr_root_url = "https://esdr.cmucreatelab.org/api/v1/";
  var epochtime = parseInt(epochtime_milisec / 1000);
  var time_range_url_part = "/export?format=json&from=" + epochtime + "&to=" + (epochtime + 86399);

  // Parse sensor info into several urls (data may come from different feeds and channels)
  var sensors = info["sensors"];
  var feeds_to_channels = {};
  for (var k in sensors) {
    var sources = sensors[k]["sources"];
    for (var i = 0; i < sources.length; i++) {
      var s = sources[i];
      var feed = s["feed"];
      var channel = s["channel"];
      if (feed in feeds_to_channels) {
        feeds_to_channels[feed].push(channel);
      } else {
        feeds_to_channels[feed] = [channel];
      }
    }
  }

  // Assemble urls
  var urls = [];
  for (var f in feeds_to_channels) {
    urls.push(esdr_root_url + "feeds/" + f + "/channels/" + feeds_to_channels[f].toString() + time_range_url_part);
  }

  return urls;
}

function loadSensorData(urls, callback) {
  var deferreds = [];
  var responses = [];
  for (var i = 0; i < urls.length; i++) {
    deferreds.push($.getJSON(urls[i], function (json) {
      responses.push(json);
    }));
  }
  $.when.apply($, deferreds).then(function () {
    if (typeof callback === "function") {
      callback(responses);
    }
  });
}

function formatAndMergeSensorData(responses, info, method) {
  // TODO: implement more methods for merging, e.g. average
  //method = typeof method === "undefined" ? "last" : method;

  ////////////////////////////////////////////////////////////////
  // First pass: loop through all responses and merge data points
  ////////////////////////////////////////////////////////////////
  var data = {};
  for (var i = 0; i < responses.length; i++) {
    var r = responses[i];
    // Get the channel names
    var channel_names = [];
    for (var j = 0; j < r["channel_names"].length; j++) {
      var c = r["channel_names"][j];
      var c_split = c.split(".");
      channel_names.push(c_split[c_split.length - 1]);
    }
    // Loop through all data points in each response
    for (var k = 0; k < r["data"].length; k++) {
      var d = r["data"][k];
      var key = d[0]; // Use epochtime as the key
      if (typeof data[key] === "undefined") {
        data[key] = {};
      }
      for (var m = 1; m < d.length; m++) {
        // This assume that the last data source overrides the previous ones.
        // If the later source has the channel name that appears before,
        // it will override the data in that channel.
        if (d[m] !== null) {
          data[key][channel_names[m - 1]] = d[m];
        }
      }
    }
  }

  ////////////////////////////////////////////////////////////////
  // Second pass: merge channels and rename them
  // Also find the latest one and the max
  // (one sensor can have data from different channels)
  ////////////////////////////////////////////////////////////////
  var sensors_to_channels = {};
  for (var sensor_name in info["sensors"]) {
    var s = info["sensors"][sensor_name];
    // Get the unique set of channel names
    var channel_names = [];
    for (var i = 0; i < s["sources"].length; i++) {
      channel_names.push(s["sources"][i]["channel"]);
    }
    if (channel_names.length > 1) {
      channel_names = Array.from(new Set(channel_names));
    }
    sensors_to_channels[sensor_name] = channel_names;
  }
  // Sort the epoch times
  var t_all = Object.keys(data).map(Number).sort(function (a, b) {
    return a - b;
  });
  // Loop through all data points and merge channels
  var data_merged = [];
  var data_max = {};
  for (var i = 0; i < t_all.length; i++) {
    var t = t_all[i];
    var tmp = {time: t};
    // Loop through channels
    for (var sensor_name in sensors_to_channels) {
      var channel_names = sensors_to_channels[sensor_name];
      for (var j = 0; j < channel_names.length; j++) {
        var d = data[t][channel_names[j]];
        // The new data will override the old ones
        if (typeof d !== "undefined") {
          tmp[sensor_name] = d;
          if (typeof data_max[sensor_name] === "undefined" || d > data_max[sensor_name]["value"]) {
            data_max[sensor_name] = {
              time: t,
              value: d
            };
          }
        }
      }
    }
    data_merged.push(tmp);
  }

  return {
    data: data_merged,
    summary: {
      max: data_max
    }
  };
}

// Fill in missing values based on previous observed ones
function rollSensorData(data, info) {
  var data = $.extend({}, data); // copy object

  // Fill in missing values
  var cache = {}; // cache previous observations
  var threshold = 3600; // one hour to look back
  for (var i = 0; i < data["data"].length; i++) {
    var d = data["data"][i];
    for (var name in info["sensors"]) {
      if (typeof d[name] === "undefined") {
        // We need to back fill data according to the threshold
        if (typeof cache[name] !== "undefined") {
          if (d["time"] - cache[name]["time"] <= threshold) {
            d[name] = {};
            d[name]["time"] = cache[name]["time"];
            d[name]["value"] = cache[name]["value"];
          }
        }
      } else {
        // No need for back filling, we only need to store data
        if (typeof cache[name] === "undefined") {
          cache[name] = {};
        }
        cache[name]["time"] = d["time"];
        cache[name]["value"] = d[name];
      }
    }
  }

  return data;
}

// For faster sampling rates, we need to aggregate data points
function aggregateSensorData(data, info) {
  var sensor_type = getSensorType(info);
  if (sensor_type == "PM25") {
    return data;
  }
  if (data["data"].length <= 1) {
    return data;
  }

  var data_cp = $.extend({}, data); // copy object
  data_cp["data"] = [];
  var L = data["data"].length;
  var current_time = data["data"][L - 1]["time"];
  var current_sum = data["data"][L - 1][sensor_type];
  var current_counter = 1;
  var threshold = 1800; // average previous 30 minutes of data
  for (var i = L - 2; i >= 0; i--) {
    var time = data["data"][i]["time"];
    var value = data["data"][i][sensor_type];
    if (current_time - time < threshold) {
      current_sum += value;
      current_counter++;
    } else {
      var pt = {"time": current_time};
      pt[sensor_type] = roundTo(current_sum / current_counter, 0);
      data_cp["data"].unshift(pt);
      current_time = time;
      current_sum = value;
      current_counter = 1;
    }
  }
  var pt = {"time": current_time};
  pt[sensor_type] = roundTo(current_sum / current_counter, 0);
  data_cp["data"].unshift(pt);

  return data_cp;
}

function startAnimation(epochtime_milisec) {
  if (isPlaying) return;
  isPlaying = true;
  isDwelling = false;
  isPaused = false;

  var smell_markers = smell_reports_cache[epochtime_milisec]["markers"];
  var marker_table = sensors_cache[epochtime_milisec]["marker_table"];
  if (animate_interval != null || (smell_markers.length == 0 && marker_table[0].length == 0)) return;

  // Handle UI
  infowindow_smell.close();
  infowindow_VOC.close();
  infowindow_PM25.close();
  if ($playback_button.hasClass("ui-icon-custom-play")) {
    $playback_button.removeClass("ui-icon-custom-play");
    $playback_button.addClass("ui-icon-custom-pause");
  }
  $playback_txt.show();
  $stop_button.show();

  // Animation variables
  var frames_per_sec = 60;
  var secs_to_animate_one_day = 30;
  var increments_per_frame = Math.round(86400000 / (secs_to_animate_one_day * frames_per_sec));
  var interval = 1000 / frames_per_sec;
  var marker_fade_milisec = 1000;
  var dwell_sec = 2;
  var dwell_increments = dwell_sec * frames_per_sec * increments_per_frame;
  var label = getAnimationLabels();

  // Initialize animation
  var smell_idx = 0;
  var sensor_idx_array = [];
  for (var i = 0; i < marker_table.length; i++) {
    sensor_idx_array[i] = 0;
  }
  var sensor_idx_array_on_map = [];
  var elapsed_milisec = 0;
  hideSmellMarkers(epochtime_milisec);
  hideSensorMarkers(epochtime_milisec);
  var label_idx = 0;
  $playback_txt.text(label[label_idx]["text"]);

  // Start animation
  animate_interval = setInterval(function () {
    if (isPaused) return;
    if (elapsed_milisec < 86400000) {
      ///////////////////////////////////////////////////////////////////////////////
      // This condition means we need to animate smell reports and sensors
      // Check all smell reports that are not on the map
      // Draw a smell report only if it has time less than the current elapsed time
      if (smell_idx < smell_markers.length) {
        for (var i = smell_idx; i < smell_markers.length; i++) {
          var smell_m = smell_markers[i];
          var smell_m_data = smell_m.getData();
          var smell_epochtime_milisec = smell_m_data["created_at"] * 1000;
          if (smell_epochtime_milisec <= (current_epochtime_milisec + elapsed_milisec)) {
            // Animate smell reports
            smell_m.setMap(map);
            // Animate info window of smell descriptions
            if (animate_smell_text) {
              if (smell_m_data["smell_value"] >= 3) {
                var msg = "";
                if (smell_m_data["smell_description"] != null) {
                  msg += smell_m_data["smell_description"];
                }
                if (smell_m_data["feelings_symptoms"] != null) {
                  if (msg != "") msg += " / ";
                  msg += smell_m_data["feelings_symptoms"];
                }
                if (msg != "" && msg.length > 60) {
                  var infobox = new InfoBox({
                    pixelOffset: new google.maps.Size(-131, -13),
                    disableAutoPan: true,
                    alignBottom: true,
                    closeBoxURL: "",
                    pane: "floatPane",
                    zIndex: 10,
                    boxClass: "animation-infobox",
                    boxStyle: {
                      opacity: 3.2
                    }
                  });
                  infobox.setContent(msg);
                  infobox.open(map, smell_m.getGoogleMapMarker());
                  fadeInfoBox(infobox);
                }
              }
            }
            // TODO: need to use a queue that contains the markers that need to be faded
            // TODO: store the remaining time in the queue and check the time at the beginning
            // TODO: if the remaining time is less than zero, fade the marker
            fadeMarker(smell_m, marker_fade_milisec);
            smell_idx += 1;
          } else {
            break;
          }
        }
      }
      // Draw sensors
      for (var j = 0; j < marker_table.length; j++) {
        var sensor_idx = sensor_idx_array[j];
        var sensor_markers = marker_table[j];
        if (sensor_idx < sensor_markers.length) {
          var sensor_m = sensor_markers[sensor_idx];
          var sensor_m_data = sensor_m.getData();
          var sensor_epochtime_milisec;
          if (typeof sensor_m_data["sensor_data_time"] != "undefined") {
            sensor_epochtime_milisec = sensor_m_data["sensor_data_time"];
          } else {
            sensor_epochtime_milisec = sensor_m_data["wind_data_time"];
          }
          if (sensor_epochtime_milisec <= (current_epochtime_milisec + elapsed_milisec)) {
            // Show current sensor marker
            sensor_m.setMap(map);
            // Hide previous sensor marker
            if (typeof sensor_idx_array_on_map[j] != "undefined") {
              sensor_markers[sensor_idx_array_on_map[j]].setMap(null);
            }
            // Save index
            sensor_idx_array_on_map[j] = sensor_idx_array[j];
            sensor_idx_array[j] += 1;
          }
        }
      }
      // Display label
      if (elapsed_milisec >= label[label_idx]["milisec"]) {
        label_idx += 1;
        $playback_txt.text(label[label_idx]["text"]);
      }
    } else {
      ///////////////////////////////////////////////////////////////////////////////
      // This condition means we are pausing the animation and do nothing
      isDwelling = true;
    }
    if (elapsed_milisec > 86400000 + dwell_increments) {
      ///////////////////////////////////////////////////////////////////////////////
      // This condition means we animated all smell reports and sensors in one day
      isDwelling = false;
      smell_idx = 0;
      for (var i = 0; i < marker_table.length; i++) {
        sensor_idx_array[i] = 0;
      }
      sensor_idx_array_on_map = [];
      elapsed_milisec = 0;
      hideSmellMarkers(epochtime_milisec);
      hideSensorMarkerTable(epochtime_milisec);
      label_idx = 0;
      $playback_txt.text(label[label_idx]["text"]);
    }
    elapsed_milisec += increments_per_frame;
  }, interval);
}

function pauseAnimation() {
  if (!isPlaying || isPaused) return;
  isPaused = true;

  // Handle UI
  if ($playback_button.hasClass("ui-icon-custom-pause")) {
    $playback_button.removeClass("ui-icon-custom-pause");
    $playback_button.addClass("ui-icon-custom-play");
  }
}

function resumeAnimation() {
  if (!isPlaying || !isPaused) return;
  isPaused = false;

  // Handle UI
  if ($playback_button.hasClass("ui-icon-custom-play")) {
    $playback_button.removeClass("ui-icon-custom-play");
    $playback_button.addClass("ui-icon-custom-pause");
  }
}

function stopAnimation(epochtime_milisec, previous_epochtime_milisec) {
  if (!isPlaying) return;
  isPlaying = false;
  isDwelling = false;
  isPaused = false;

  // Handle UI
  if ($playback_button.hasClass("ui-icon-custom-pause")) {
    $playback_button.removeClass("ui-icon-custom-pause");
    $playback_button.addClass("ui-icon-custom-play");
  }
  $playback_txt.text("");
  $playback_txt.hide();
  $stop_button.hide();

  // Stop animation
  if (animate_interval != null) {
    clearInterval(animate_interval);
    animate_interval = null;
  }

  // Draw all smell reports to the map
  hideSmellMarkers(previous_epochtime_milisec);
  showSmellMarkers(epochtime_milisec);

  // Draw all sensors to the map
  hideSensorMarkerTable(previous_epochtime_milisec);
  showSensorMarkers(epochtime_milisec);
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
    if (isPlaying && isPaused) {
      fadeMarker(marker, time);
      return;
    }
    if (isPlaying && !isDwelling) {
      marker.setZIndex(0);
      marker.setOpacity(0.5);
    }
  }, time);
}

function fadeInfoBox(infobox) {
  setTimeout(function () {
    if (!isPlaying) {
      infobox.setVisible(false);
      infobox.close();
      return;
    }
    var opacity = infobox["boxStyle_"]["opacity"];
    if (opacity > 0) {
      opacity -= 0.05;
      infobox.setOptions({boxStyle: {opacity: opacity}});
      fadeInfoBox(infobox);
    } else {
      infobox.setVisible(false);
      infobox.close();
    }
  }, 50);
}

$(function () {
  init();
});
