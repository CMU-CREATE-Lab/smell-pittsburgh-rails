"use strict";

// Staging testing features
var animate_smell_text = false; // for animating smell descriptions
var show_voc_sensors = false; // for showing VOC sensors on the map

// URL variables
var aqi_root_url = "https://api.smellpittsburgh.org/api/v1/get_aqi?city=";

// Google map variables
var map; // google map object

// Application variables
var app; // "SMC" means smell my city, "BA" means bay area, "PGH" means smell pgh
var app_id; // passed from index.html.erb
var mode; // "user", "all", "city", see setMode() function for details

// Current participating city (based on current user location)
var user_city_ids;
var user_city_latlng;
var user_city_zoom_mobile;
var user_city_name;
if (at_city) {
  user_city_ids = [at_city["id"]];
  user_city_latlng = {"lat": at_city["latitude"], "lng": at_city["longitude"]};
  user_city_zoom_mobile = at_city.zoom_level;
  user_city_name = at_city["name"];
}

// Current user location
var user_latlng = {"lat": at_latitude, "lng": at_longitude};
var user_zoom_mobile = at_zoom;
var user_home = "My Location";
var user_latlng_bbox; // for requesting data within a latlng bounding box
var user_latlng_polygon; // for drawing the polygon on the Google map for "My Location"

// Desired location for Pittsburgh
var pittsburgh_latlng = {"lat": 40.45, "lng": -79.93};
var pittsburgh_zoom_mobile = 11;
var pittsburgh_home = "Pittsburgh";

// Desired location for Bay Area
var ba_latlng = {"lat": 38.004472, "lng": -122.260693};
var ba_zoom_mobile = 11;
var ba_home = "Bay Area";

// Desired location for the US
var all_data_latlng = {"lat": 40.610271, "lng": -101.413473};
var all_data_zoom_mobile = 3;
var all_data_home = "All Data";

// Desired location
var desired_latlng;
var desired_zoom_mobile;
var desired_zoom_desktop;
var desired_home;
var desired_city_ids;
var desired_latlng_bbox;

// Smell reports variables
var smell_reports_cache;
var current_epochtime_milisec;
var animation_start_epochtime_milisec;
var ignore_markers_after_animation_stop = false;
var infowindow_smell;

// Animation variables
var animator;
var $playback_button;
var $stop_button;
var $playback_txt;

// Calendar variables
var month_names = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
];
var $calendar_dialog;
var $calendar_select;

// Home variables (for selecting a mode)
var $home_dialog;
var $home_select;
var $home_text;

// Timeline variables
var timeline;

// Sensor variables
var sensors_cache;
var infowindow_PM25;
var infowindow_VOC;
var sensors_list;

// Widgets
var widgets = new edaplotjs.Widgets();

function init() {
  setQueryStringData(); // set data coming from the query string
  initGoogleMap();
  setUserLatLngBoundingBox(); // compute and set the latlng bounding box for the current user location
  setMode(); // set the mode based on the query string data
  initTerrainBtn();
  initHomeBtn();
  initCalendarBtn();
  initAnimationUI();
  loadDataAndSetUI(); // load data from the server and set the UI

  // Disable vertical bouncing effect on mobile browsers
  $(document).on("scrollstart", function (e) {
    e.preventDefault();
  });

  // Disable all href tags to prevent accidental link clicking on the map
  $("body").on("click", "a", function (e) {
    e.preventDefault();
  });
}

function setQueryStringData() {
  var query = window.location.search.slice(1).split("&");
  for (var i = 0; i < query.length; i++) {
    var queryVar = decodeURI(query[i]);
    if (queryVar.indexOf("user_hash") != -1) {
      var matched = queryVar.split("=")[1].match(/[A-Z]{2,}/);
      if (matched) app = matched[0];
    }
  }
  app = safeGet(app, "PGH");
}

