/*************************************************************************
 * This class is developed by Yen-Chia Hsu
 * Dependencies: jQuery and Google Maps JavaScript API
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
      if (marker_type == "smell") {
        createSmellMarker();
      } else if (marker_type == "sensor") {
        createSensorMarker();
      }

      addMarkerEvent();
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
      var feelings_symptoms = data["feelings_symptoms"] ? data["feelings_symptoms"] : "No data.";
      var smell_description = data["smell_description"] ? data["smell_description"] : "No data.";
      var smell_value = data["smell_value"];

      current_icon_size = zoom_level_to_icon_size[init_zoom_level];
      html_content = "";
      html_content += "<b>Date:</b> " + (new Date(data["created_at"] * 1000)).toLocaleString() + "<br>";
      html_content += "<b>Smell Rating:</b> " + smell_value + " (" + smell_value_to_text[smell_value - 1] + ")<br>";
      html_content += "<b>Symptoms:</b> " + feelings_symptoms + "<br>";
      html_content += "<b>Smell Description:</b> " + smell_description;

      google_map_marker = new google.maps.Marker({
        position: new google.maps.LatLng({lat: data["latitude"], lng: data["longitude"]}),
        icon: generateSmellIcon(smell_value, init_zoom_level, current_icon_size),
        zIndex: smell_value,
        opacity: marker_default_opacity
      });
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

    function createSensorMarker() {
      var PM25_value = data["PM25_value"];
      var sensor_icon_idx = sensorValToIconIndex(PM25_value);
      var no_data_txt = "No data in last four hours.";
      var txt = (isNaN(PM25_value) || PM25_value < 0) ? no_data_txt : PM25_value + " &mu;g/m<sup>3</sup>";

      html_content = "";
      html_content += "<b>Name:</b> " + data["name"] + "<br>";
      if (data["is_current_day"]) {
        html_content += "<b>Latest PM<sub>2.5</sub>:</b> " + txt + "<br>";
        html_content += "<b>Latest Reported Date:</b> " + (new Date(data["data_time"])).toLocaleString();
      } else {
        html_content += "<b>Maximum PM<sub>2.5</sub>:</b> " + txt;
      }

      google_map_marker = new google.maps.Marker({
        position: new google.maps.LatLng({lat: data["latitude"], lng: data["longitude"]}),
        icon: generateSensorIcon(sensor_icon_idx),
        zIndex: sensor_icon_idx,
        opacity: marker_default_opacity,
        shape: {coords: [50, 50, 12.5], type: "circle"} // Modify click region
      });
    }

    function generateSensorIcon(sensor_icon_idx) {
      var icon_size = 100;
      var icon_size_half = 50;

      return {
        url: getSensorIconURL(sensor_icon_idx),
        scaledSize: new google.maps.Size(icon_size, icon_size),
        size: new google.maps.Size(icon_size, icon_size),
        anchor: new google.maps.Point(icon_size_half, icon_size_half),
        origin: new google.maps.Point(0, 0)
      };
    }

    function getSensorIconURL(sensor_icon_idx) {
      var path = "/img/";
      var sensor_icon_all = ["sensor_0.png", "sensor_1.png", "sensor_2.png", "sensor_3.png", "sensor_4.png", "sensor_5.png"];
      return path + sensor_icon_all[sensor_icon_idx];
    }

    function sensorValToIconIndex(sensor_value) {
      var scale = [12, 35.4, 55.4, 150.4];
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

    var getTimestamp = function () {
      if (marker_type == "smell") {
        return data["created_at"];
      }
    }
    this.getTimestamp = getTimestamp;

    var getSmellValue = function () {
      if (marker_type == "smell") {
        return data["smell_value"];
      }
    };
    this.getSmellValue = getSmellValue;

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