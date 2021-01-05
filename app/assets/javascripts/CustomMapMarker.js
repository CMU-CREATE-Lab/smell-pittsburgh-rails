/*************************************************************************
 * This class is developed by Yen-Chia Hsu
 * Dependencies: jQuery and Google Maps JavaScript API
 * Currently only support three sensor formats:
 * "wind_direction" will be blue arrows
 * "PM25" will be circles
 * "VOC" will be squares
 *************************************************************************/

(function () {
  "use strict";

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Create the class
  //
  var CustomMapMarker = function (settings) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Variables
    //
    var marker_type = settings["type"];
    var data = settings["data"];
    var init_zoom_level = settings["initZoomLevel"];
    var click_event_callback = settings["click"];
    var complete_event_callback = settings["complete"];

    var google_map_marker;
    var html_content;
    var this_obj = this;
    var marker_default_opacity = 1;

    // Smell Marker
    var current_icon_size;
    var zoom_level_to_icon_size = [
      24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 36, 60, 90, 180, 240, 360
    ];
    var smell_value_to_text = [
      "Just fine!",
      "Barely noticeable",
      "Definitely noticeable",
      "It's getting pretty bad",
      "About as bad as it gets!"
    ];

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    function init() {
      if (marker_type == "WIND_ONLY") {
        createWindOnlyMarker();
      } else if (marker_type == "smell") {
        createSmellMarker();
      } else if (marker_type == "PM25") {
        createPM25Marker();
      } else if (marker_type == "VOC") {
        createVOCMarker();
      }
    }

    function addMarkerEvent() {
      if (typeof google_map_marker != "undefined") {
        google_map_marker.addListener("click", function () {
          if (typeof (click_event_callback) == "function") {
            click_event_callback(this_obj);
          }
        });
      }
    }

    function createSmellMarker() {
      var feelings_symptoms = data["feelings_symptoms"] ? sanitize(data["feelings_symptoms"]) : "No data.";
      var smell_description = data["smell_description"] ? sanitize(data["smell_description"]) : "No data.";
      var smell_value = data["smell_value"];

      // Create HTML content for the info window
      current_icon_size = zoom_level_to_icon_size[init_zoom_level];
      html_content = "";
      html_content += "<b>Date:</b> " + (new Date(data["observed_at"] * 1000)).toLocaleString() + "<br>";
      html_content += "<b>Smell Rating:</b> " + smell_value + " (" + smell_value_to_text[smell_value - 1] + ")<br>";
      html_content += "<b>Symptoms:</b> " + feelings_symptoms + "<br>";
      html_content += "<b>Smell Description:</b> " + smell_description;

      // Create google map marker
      google_map_marker = new google.maps.Marker({
        position: new google.maps.LatLng({lat: data["latitude"], lng: data["longitude"]}),
        icon: generateSmellIcon(smell_value, init_zoom_level, current_icon_size),
        zIndex: smell_value,
        opacity: marker_default_opacity
      });
      addMarkerEvent();

      // Fire complete event
      if (typeof (complete_event_callback) == "function") {
        complete_event_callback(this_obj);
      }
    }

    function generateSmellIcon(smell_value, zoom_level, icon_size) {
      var icon_size_half = icon_size / 2;

      return {
        url: getSmellIconURL(smell_value, zoom_level),
        scaledSize: new google.maps.Size(icon_size, icon_size),
        size: new google.maps.Size(icon_size, icon_size),
        anchor: new google.maps.Point(icon_size_half, icon_size_half),
        origin: new google.maps.Point(0, 0)
      };
    }

    function getSmellIconURL(smell_value, zoom_level) {
      var path = "/img/";
      var smell_icon_small = ["smell_1.png", "smell_2.png", "smell_3.png", "smell_4.png", "smell_5.png"];
      var smell_icon_med = ["smell_1_med.png", "smell_2_med.png", "smell_3_med.png", "smell_4_med.png", "smell_5_med.png"];
      var smell_icon_big = ["smell_1_big.png", "smell_2_big.png", "smell_3_big.png", "smell_4_big.png", "smell_5_big.png"];
      var smell_icon;

      // The range of smell value is from 1 to 5
      if (zoom_level >= 20) {
        smell_icon = smell_icon_big[smell_value - 1];
      } else if (zoom_level < 20 && zoom_level >= 17) {
        smell_icon = smell_icon_med[smell_value - 1];
      } else {
        smell_icon = smell_icon_small[smell_value - 1];
      }

      return path + smell_icon;
    }

    function createWindOnlyMarker() {
      var wind_speed = data["wind_speed"];

      // Create HTML content for the info window
      html_content = "";
      html_content += "<b>Name:</b> " + data["name"] + "<br>";
      if (data["is_current_day"]) {
        if (typeof wind_speed !== "undefined") {
          var wind_txt = (isNaN(wind_speed) || wind_speed < 0) ? no_data_txt : wind_speed + " MPH";
          var wind_time = new Date(data["wind_data_time"]);
          var wind_time_txt = " at time " + padTimeString(wind_time.getHours() + 1) + ":" + padTimeString(wind_time.getMinutes() + 1);
          html_content += '<b>Latest Wind Speed:</b> ' + wind_txt + wind_time_txt;
        }
      }
      var wind_direction = data["wind_direction"];
      var image = new Image();
      // Create google map marker
      image.addEventListener("load", function () {
        google_map_marker = new google.maps.Marker({
          position: new google.maps.LatLng({lat: data["latitude"], lng: data["longitude"]}),
          icon: generateWindOnlySensorIcon(image, wind_direction),
          zIndex: 200,
          opacity: marker_default_opacity,
          shape: {coords: [50, 50, 12.5], type: "circle"} // Modify click region
        });
        addMarkerEvent();
        // Fire complete event
        if (typeof (complete_event_callback) == "function") {
          complete_event_callback(this_obj);
        }
      });
      image.src = '/img/wind_only_sensor.png';
    }

    function createPM25Marker() {
      // TODO: no_data_txt should be different for current day and previous day cases
      var no_data_txt = "No data in last hour";
      var sensor_value = data["sensor_value"];
      var sensor_data_time = data["sensor_data_time"];
      var sensor_time_txt = "";
      var wind_speed = data["wind_speed"];
      var has_sensor = !(isNaN(sensor_value) || sensor_value < 0);
      var sensor_txt = has_sensor ? sensor_value + " &mu;g/m<sup>3</sup>" : no_data_txt;
      if (typeof sensor_data_time !== "undefined" && has_sensor) {
        var sensor_time = new Date(sensor_data_time);
        sensor_time_txt = " at time " + padTimeString(sensor_time.getHours() + 1) + ":" + padTimeString(sensor_time.getMinutes() + 1);
      }

      // Create HTML content for the info window
      html_content = "";
      html_content += "<b>Name:</b> " + data["name"] + "<br>";
      if (data["is_current_day"]) {
        html_content += "<b>Latest PM<sub>2.5</sub>:</b> " + sensor_txt + sensor_time_txt + "<br>";
        if (typeof wind_speed !== "undefined") {
          var wind_txt = (isNaN(wind_speed) || wind_speed < 0) ? no_data_txt : wind_speed + " MPH";
          var wind_time = new Date(data["wind_data_time"]);
          var wind_time_txt = " at time " + padTimeString(wind_time.getHours() + 1) + ":" + padTimeString(wind_time.getMinutes() + 1);
          html_content += '<b>Latest Wind Speed:</b> ' + wind_txt + wind_time_txt;
        }
      } else {
        html_content += "<b>Maximum PM<sub>2.5</sub>:</b> " + sensor_txt + sensor_time_txt;
      }

      var sensor_icon_idx = sensorValToIconIndex(sensor_value);
      var wind_direction = data["wind_direction"];
      var image = new Image();

      // Create google map marker
      image.addEventListener("load", function () {
        google_map_marker = new google.maps.Marker({
          position: new google.maps.LatLng({lat: data["latitude"], lng: data["longitude"]}),
          icon: generatePM25SensorIcon(image, wind_direction),
          zIndex: sensor_icon_idx + 5,
          opacity: marker_default_opacity,
          shape: {coords: [50, 50, 12.5], type: "circle"} // Modify click region
        });
        addMarkerEvent();
        // Fire complete event
        if (typeof (complete_event_callback) == "function") {
          complete_event_callback(this_obj);
        }
      });
      image.src = getPM25SensorIconURL(sensor_icon_idx, (typeof wind_direction != "undefined"));
    }

    function generateWindOnlySensorIcon(image, wind_direction) {
      var icon_size = 100;
      var icon_size_half = 50;

      var rotation_degree;
      if (typeof wind_direction != "undefined") {
        // The direction given by ACHD is the direction _from_ which the wind is coming.
        // We reverse it to show where the wind is going to. (+180)
        // Also, the arrow we start with is already rotated 90 degrees, so we need to account for this. (-90)
        // This means we add 90 to the wind direction value for the correct angle of the wind arrow.
        rotation_degree = wind_direction + 90;
      } else {
        rotation_degree = 0;
      }

      return {
        url: getRotatedMarker(image, rotation_degree),
        scaledSize: new google.maps.Size(icon_size, icon_size),
        size: new google.maps.Size(icon_size, icon_size),
        anchor: new google.maps.Point(icon_size_half, icon_size_half),
        origin: new google.maps.Point(0, 0)
      };
    }

    function generatePM25SensorIcon(image, wind_direction) {
      var icon_size = 100;
      var icon_size_half = 50;

      var rotation_degree;
      if (typeof wind_direction != "undefined") {
        // The direction given by ACHD is the direction _from_ which the wind is coming.
        // We reverse it to show where the wind is going to. (+180)
        // Also, the arrow we start with is already rotated 90 degrees, so we need to account for this. (-90)
        // This means we add 90 to the wind direction value for the correct angle of the wind arrow.
        rotation_degree = wind_direction + 90;
      } else {
        rotation_degree = 0;
      }

      return {
        url: getRotatedMarker(image, rotation_degree),
        scaledSize: new google.maps.Size(icon_size, icon_size),
        size: new google.maps.Size(icon_size, icon_size),
        anchor: new google.maps.Point(icon_size_half, icon_size_half),
        origin: new google.maps.Point(0, 0)
      };
    }

    function getPM25SensorIconURL(sensor_icon_idx, has_wind) {
      var path = "/img/";
      var sensor_icon_all = ["PM25_0.png", "PM25_1.png", "PM25_2.png", "PM25_3.png", "PM25_4.png", "PM25_5.png"];
      var sensor_icon_wind_all = ["PM25_0_wind.png", "PM25_1_wind.png", "PM25_2_wind.png", "PM25_3_wind.png", "PM25_4_wind.png", "PM25_5_wind.png"];
      var sensor_icon = has_wind ? sensor_icon_wind_all[sensor_icon_idx] : sensor_icon_all[sensor_icon_idx];
      return path + sensor_icon;
    }

    function sensorValToIconIndex(sensor_value) {
      var scale;
      if (marker_type == "PM25") {
        scale = [12, 35.4, 55.4, 150.4];
      } else if (marker_type == "VOC") {
        scale = [400, 600, 800, 1000];
      } else {
        return null;
      }

      if (isNaN(sensor_value) || sensor_value < 0) {
        return 0;
      } else if (sensor_value >= 0 && sensor_value <= scale[0]) {
        return 1;
      } else if (sensor_value > scale[0] && sensor_value <= scale[1]) {
        return 2;
      } else if (sensor_value > scale[1] && sensor_value <= scale[2]) {
        return 3;
      } else if (sensor_value > scale[2] && sensor_value <= scale[3]) {
        return 4;
      } else {
        return 5;
      }
    }

    function padTimeString(str) {
      return ("0" + str).slice(-2);
    }

    function sanitize(str) {
      return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function getRotatedMarker(image, degree) {
      var angle = degree * Math.PI / 180;
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

    function createVOCMarker() {
      // TODO: no_data_txt should be different for current day and previous day cases
      var no_data_txt = "No data in last hour";
      var sensor_value = data["sensor_value"];
      var sensor_data_time = data["sensor_data_time"];
      var sensor_time_txt = "";
      var has_sensor = !(isNaN(sensor_value) || sensor_value < 0);
      var sensor_txt = has_sensor ? sensor_value + " ppb" : no_data_txt;
      if (typeof sensor_data_time !== "undefined" && has_sensor) {
        var sensor_time = new Date(sensor_data_time);
        sensor_time_txt = " at time " + padTimeString(sensor_time.getHours() + 1) + ":" + padTimeString(sensor_time.getMinutes() + 1);
      }

      // Create HTML content for the info window
      html_content = "";
      html_content += "<b>Name:</b> " + data["name"] + "<br>";
      if (data["is_current_day"]) {
        html_content += "<b>Latest VOC:</b> " + sensor_txt + sensor_time_txt;
      } else {
        html_content += "<b>Maximum VOC:</b> " + sensor_txt + sensor_time_txt;
      }

      var sensor_icon_idx = sensorValToIconIndex(sensor_value);

      // Create google map marker
      google_map_marker = new google.maps.Marker({
        position: new google.maps.LatLng({lat: data["latitude"], lng: data["longitude"]}),
        icon: generateVOCSensorIcon(sensor_icon_idx, 24),
        zIndex: sensor_icon_idx + 5,
        opacity: marker_default_opacity
      });
      addMarkerEvent();

      // Fire complete event
      if (typeof (complete_event_callback) == "function") {
        complete_event_callback(this_obj);
      }
    }

    function generateVOCSensorIcon(sensor_icon_idx, icon_size) {
      var icon_size_half = icon_size / 2;

      return {
        url: getVOCSensorIconURL(sensor_icon_idx),
        scaledSize: new google.maps.Size(icon_size, icon_size),
        size: new google.maps.Size(icon_size, icon_size),
        anchor: new google.maps.Point(icon_size_half, icon_size_half),
        origin: new google.maps.Point(0, 0)
      };
    }

    function getVOCSensorIconURL(sensor_icon_idx) {
      var path = "/img/";
      var sensor_icon_all = ["voc_0.png", "voc_1.png", "voc_2.png", "voc_3.png", "voc_4.png", "voc_5.png"];
      var sensor_icon = sensor_icon_all[sensor_icon_idx];
      return path + sensor_icon;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Privileged methods
    //
    var updateIconByZoomLevel = function (zoom_level) {
      if (marker_type == "smell") {
        var desired_icon_size = zoom_level_to_icon_size[zoom_level];
        if (current_icon_size == desired_icon_size) return;
        current_icon_size = desired_icon_size;
        google_map_marker.setIcon(generateSmellIcon(data["smell_value"], zoom_level, desired_icon_size));
      }
    };
    this.updateIconByZoomLevel = updateIconByZoomLevel;

    var reset = function () {
      if (marker_type == "smell") {
        google_map_marker.setOpacity(marker_default_opacity);
        google_map_marker.setZIndex(data["smell_value"]);
      }
    };
    this.reset = reset;

    var getContent = function () {
      return html_content;
    };
    this.getContent = getContent;

    var getData = function () {
      return data;
    };
    this.getData = getData;

    var setMap = function (google_map) {
      google_map_marker.setMap(google_map);
    };
    this.setMap = setMap;

    var setZIndex = function (z_index) {
      google_map_marker.setZIndex(z_index);
    };
    this.setZIndex = setZIndex;

    var setOpacity = function (opacity) {
      google_map_marker.setOpacity(opacity);
    };
    this.setOpacity = setOpacity;

    var getGoogleMapMarker = function () {
      return google_map_marker;
    };
    this.getGoogleMapMarker = getGoogleMapMarker;

    var getMarkerType = function () {
      return marker_type;
    };
    this.getMarkerType = getMarkerType;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor
    //
    init();
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Register to window
  //
  if (!window.CustomMapMarker) {
    window.CustomMapMarker = CustomMapMarker;
  }
})();