function setUserLatLngBoundingBox() {
  var spherical = google.maps.geometry.spherical;
  var distance = 10000; // diagonal distance from the center: 10 km
  var center_pt = new google.maps.LatLng(user_latlng["lat"], user_latlng["lng"]);
  var tl_pt = spherical.computeOffset(center_pt, distance, -45); // top-left corner
  var br_pt = spherical.computeOffset(center_pt, distance, 135); // bottom-right corner
  var tl_lat = tl_pt.lat();
  var tl_lng = tl_pt.lng();
  var br_lat = br_pt.lat();
  var br_lng = br_pt.lng();
  user_latlng_bbox = tl_lat + "," + tl_lng + "," + br_lat + "," + br_lng;
  user_latlng_polygon = new google.maps.Polygon({
    paths: [[
      {lat: -90, lng: -180},
      {lat: 90, lng: -180},
      {lat: 90, lng: 180},
      {lat: -90, lng: 180},
      {lat: -90, lng: 0}
    ], [
      {lat: tl_lat, lng: br_lng},
      {lat: tl_lat, lng: tl_lng},
      {lat: br_lat, lng: tl_lng},
      {lat: br_lat, lng: br_lng}
    ]],
    strokeColor: "#000000",
    strokeOpacity: 0.8,
    strokeWeight: 1,
    fillColor: "#ffffff",
    fillOpacity: 0.75
  });
}

function setMode(desired_mode) {
  mode = desired_mode;
  hideSmellMarkersByTime(current_epochtime_milisec);
  hideSensorMarkersByTime(current_epochtime_milisec);
  current_epochtime_milisec = new Date().getTime();
  smell_reports_cache = {};
  desired_city_ids = [];
  sensors_cache = {};
  sensors_list = [];
  if (show_voc_sensors) addVocSensors();
  if (app == "BA") {
    setToBayArea();
  } else if (app == "PGH") {
    setToSmellPgh();
  } else if (app == "SMC") {
    setToSmellMyCity(mode);
  }
}

function loadDataAndSetUI() {
  $home_text.text(desired_home);
  centerMap();

  // Load calendar list
  loadAndDrawCalendar();

  // Check if we are in a participating city
  if (typeof desired_city_ids !== "undefined" && mode != "all") {
    // Load sensor list of the city first
    // loadSensorList() also calls loadAndCreateTimeline()
    loadSensorList(desired_city_ids[0]);
  } else {
    loadAndCreateTimeline();
  }

  // Load report feed
  // TODO: Finish work on the smell report feed
  //$("#report-feed").on("click", function () {
  //  genFeed(1,"report-feed","/img/")
  //});
}

// This is Bay Area
function setToBayArea() {
  app_id = app_id_ba;
  desired_city_ids = user_city_ids;
  setDesiredLatLngZoomHome(ba_latlng, ba_zoom_mobile, ba_home);
}

// This is Smell Pittsburgh
function setToSmellPgh() {
  app_id = app_id_smellpgh;
  desired_city_ids = user_city_ids;
  setDesiredLatLngZoomHome(pittsburgh_latlng, pittsburgh_zoom_mobile, pittsburgh_home);
}

// This is Smell My City
function setToSmellMyCity(mode) {
  app_id = app_id_smellmycity;
  // If there is a participating city
  if (at_city) {
    mode = safeGet(mode, "city"); // default to the mode of participating cities
  } else {
    mode = safeGet(mode, "user"); // default to the mode of user location
  }
  // Check mode
  if (mode == "all") {
    // Want to show all data
    setDesiredLatLngZoomHome(all_data_latlng, all_data_zoom_mobile, all_data_home);
    desired_city_ids = at_participating_cities.map(function (city) {return city.id;});
    desired_latlng_bbox = undefined;
    clearPolygonMaskOnMap(user_latlng_polygon);
  } else if (mode == "user") {
    // Want to show only the data near the current user location
    setDesiredLatLngZoomHome(user_latlng, user_zoom_mobile, user_home);
    desired_city_ids = undefined;
    desired_latlng_bbox = user_latlng_bbox;
    drawPolygonMaskOnMap(user_latlng_polygon);
    // TODO: Pass latlng_bbox rather than city_ids
    // latlng_bbox (top-left to bottom-right)
    // http://localhost:3000/api/v2/smell_reports?latlng_bbox=30,-99,40,-88
    // top-left is (30, -99), bottom-right is (40,-88)
  } else if (mode == "city") {
    // Want to show the data of the participating city (if any) at the user location
    setDesiredLatLngZoomHome(user_city_latlng, user_city_zoom_mobile, user_city_name);
    desired_city_ids = user_city_ids;
    desired_latlng_bbox = undefined;
    clearPolygonMaskOnMap(user_latlng_polygon);
  }
}

function drawPolygonMaskOnMap(polygon) {
  polygon.setMap(map);
}

function clearPolygonMaskOnMap(polygon) {
  polygon.setMap(null);
}

function setUserCityLatLngZoomHomeId(latlng, zoom, home, ids) {
  user_city_latlng = latlng;
  user_city_zoom_mobile = zoom;
  user_city_name = home;
  user_city_ids = ids;
}

function setDesiredLatLngZoomHome(latlng, zoom, home) {
  desired_latlng = latlng;
  desired_zoom_mobile = zoom;
  desired_zoom_desktop = zoom + 1;
  desired_home = home;
}

// This is a testing feature
function addVocSensors() {
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

function initGoogleMap() {
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
    center: desired_latlng,
    styles: styleArray,
    zoom: isMobile() ? desired_zoom_mobile : desired_zoom_desktop,
    disableDefaultUI: true,
    clickableIcons: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    gestureHandling: "greedy"
  });

  // Update marker size when users zoom the map
  map.addListener("zoom_changed", function () {
    var c = safeGet(smell_reports_cache[current_epochtime_milisec], {});
    var current_markers = safeGet(c["markers"], []);
    for (var i = 0; i < current_markers.length; i++) {
      current_markers[i].updateIconByZoomLevel(map.getZoom());
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
}

function initTerrainBtn() {
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

function initHomeBtn() {
  $home_text = $("#home-btn span");

  // Load city list
  if (app == "SMC") {
    drawHome(formatDataForHome(at_participating_cities));
  }

  // Create the home dialog
  $home_dialog = widgets.createCustomDialog({
    selector: "#home-dialog",
    full_width_button: true,
    cancel_callback: function () {
      centerMap();
    }
  });

  // Add event to the home button
  $("#home-btn").on("click", function () {
    if (app == "SMC") {
      $home_dialog.dialog("open");
    } else {
      centerMap();
    }
  });
}

function styleInfoWindowCloseButton() {
  $(".gm-style-iw").next().css({
    "-ms-transform": "scale(1.3, 1.3)",
    "-webkit-transform": "scale(1.3, 1.3)",
    "transform": "scale(1.3, 1.3)"
  });
}

function initCalendarBtn() {
  $calendar_dialog = widgets.createCustomDialog({
    selector: "#calendar-dialog",
    full_width_button: true
  });
  $("#calendar-btn").on("click", function () {
    $calendar_dialog.dialog("open");
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
    if (animator.isPlaying()) {
      if (animator.isPaused()) {
        animator.resumeAnimation();
        addGoogleAnalyticEvent("resume-animation", "click", label);
      } else {
        animator.pauseAnimation();
        addGoogleAnalyticEvent("pause-animation", "click", label);
      }
    } else {
      animator.startAnimation({
        smell_markers: smell_reports_cache[current_epochtime_milisec]["markers"],
        sensor_marker_table: sensors_cache[current_epochtime_milisec]["marker_table"],
        map: map
      });
      addGoogleAnalyticEvent("start-animation", "click", label);
    }
  });

  $stop_button.on("click", function () {
    var label = {
      "dimension5": current_epochtime_milisec.toString()
    };
    if (animator.isPlaying()) {
      animator.stopAnimation();
      addGoogleAnalyticEvent("stop-animation", "click", label);
    }
  });

  animator = new AnimateCustomMapMarker({
    animate_smell_text: animate_smell_text,
    before_play: function () {
      infowindow_smell.close();
      infowindow_VOC.close();
      infowindow_PM25.close();
      $playback_button.find("img").prop("src", "/img/pause.png");
      $playback_txt.show();
      $stop_button.show();
      hideSmellMarkersByTime(current_epochtime_milisec);
      hideSensorMarkersByTime(current_epochtime_milisec);
      animation_start_epochtime_milisec = current_epochtime_milisec;
    },
    when_play: function (animation_text) {
      $playback_txt.text(animation_text);
    },
    reset_play: function (animation_text) {
      $playback_txt.text(animation_text);
    },
    after_pause: function () {
      $playback_button.find("img").prop("src", "/img/play.png");
    },
    after_resume: function () {
      $playback_button.find("img").prop("src", "/img/pause.png");
    },
    after_stop: function () {
      $playback_button.find("img").prop("src", "/img/play.png");
      $playback_txt.text("");
      $playback_txt.hide();
      $stop_button.hide();
      animation_start_epochtime_milisec = undefined;
      if (!ignore_markers_after_animation_stop) {
        ignore_markers_after_animation_stop = false;
        showSmellMarkersByTime(current_epochtime_milisec);
        showSensorMarkersByTime(current_epochtime_milisec);
      }
    }
  });
}

function loadSensorList(city_id) {
  $.ajax({
    "url": generateURLForMapMarkers(city_id),
    "success": function (data) {
      for (var i = 0; i < data.length; i++) {
        sensors_list.push(data[i]);
      }
      loadAndCreateTimeline();
    },
    "error": function (response) {
      console.log("server error on loadMapMarkers:", response);
      loadAndCreateTimeline();
    }
  });
}

function loadAndDrawCalendar() {
  $.ajax({
    "url": generateURLForSmellReports({
      "group_by": "month",
      "aggregate": "true"
    }),
    "success": function (data) {
      drawCalendar(formatDataForCalendar(data));
    },
    "error": function (response) {
      console.log("server error:", response);
    }
  });
}

function getInitialTimeRange() {
  var date_obj = firstDayOfPreviousMonth(new Date());
  // The starting time is the first day of the last month
  var start_time = date_obj.getTime();
  // The ending time is the current time
  var end_time = Date.now();
  return {"start_time": start_time, "end_time": end_time};
}

function loadInitialTimeLine() {
  var T = getInitialTimeRange();
  loadAndUpdateTimeLine(T["start_time"], T["end_time"]);
}

function loadAndUpdateTimeLine(start_time, end_time) {
  loadTimelineData(start_time, end_time, function (data) {
    if (!isDictEmpty(data)) {
      timeline.updateBlocks(formatDataForTimeline(data, new Date(end_time)));
      timeline.clearBlockSelection();
      timeline.selectLastBlock();
    }
  });
}

function loadAndCreateTimeline() {
  // Create the timeline
  var T = getInitialTimeRange();
  loadTimelineData(T["start_time"], T["end_time"], function (data) {
    createTimeline(formatDataForTimeline(data, new Date(T["end_time"])));
  });
}

function loadTimelineData(start_time, end_time, callback) {
  $.ajax({
    "url": generateURLForSmellReports({
      "group_by": "day",
      "aggregate": "true",
      "smell_values": "3,4,5",
      "start_time": parseInt(start_time / 1000).toString(),
      "end_time": parseInt(end_time / 1000).toString()
    }),
    "success": function (data) {
      if (typeof callback === "function") {
        callback(data);
      }
    },
    "error": function (response) {
      console.log("server error:", response);
    }
  });
}

function showSmellMarkersByTime(epochtime_milisec) {
  if (typeof epochtime_milisec === "undefined") return;
  // Check if data exists in the cache
  // If not, load data from the server
  var r = smell_reports_cache[epochtime_milisec];
  if (typeof r !== "undefined") {
    showMarkers(r["markers"]);
  } else {
    smell_reports_cache[epochtime_milisec] = {"markers": []};
    loadAndCreateSmellMarkers(epochtime_milisec);
  }
}

function showMarkers(markers) {
  markers = safeGet(markers, []);
  for (var i = 0; i < markers.length; i++) {
    if (typeof markers[i] !== "undefined") {
      markers[i].setMap(map);
    }
  }
}

function loadAndCreateSmellMarkers(epochtime_milisec) {
  // generate start and end times from epochtime_milisec
  var date_obj = new Date(epochtime_milisec);
  date_obj.setHours(0, 0, 0, 0);
  var start_time = parseInt(date_obj.getTime() / 1000);
  var end_time = start_time + 86399; // one day after the starting time
  $.ajax({
    "url": generateURLForSmellReports({
      "start_time": start_time,
      "end_time": end_time
    }),
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
        showMarkers([marker]);
      }
      // Cache markers
      smell_reports_cache[epochtime_milisec]["markers"].push(marker);
    }
  });
}

function handleSmellMarkerClicked(marker) {
  if (animator.isPlaying()) return;

  infowindow_PM25.close();
  infowindow_VOC.close();
  infowindow_smell.setContent(marker.getContent());
  infowindow_smell.open(map, marker.getGoogleMapMarker());

  // Add google analytics event
  var marker_data = marker.getData();
  var label = {
    "dimension5": (marker_data["observed_at"] * 1000).toString(),
    "metric1": marker_data["smell_value"]
  };
  addGoogleAnalyticEvent("smell", "click", label);
}

function hideSmellMarkersByTime(epochtime_milisec) {
  if (typeof epochtime_milisec === "undefined") return;
  var r = smell_reports_cache[epochtime_milisec];
  if (typeof r == "undefined") return;
  hideMarkers(r["markers"]);
}

function hideMarkers(markers) {
  markers = safeGet(markers, []);
  for (var i = 0; i < markers.length; i++) {
    if (typeof markers[i] !== "undefined") {
      markers[i].setMap(null);
      markers[i].reset();
    }
  }
}

function generateSmellPghURL(domain, path, parameters) {
  if (app_id != app_id_smellmycity) {
    parameters["client_ids"] = app_id;
  }
  if (typeof desired_city_ids !== "undefined" && desired_city_ids.length > 0) {
    parameters["city_ids"] = desired_city_ids.join(",");
  }
  if (typeof desired_latlng_bbox !== "undefined") {
    // For example, latlng_bbox=30,-99,40,-88
    // Top-left corner is (30, -99), bottom-right corner is (40,-88)
    parameters["latlng_bbox"] = desired_latlng_bbox;
  }
  var api_paras = "";
  var parameter_list = [];
  if (typeof parameters == "object") {
    var list = Object.keys(parameters);
    list.forEach(function (i) {
      parameter_list.push(encodeURIComponent(i) + "=" + encodeURIComponent(parameters[i]));
    });
    if (parameter_list.length > 0) {
      api_paras += "?" + parameter_list.join("&");
    }
  } else {
    console.log("parameters is not an object");
  }
  return domain + path + api_paras;
}

function generateURLForSmellReports(parameters) {
  return generateSmellPghURL(window.location.origin, "/api/v2/smell_reports", parameters);
}

function generateURLForMapMarkers(city_id) {
  return generateSmellPghURL(window.location.origin, "/api/v2/cities/" + city_id + "/map_markers", {});
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
    var d = new Date(r[i]["observed_at"] * 1000);
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

function formatDataForHome(data) {
  // Get city name from data[i]["name"]
  // Get lat from data[i]["latitude"]
  // Get lng from data[i]["longitude"]
  // Get mobile zoom from data[i]["zoom_level"]
  // Desktop zoom = mobile zoom + 1
  var cities = [];
  for (var i = 0; i < data.length; i++) {
    cities.push({"id": data[i]['id'], "name": data[i]['name'], "lat": data[i]['latitude'], "lng": data[i]['longitude'], "zoom": data[i]['zoom_level']});
  }
  return cities;
}

function drawHome(data) {
  $home_select = $("#home");
  $home_select.empty();
  $home_select.append($("<option selected>Select...</option>"));
  for (var i = 0; i < data.length; i++) {
    var d = data[i];
    $home_select.append($('<option value="' + d["name"] + '" data-id="' + d["id"] + '"data-lat="' + d["lat"] + '" data-lng="' + d["lng"] + '" data-zoom="' + d["zoom"] + '">' + d["name"] + '</option>'));
  }
  $home_select.append($('<option value="' + user_home + '">' + user_home + '</option>'));
  $home_select.append($('<option value="' + all_data_home + '">' + all_data_home + '</option>'));

  // Add event
  $home_select.on("change", function () {
    $home_dialog.dialog("close");
    var $selected = $home_select.find(":selected");
    var selected_home = $selected.val();
    if (selected_home != desired_home) {
      if (selected_home == all_data_home) {
        // User wants to see all data
        setMode("all");
      } else if (selected_home == user_home) {
        // User wants to see the data near the current location
        setMode("user");
      } else {
        // User wants to see the data of a participating city
        var selected_city_latlng = {"lat": $selected.data("lat"), "lng": $selected.data("lng")};
        var selected_city_mobile_zoom = $selected.data("zoom");
        var selected_city_ids = [$selected.data("id")];
        setUserCityLatLngZoomHomeId(selected_city_latlng, selected_city_mobile_zoom, selected_home, selected_city_ids);
        setMode("city");
      }
      loadDataAndSetUI();
    } else {
      centerMap();
    }
    addGoogleAnalyticEvent("home", "click", {"dimension5": current_epochtime_milisec.toString()});
    $(this).prop("selectedIndex", 0);
  });
}

function centerMap() {
  map.setCenter(desired_latlng);
  map.setZoom(isMobile() ? desired_zoom_mobile : desired_zoom_desktop);
}

function formatDataForCalendar(data) {
  // converts v2 results to look like v1 results (to pass into drawCalendar function)
  var month = [];
  var count = [];
  var list = Object.keys(data).sort();
  list.forEach(function (key) {
    // key, value
    var value = data[key];
    month.push(key.split("-").map(function (i) {
      return parseInt(i);
    }));
    count.push(parseInt(value));
  });
  return {"month": month, "count": count};
}

function drawCalendar(data) {
  var month_arr = data.month;
  var today = new Date();
  $calendar_select = $("#calendar");
  $calendar_select.empty();
  $calendar_select.append($("<option selected>Select...</option>"));
  $calendar_select.append($('<option value="' + -1 + '" data-year="' + today.getFullYear() + '" data-month="' + (today.getMonth() + 1) + '">Today</option>'));
  for (var i = month_arr.length - 1; i >= 0; i--) {
    var year = month_arr[i][0];
    var month = month_arr[i][1];
    $calendar_select.append($('<option value="' + i + '" data-year="' + year + '" data-month="' + month + '">' + month_names[month - 1] + ' ' + year + '</option>'));
  }

  // Add event
  $calendar_select.on("change", function () {
    $calendar_dialog.dialog("close");
    var $selected = $calendar_select.find(":selected");
    var last_block_data = timeline.getLastBlockData();
    var last_block_month;
    if (typeof last_block_data !== "undefined") {
      last_block_month = (new Date(last_block_data["epochtime_milisec"])).getMonth();
    }
    if ($selected.val() == -1) {
      // This means that user selects "today"
      var selected_month = $selected.data("month");
      if (selected_month - 1 != last_block_month) {
        // Only load a new timeline when the desired month does not contain the last block
        loadInitialTimeLine();
      } else {
        // Otherwise, just select the last block
        timeline.clearBlockSelection();
        timeline.selectLastBlock();
      }
    } else {
      var start_date_obj = new Date($selected.data("year"), $selected.data("month") - 1);
      var start_time = start_date_obj.getTime();
      if (start_date_obj.getMonth() == (new Date()).getMonth()) {
        // Only load a new timeline when the desired month does not contain the last block
        if (start_date_obj.getMonth() != last_block_month) {
          // If the desired month is the current month, load the initial timeline
          loadInitialTimeLine();
        } else {
          // Otherwise, just select the last block
          timeline.clearBlockSelection();
          timeline.selectLastBlock();
        }
      } else {
        // Only load a new timeline when the desired month does not contain the last block
        if (start_date_obj.getMonth() != last_block_month) {
          var end_date_obj = firstDayOfNextMonth(start_date_obj);
          var end_time = end_date_obj.getTime();
          loadAndUpdateTimeLine(start_time, end_time);
        } else {
          // Otherwise, just select the last block
          timeline.clearBlockSelection();
          timeline.selectLastBlock();
        }
      }
      addGoogleAnalyticEvent("calendar", "click", {"dimension5": start_time.toString()});
    }
    // Have selector go back to showing default option
    $(this).prop("selectedIndex", 0);
  });
}

function formatDataForTimeline(data, pad_to_date_obj) {
  var batch_3d = []; // 3D batch data
  var batch_2d = []; // the inner small 2D batch data for batch_3d
  var sorted_day_str = Object.keys(data).sort();
  var last_month;

  // If no data, need to add the current day to the list
  if (sorted_day_str.length == 0) {
    sorted_day_str = [dataObjectToString(new Date())];
  }

  // If the first one is not the first day of the month, we need to insert it
  if (sorted_day_str.length > 0) {
    var first_str_split = sorted_day_str[0].split("-");
    var first_day = parseInt(first_str_split[2]);
    if (first_day != 1) {
      var first_year = parseInt(first_str_split[0]);
      var first_month = parseInt(first_str_split[1]);
      var k = first_year + "-" + first_month + "-01";
      sorted_day_str.unshift(k);
    }
  }

  for (var i = 0; i < sorted_day_str.length; i++) {
    // Get current day and count
    var day_str = sorted_day_str[i];
    var day_obj = dateStringToObject(day_str);
    var count = parseInt(safeGet(data[day_str], 0));
    // Check if we need to push the 2D array to 3D, and empty the 2D array
    var month = day_obj.getMonth();
    if (typeof last_month === "undefined") {
      last_month = month;
    } else {
      if (last_month != month) {
        batch_3d.push(batch_2d);
        batch_2d = [];
        last_month = month;
      }
    }
    // Push into the 2D array
    var label = day_obj.toDateString().split(" ");
    label = label[1] + " " + label[2];
    var day_obj_time = day_obj.getTime();
    batch_2d.push([label, count, day_obj_time]);
    // Check if we need to pad missing days of the future
    var next_day_obj;
    if (i < sorted_day_str.length - 1) {
      next_day_obj = dateStringToObject(sorted_day_str[i + 1]);
    } else {
      next_day_obj = pad_to_date_obj; // future date is the next date
    }
    var diff_days = getDiffDays(day_obj, next_day_obj);
    // Push missing days into the 2D array if necessary
    if (diff_days > 1) {
      for (var j = 1; j < diff_days; j++) {
        var day_obj_time_j = day_obj_time + 86400000 * j;
        var day_obj_j = new Date(day_obj_time_j);
        var label_j = day_obj_j.toDateString().split(" ");
        label_j = label_j[1] + " " + label_j[2];
        batch_2d.push([label_j, 0, day_obj_time_j]);
      }
    }
  }
  if (batch_2d.length > 0) batch_3d.push(batch_2d);
  return batch_3d;
}

// Compute the difference of the number of days of two date objects
// Notice that d2 must be larger than d1
function getDiffDays(d1, d2) {
  // Need to subtract timezone offset for daylight saving issues
  var d2_time = d2.getTime() - d2.getTimezoneOffset() * 60000;
  var d1_time = d1.getTime() - d1.getTimezoneOffset() * 60000;
  return Math.ceil((d2_time - d1_time) / 86400000);
}

// Use the TimelineHeatmap charting library to draw the timeline
function createTimeline(data) {
  var $timeline_container = $("#timeline-container").empty();
  var chart_settings = {
    click: function ($e) {
      handleTimelineButtonClicked(parseInt($e.data("epochtime_milisec")));
    },
    select: function ($e) {
      // Update selected day in the legend
      $("#selected-day").html(String(new Date($e.data("epochtime_milisec"))).substr(4, 11));
      handleTimelineButtonSelected(parseInt($e.data("epochtime_milisec")));
    },
    create: function (obj) {
      obj.selectLastBlock();
    },
    data: data,
    useColorQuantiles: true,
    //changes colorBin based on even division of data
    // 40 would not work as far to many days are over 40
    // like the whole bar would be black
    //colors are made to be similar to existing chart
    colorBin: [0, 16, 32, 46, 77, 183],
    colorRange: ["#ededed", "#dbdbdb", "#afafaf", "#848383", "#545454", "#000000"],
    columnNames: ["label", "value", "epochtime_milisec"],
    dataIndexForLabels: 0,
    dataIndexForValues: 1,
    addLeftArrow: function (obj) {
      obj.setLeftArrowOpacity(0.3);
      obj.disableLeftArrow();
      var first_block_data = safeGet(obj.getFirstBlockData(), {});
      var end_time = safeGet(first_block_data["epochtime_milisec"], new Date().getTime());
      end_time = firstDayOfCurrentMonth(new Date(end_time)).getTime();
      var start_time = firstDayOfPreviousMonth(new Date(end_time)).getTime();
      loadTimelineData(start_time, end_time, function (data) {
        if (!isDictEmpty(data)) {
          obj.prependBlocks(formatDataForTimeline(data, new Date(end_time)));
          obj.setLeftArrowOpacity(1);
          obj.enableLeftArrow();
        } else {
          obj.setLeftArrowOpacity(1);
          obj.enableLeftArrow();
          obj.hideLeftArrow();
        }
      });
    },
    leftArrowLabel: "More"
  };
  timeline = new edaplotjs.TimelineHeatmap("timeline-container", chart_settings);

  // Add horizontal scrolling to the timeline
  // Needed because Android <= 4.4 won't scroll without this
  addTouchHorizontalScroll($timeline_container);
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
  if (animator.isPlaying()) {
    // This is to prevent calling showSmellMarkersByTime() and showSensorMarkersByTime()
    // in the callback function of the animator object when stopping animation 
    if (animation_start_epochtime_milisec != epochtime_milisec) {
      ignore_markers_after_animation_stop = true;
    }
    animator.stopAnimation();
  }
  hideSmellMarkersByTime(current_epochtime_milisec);
  showSmellMarkersByTime(epochtime_milisec);
  hideSensorMarkersByTime(current_epochtime_milisec);
  showSensorMarkersByTime(epochtime_milisec);
  current_epochtime_milisec = epochtime_milisec;
}

function showSensorMarkersByTime(epochtime_milisec) {
  if (typeof epochtime_milisec == "undefined") return;
  // Check if data exists in the cache
  // If not, load data from the server
  var r = sensors_cache[epochtime_milisec];
  if (typeof r != "undefined") {
    // Show the AQI if needed
    showOrHideAQI(r["is_current_day"]);
    // Make sensors markers visible on the map
    showMarkers(r["markers"]);
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
        showMarkers([marker]);
      }
      // Cache markers
      sensors_cache[epochtime_milisec]["is_current_day"] = is_current_day;
      sensors_cache[epochtime_milisec]["markers"][i] = marker;
    }
  });
}

function parseSensorMarkerData(data, is_current_day, info, i) {
  var sensor_type = getSensorType(info);
  if (typeof sensor_type === "undefined") return undefined;
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
  if (typeof marker_data === "undefined") return;
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
  if (is_current_day && app == "PGH") {
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

function hideSensorMarkersByTime(epochtime_milisec) {
  if (typeof epochtime_milisec === "undefined") return;
  var r = sensors_cache[epochtime_milisec];
  if (typeof r == "undefined") return;
  hideMarkers(r["markers"]);
}

function generateSensorDataUrlList(epochtime_milisec, info) {
  var esdr_root_url = "https://esdr.cmucreatelab.org/api/v1/";
  var epochtime = parseInt(epochtime_milisec / 1000);
  var time_range_url_part = "/export?format=json&from=" + epochtime + "&to=" + (epochtime + 86399);

  // Parse sensor info into several urls (data may come from different feeds and channels)
  var sensors = info["sensors"];
  var feeds_to_channels = {};
  for (var k in sensors) {
    var sources = safeGet(sensors[k]["sources"], []);
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
    var s = safeGet(safeGet(info["sensors"][sensor_name], {})["sources"], []);
    // Get the unique set of channel names
    var channel_names = [];
    for (var i = 0; i < s.length; i++) {
      channel_names.push(s[i]["channel"]);
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
        cache[name] = safeGet(cache[name], {});
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

// Safely get the value from a variable, return a default value if undefined
function safeGet(v, default_val) {
  if (typeof default_val === "undefined") default_val = "";
  return (typeof v === "undefined") ? default_val : v;
}

$(function () {
  init();
});